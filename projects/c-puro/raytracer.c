/*
 * Ray tracer em C puro.
 *
 * Nenhuma biblioteca grafica, nenhuma dependencia: o programa recebe um bloco
 * de memoria e escreve pixel a pixel nele. A pagina pega esse mesmo bloco e
 * joga no canvas. Isto e C fazendo o que C faz melhor — aritmetica sobre um
 * buffer, sem camada nenhuma no meio.
 *
 * Compilado para WebAssembly:
 *   emcc raytracer.c -O3 -o raytracer.js ...
 */

#include <math.h>
#include <stdint.h>
#include <stdlib.h>

/* ---------------------------------------------------------------- vetores */

typedef struct { float x, y, z; } Vec;

static inline Vec v(float x, float y, float z)      { Vec r = {x, y, z}; return r; }
static inline Vec soma(Vec a, Vec b)                { return v(a.x+b.x, a.y+b.y, a.z+b.z); }
static inline Vec sub(Vec a, Vec b)                 { return v(a.x-b.x, a.y-b.y, a.z-b.z); }
static inline Vec mul(Vec a, float k)               { return v(a.x*k, a.y*k, a.z*k); }
static inline Vec mulv(Vec a, Vec b)                { return v(a.x*b.x, a.y*b.y, a.z*b.z); }
static inline float dot(Vec a, Vec b)               { return a.x*b.x + a.y*b.y + a.z*b.z; }
static inline float comprimento(Vec a)              { return sqrtf(dot(a, a)); }
static inline Vec norm(Vec a)                       { float c = comprimento(a); return c > 0 ? mul(a, 1.0f/c) : a; }
static inline Vec cross(Vec a, Vec b) {
    return v(a.y*b.z - a.z*b.y, a.z*b.x - a.x*b.z, a.x*b.y - a.y*b.x);
}
static inline Vec reflete(Vec d, Vec n)             { return sub(d, mul(n, 2.0f * dot(d, n))); }

/* ------------------------------------------------------------------ cena  */

typedef struct {
    Vec  centro;
    float raio;
    Vec  cor;
    float reflexo;   /* 0 = fosco, 1 = espelho */
    float brilho;    /* expoente especular */
} Esfera;

#define MAX_ESFERAS 8

static Esfera esferas[MAX_ESFERAS];
static int    n_esferas = 0;

static Vec  luz_pos   = {-6.0f, 8.0f, -4.0f};
static float plano_y  = -1.0f;

/* Buffer de saida (RGBA, 8 bits por canal). Cresce sob demanda e e reusado
 * entre quadros: realocar 1MB a 60fps seria a maior fonte de custo do laco. */
static uint8_t *buffer = NULL;
static int      buffer_cap = 0;

/* Contador de raios lancados — a pagina mostra para dar noção do custo real. */
static long raios = 0;

/* ------------------------------------------------------------- intersecao */

/* Retorna a distancia ate a esfera, ou -1 se o raio nao a atinge.
 * Formula fechada da equacao do segundo grau: sem iteracao, sem aproximacao. */
static float bate_esfera(Vec origem, Vec dir, const Esfera *e) {
    Vec  oc = sub(origem, e->centro);
    float b = dot(oc, dir);
    float c = dot(oc, oc) - e->raio * e->raio;
    float disc = b*b - c;
    if (disc < 0.0f) return -1.0f;

    float raiz = sqrtf(disc);
    float t = -b - raiz;                 /* a raiz menor e a face da frente */
    if (t > 0.001f) return t;
    t = -b + raiz;                       /* camera dentro da esfera */
    return t > 0.001f ? t : -1.0f;
}

static float bate_plano(Vec origem, Vec dir) {
    if (fabsf(dir.y) < 1e-6f) return -1.0f;        /* raio paralelo ao chao */
    float t = (plano_y - origem.y) / dir.y;
    return t > 0.001f ? t : -1.0f;
}

/* Primeiro objeto atingido. id = indice da esfera, ou -2 para o plano. */
static float mais_proximo(Vec origem, Vec dir, int *id) {
    float melhor = 1e30f;
    *id = -1;
    raios++;

    for (int i = 0; i < n_esferas; i++) {
        float t = bate_esfera(origem, dir, &esferas[i]);
        if (t > 0.0f && t < melhor) { melhor = t; *id = i; }
    }

    float tp = bate_plano(origem, dir);
    if (tp > 0.0f && tp < melhor) { melhor = tp; *id = -2; }

    return *id == -1 ? -1.0f : melhor;
}

/* Sombra: basta saber SE existe obstaculo ate a luz, nao qual nem onde.
 * Sair no primeiro que aparece economiza boa parte do custo da cena. */
static int na_sombra(Vec ponto, Vec dir_luz, float dist_luz) {
    raios++;
    for (int i = 0; i < n_esferas; i++) {
        float t = bate_esfera(ponto, dir_luz, &esferas[i]);
        if (t > 0.001f && t < dist_luz) return 1;
    }
    return 0;
}

/* ---------------------------------------------------------------- traçado */

static Vec ceu(Vec dir) {
    float t = 0.5f * (dir.y + 1.0f);
    Vec baixo = v(0.02f, 0.03f, 0.06f);
    Vec cima  = v(0.05f, 0.11f, 0.20f);
    return soma(mul(baixo, 1.0f - t), mul(cima, t));
}

static Vec tracar(Vec origem, Vec dir, int profundidade) {
    if (profundidade <= 0) return v(0, 0, 0);

    int id;
    float t = mais_proximo(origem, dir, &id);
    if (t < 0.0f) return ceu(dir);

    Vec ponto = soma(origem, mul(dir, t));
    Vec normal, albedo;
    float reflexo, brilho;

    if (id == -2) {
        normal = v(0, 1, 0);
        /* Xadrez: a paridade da soma das coordenadas inteiras. floorf importa —
         * com cast para int, x entre -1 e 0 truncaria para 0 e o padrao
         * espelharia em torno da origem. */
        int xadrez = ((int)(floorf(ponto.x) + floorf(ponto.z))) & 1;
        albedo  = xadrez ? v(0.16f, 0.18f, 0.22f) : v(0.07f, 0.08f, 0.11f);
        reflexo = 0.22f;
        brilho  = 30.0f;
    } else {
        const Esfera *e = &esferas[id];
        normal  = norm(sub(ponto, e->centro));
        albedo  = e->cor;
        reflexo = e->reflexo;
        brilho  = e->brilho;
    }

    Vec  para_luz = sub(luz_pos, ponto);
    float dist_luz = comprimento(para_luz);
    para_luz = mul(para_luz, 1.0f / dist_luz);

    Vec desloc = soma(ponto, mul(normal, 0.001f));  /* evita auto-sombra */
    float sombra = na_sombra(desloc, para_luz, dist_luz) ? 0.0f : 1.0f;

    float difusa = fmaxf(0.0f, dot(normal, para_luz)) * sombra;

    /* Especular de Blinn-Phong: mais barato que Phong e sem o artefato de
     * corte quando a luz passa de 90 graus. */
    Vec meio = norm(sub(para_luz, dir));
    float espec = powf(fmaxf(0.0f, dot(normal, meio)), brilho) * sombra;

    Vec ambiente = mul(albedo, 0.12f);
    Vec cor = soma(ambiente, mul(albedo, difusa * 0.9f));
    cor = soma(cor, mul(v(1.0f, 0.97f, 0.9f), espec * 0.55f));

    if (reflexo > 0.0f) {
        Vec dir_r = norm(reflete(dir, normal));
        Vec r = tracar(desloc, dir_r, profundidade - 1);
        cor = soma(mul(cor, 1.0f - reflexo), mul(r, reflexo));
    }

    return cor;
}

/* ------------------------------------------------------------------- API  */

void definir_cena(float tempo) {
    n_esferas = 0;

    /* Esfera espelhada, subindo e descendo */
    esferas[n_esferas++] = (Esfera){ v(0.0f, 0.15f + 0.25f * sinf(tempo), 0.0f), 1.0f,
                                     v(0.92f, 0.94f, 0.97f), 0.75f, 180.0f };

    /* Duas coloridas orbitando */
    float a = tempo * 0.7f;
    esferas[n_esferas++] = (Esfera){ v(2.1f * cosf(a), -0.35f, 2.1f * sinf(a)), 0.62f,
                                     v(0.16f, 0.83f, 0.60f), 0.18f, 60.0f };
    esferas[n_esferas++] = (Esfera){ v(2.1f * cosf(a + 3.1416f), -0.35f, 2.1f * sinf(a + 3.1416f)), 0.62f,
                                     v(0.13f, 0.72f, 0.93f), 0.18f, 60.0f };

    /* Uma pequena, fosca, parada — referencia para comparar reflexo */
    esferas[n_esferas++] = (Esfera){ v(-1.5f, -0.62f, -1.7f), 0.38f,
                                     v(0.95f, 0.72f, 0.25f), 0.0f, 20.0f };
}

uint8_t *obter_buffer(int largura, int altura) {
    int precisa = largura * altura * 4;
    if (precisa > buffer_cap) {
        free(buffer);
        buffer = (uint8_t *)malloc(precisa);
        buffer_cap = buffer ? precisa : 0;
    }
    return buffer;
}

long raios_lancados(void) { return raios; }

/*
 * Desenha um quadro inteiro.
 *
 * aa  = raiz do numero de amostras por pixel (2 => 4 amostras, 3 => 9).
 * prof = quantas reflexoes seguir.
 */
void renderizar(int largura, int altura, int aa, int prof,
                float cam_ang, float cam_alt, float tempo) {
    uint8_t *px = obter_buffer(largura, altura);
    if (!px) return;

    raios = 0;
    definir_cena(tempo);

    float dist = 6.2f;
    Vec olho = v(sinf(cam_ang) * dist, 1.1f + cam_alt * 2.2f, cosf(cam_ang) * dist);
    Vec alvo = v(0.0f, 0.0f, 0.0f);

    Vec frente  = norm(sub(alvo, olho));
    Vec direita = norm(cross(v(0, 1, 0), frente));
    Vec cima    = cross(frente, direita);

    float aspecto = (float)largura / (float)altura;
    float escala  = 1.0f / (float)aa;

    for (int y = 0; y < altura; y++) {
        for (int x = 0; x < largura; x++) {
            Vec acc = v(0, 0, 0);

            /* Supersampling em grade: amostras espalhadas dentro do pixel.
             * O deslocamento de meio passo centraliza a grade — sem ele a
             * imagem inteira escorrega meio pixel para um canto. */
            for (int sy = 0; sy < aa; sy++) {
                for (int sx = 0; sx < aa; sx++) {
                    float px_x = x + (sx + 0.5f) * escala;
                    float px_y = y + (sy + 0.5f) * escala;

                    float u = (2.0f * px_x / largura  - 1.0f) * aspecto;
                    float w = (1.0f - 2.0f * px_y / altura);

                    Vec dir = norm(soma(soma(mul(direita, u), mul(cima, w)),
                                        mul(frente, 1.7f)));
                    acc = soma(acc, tracar(olho, dir, prof));
                }
            }

            acc = mul(acc, escala * escala);

            /* Correcao de gama: sem ela a imagem sai escura demais, porque o
             * monitor nao e linear e o calculo acima e. */
            float r = powf(fminf(1.0f, fmaxf(0.0f, acc.x)), 1.0f / 2.2f);
            float g = powf(fminf(1.0f, fmaxf(0.0f, acc.y)), 1.0f / 2.2f);
            float b = powf(fminf(1.0f, fmaxf(0.0f, acc.z)), 1.0f / 2.2f);

            int i = (y * largura + x) * 4;
            px[i + 0] = (uint8_t)(r * 255.0f + 0.5f);
            px[i + 1] = (uint8_t)(g * 255.0f + 0.5f);
            px[i + 2] = (uint8_t)(b * 255.0f + 0.5f);
            px[i + 3] = 255;
        }
    }
}

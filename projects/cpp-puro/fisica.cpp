/*
 * Motor de fisica 2D com milhares de corpos.
 *
 * Integracao de Verlet + grade espacial para colisao. O ponto do projeto e a
 * grade: sem ela, testar todo par de corpos e O(n^2) — com 3.000 corpos daria
 * 4,5 milhoes de testes por quadro e nada rodaria a 60fps. Com a grade, cada
 * corpo so conversa com quem esta nas nove celulas ao redor.
 *
 * Compilado com em++ -O3 -std=c++20.
 */

#include <cmath>
#include <cstdint>
#include <vector>
#include <algorithm>

namespace {

struct Corpo {
    float x, y;            // posicao atual
    float px, py;          // posicao do quadro anterior (Verlet guarda isso no lugar da velocidade)
    float raio;
    uint8_t cor;
};

std::vector<Corpo> corpos;

float mundo_l = 800.0f;
float mundo_a = 500.0f;
float gravidade = 900.0f;

/* --- Grade espacial ---------------------------------------------------
 * celulas[c] guarda os indices dos corpos naquela celula. Reconstruida a cada
 * quadro: limpar e reinserir e mais barato que manter incremental, porque
 * quase todo corpo muda de celula a todo instante.
 */
int grade_cols = 0, grade_lins = 0;
float celula = 0.0f;
std::vector<std::vector<int>> celulas;

/* Estatisticas que a pagina mostra — sem elas o custo fica invisivel. */
long testes_colisao = 0;

void reconstruir_grade() {
    // Celula do tamanho do maior diametro: garante que dois corpos que se
    // tocam estao sempre em celulas vizinhas.
    float maior = 1.0f;
    for (const auto& c : corpos) maior = std::max(maior, c.raio);
    celula = maior * 2.0f;

    grade_cols = std::max(1, (int)(mundo_l / celula) + 1);
    grade_lins = std::max(1, (int)(mundo_a / celula) + 1);

    celulas.assign((size_t)grade_cols * grade_lins, {});

    for (int i = 0; i < (int)corpos.size(); i++) {
        int cx = std::clamp((int)(corpos[i].x / celula), 0, grade_cols - 1);
        int cy = std::clamp((int)(corpos[i].y / celula), 0, grade_lins - 1);
        celulas[(size_t)cy * grade_cols + cx].push_back(i);
    }
}

void resolver_par(Corpo& a, Corpo& b) {
    float dx = b.x - a.x;
    float dy = b.y - a.y;
    float d2 = dx * dx + dy * dy;
    float soma = a.raio + b.raio;

    // Comparar o quadrado evita a raiz quadrada no caso comum (nao colidiram),
    // que e a esmagadora maioria dos testes.
    if (d2 >= soma * soma || d2 < 1e-8f) return;

    float d = std::sqrt(d2);
    float sobreposicao = 0.5f * (soma - d);
    float nx = dx / d, ny = dy / d;

    // Empurra os dois pela metade da sobreposicao. Massa proporcional ao raio
    // ao quadrado faria o pequeno ceder mais; aqui a divisao e igual de
    // proposito, para o amontoado ficar estavel.
    a.x -= nx * sobreposicao;
    a.y -= ny * sobreposicao;
    b.x += nx * sobreposicao;
    b.y += ny * sobreposicao;
}

void colisoes() {
    testes_colisao = 0;

    for (int cy = 0; cy < grade_lins; cy++) {
        for (int cx = 0; cx < grade_cols; cx++) {
            auto& aqui = celulas[(size_t)cy * grade_cols + cx];
            if (aqui.empty()) continue;

            // Apenas metade da vizinhanca: o par (A,B) ja e resolvido quando a
            // celula de A visita a de B. Visitar as nove testaria tudo duas vezes.
            for (int dy = 0; dy <= 1; dy++) {
                for (int dx = (dy == 0 ? 0 : -1); dx <= 1; dx++) {
                    int vx = cx + dx, vy = cy + dy;
                    if (vx < 0 || vy < 0 || vx >= grade_cols || vy >= grade_lins) continue;

                    auto& la = celulas[(size_t)vy * grade_cols + vx];
                    if (la.empty()) continue;

                    bool mesma = (dx == 0 && dy == 0);
                    for (size_t i = 0; i < aqui.size(); i++) {
                        for (size_t j = (mesma ? i + 1 : 0); j < la.size(); j++) {
                            testes_colisao++;
                            resolver_par(corpos[aqui[i]], corpos[la[j]]);
                        }
                    }
                }
            }
        }
    }
}

void bordas() {
    for (auto& c : corpos) {
        if (c.x - c.raio < 0)        c.x = c.raio;
        if (c.x + c.raio > mundo_l)  c.x = mundo_l - c.raio;
        if (c.y - c.raio < 0)        c.y = c.raio;
        if (c.y + c.raio > mundo_a)  c.y = mundo_a - c.raio;
    }
}

/* Buffer entregue ao JavaScript: x, y, raio, cor por corpo. */
std::vector<float> saida;

} // namespace

extern "C" {

void iniciar(int quantos, float largura, float altura) {
    mundo_l = largura;
    mundo_a = altura;
    corpos.clear();
    corpos.reserve(quantos);

    // Distribuicao determinista: gerador congruente linear simples, para a
    // cena ser a mesma a cada visita.
    uint32_t s = 12345u;
    auto aleatorio = [&s]() {
        s = s * 1664525u + 1013904223u;
        return (float)((s >> 8) & 0xFFFFFF) / (float)0xFFFFFF;
    };

    for (int i = 0; i < quantos; i++) {
        Corpo c{};
        c.raio = 2.5f + aleatorio() * 4.0f;
        c.x = c.raio + aleatorio() * (largura - 2 * c.raio);
        c.y = c.raio + aleatorio() * (altura * 0.55f);
        // Diferenca entre posicao e posicao anterior E a velocidade em Verlet.
        c.px = c.x - (aleatorio() - 0.5f) * 3.0f;
        c.py = c.y;
        c.cor = (uint8_t)(aleatorio() * 5.0f);
        corpos.push_back(c);
    }

    saida.assign((size_t)quantos * 4, 0.0f);
}

void redimensionar(float largura, float altura) {
    mundo_l = largura;
    mundo_a = altura;
}

void definir_gravidade(float g) { gravidade = g; }

/*
 * Um passo da simulacao.
 *
 * subpassos: repetir colisao com dt menor e o que impede corpos de
 * atravessarem uns aos outros quando a pilha fica alta.
 */
void passo(float dt, int subpassos, float atrator_x, float atrator_y, float forca) {
    if (subpassos < 1) subpassos = 1;
    float sub_dt = dt / (float)subpassos;

    for (int s = 0; s < subpassos; s++) {
        // Aceleracao
        for (auto& c : corpos) {
            float ax = 0.0f, ay = gravidade;

            if (forca != 0.0f) {
                float dx = atrator_x - c.x;
                float dy = atrator_y - c.y;
                float d2 = dx * dx + dy * dy;
                if (d2 > 25.0f) {
                    float d = std::sqrt(d2);
                    // Cai com a distancia, com teto para nao explodir de perto.
                    float f = forca * 9000.0f / std::max(d2, 400.0f);
                    ax += (dx / d) * f;
                    ay += (dy / d) * f;
                }
            }

            // Verlet: a proxima posicao sai da atual, da anterior e da
            // aceleracao. Nao existe variavel de velocidade.
            float nx = c.x + (c.x - c.px) * 0.999f + ax * sub_dt * sub_dt;
            float ny = c.y + (c.y - c.py) * 0.999f + ay * sub_dt * sub_dt;
            c.px = c.x; c.py = c.y;
            c.x = nx;   c.y = ny;
        }

        reconstruir_grade();
        colisoes();
        bordas();
    }

    for (size_t i = 0; i < corpos.size(); i++) {
        saida[i * 4 + 0] = corpos[i].x;
        saida[i * 4 + 1] = corpos[i].y;
        saida[i * 4 + 2] = corpos[i].raio;
        saida[i * 4 + 3] = (float)corpos[i].cor;
    }
}

float* obter_saida()      { return saida.data(); }
int   quantidade()        { return (int)corpos.size(); }
int   testes_do_quadro()  { return (int)testes_colisao; }
int   celulas_da_grade()  { return grade_cols * grade_lins; }

} // extern "C"

# Mandelbrot escrito em WebAssembly Text

**WebAssembly (WAT) (puro)** · Roda no navegador

Fractal com zoom profundo, calculado por WASM escrito à mão em formato texto — sem nenhuma linguagem de origem.

## Por que este projeto

WAT é o assembly da web. Escrever o fractal direto em instruções de pilha mostra entendimento do que toda linguagem desta página vira no final.

## Como roda

- **Execução:** Compilado para WebAssembly — executa na máquina do visitante
- **Toolchain:** `wat2wasm (wabt)`

## Build

```bash
npm install wabt
node projects/wat-puro/build.mjs
```

`mandelbrot.wasm` (593 bytes) e versionado — a CI nao monta nada.

## Duas pegadinhas do WAT

- **Todo `local` vem antes da primeira instrucao** do corpo da funcao. Nao
  existe declarar no meio, como em C — o montador recusa.
- **`i32.trunc_sat_f64_s`** em vez de `i32.trunc_f64_s`: a versao sem `sat`
  dispara uma armadilha com NaN ou fora de faixa, o que mataria o modulo
  inteiro no meio do quadro.

## O preco de cada abstracao

Todas as demos do laboratorio viram WebAssembly. A diferenca de tamanho nao e
o algoritmo — e o que cada linguagem leva junto:

| linguagem | tamanho | o que vai junto |
|---|---|---|
| WAT (a mao) | **593 B** | nada |
| C++ | 13 KB | `std::vector` e matematica |
| C | 17 KB | `malloc` e matematica |
| Rust | 121 KB | formatacao, `String`, `HashMap` |
| Go | 2,4 MB | escalonador e coletor de lixo |

## Verificado

Centro em (-0,5, 0) preto (dentro do conjunto), 109 cores distintas, 16,7% do
quadro dentro do conjunto na vista inicial. No navegador: 25,7M iteracoes em
186ms na vista inicial, 61,9M em 275ms no vale dos cavalos-marinhos (8000x).

## Publicado em

<https://autarktech.com.br/lab/wat-puro/>

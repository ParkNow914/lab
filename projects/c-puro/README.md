# Ray tracer em C puro

**C (puro)** · Roda no navegador

Renderizador por traçado de raios escrito do zero: esferas, reflexão, sombra e antialiasing, sem nenhuma biblioteca gráfica.

## Por que este projeto

C é aritmética de ponteiro e controle de memória. Um ray tracer é matemática pura escrevendo pixel a pixel num buffer — exatamente o que C faz melhor, e o resultado é visual.

## Como roda

- **Execução:** Compilado para WebAssembly — executa na máquina do visitante
- **Toolchain:** `emcc -O3 -sSTANDALONE_WASM`

## Build

Precisa do Emscripten. Para não obrigar ninguém a instalar a toolchain, o
build roda pela imagem oficial no Docker:

```bash
bash projects/c-puro/build.sh
```

Isso gera `raytracer.js` e `raytracer.wasm`, que **são versionados** junto com o
fonte: é o que o GitHub Pages serve. A CI não compila C — ela só confere que a
página abre e desenha.

## Publicado em

<https://autarktech.com.br/lab/c-puro/>

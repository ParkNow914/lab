# Motor de física 2D do zero

**C++ (puro)** · Roda no navegador

Corpos rígidos com integração de Verlet, colisão por SAT e resolução de impulso. Arraste os objetos e veja a simulação reagir.

## Por que este projeto

C++ vive onde performance encontra abstração. Um motor de física usa templates, RAII e structs alinhadas — e roda a 60fps com centenas de corpos.

## Como roda

- **Execução:** Compilado para WebAssembly — executa na máquina do visitante
- **Toolchain:** `em++ -O3 -std=c++20`

## Build

Precisa do Emscripten; o build roda pela imagem oficial no Docker:

```bash
bash projects/cpp-puro/build.sh
```

`fisica.js` e `fisica.wasm` sao versionados junto com o fonte — a CI nao
compila C++, so confere que a pagina abre e simula.

## Numeros medidos

| corpos | subpassos | ms por passo | testes de colisao | reducao vs todos-contra-todos |
|---|---|---|---|---|
| 1.000 | 2 | 0,13 | 2.830 | 177x |
| 3.000 | 2 | 0,51 | 18.432 | 244x |
| 6.000 | 2 | 1,64 | 70.365 | 256x |
| 3.000 | 4 | 1,34 | 17.107 | 263x |

## Publicado em

<https://autarktech.com.br/lab/cpp-puro/>

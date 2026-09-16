#!/usr/bin/env bash
# Compila o motor de fisica para WebAssembly pela imagem oficial do Emscripten.
#   bash projects/cpp-puro/build.sh
set -euo pipefail
pasta="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
docker run --rm -v "${pasta}:/src" -w /src emscripten/emsdk:latest \
  em++ fisica.cpp -O3 -std=c++20 -o fisica.js \
    -sMODULARIZE=1 -sEXPORT_NAME=criarFisica \
    -sEXPORTED_FUNCTIONS='["_iniciar","_passo","_obter_saida","_quantidade","_testes_do_quadro","_celulas_da_grade","_definir_gravidade","_redimensionar"]' \
    -sEXPORTED_RUNTIME_METHODS='["cwrap","HEAPF32"]' \
    -sALLOW_MEMORY_GROWTH=1 -sENVIRONMENT=web -sFILESYSTEM=0 --closure 0
ls -lh "${pasta}/fisica.js" "${pasta}/fisica.wasm"

#!/usr/bin/env bash
# Compila o ray tracer para WebAssembly usando a imagem oficial do Emscripten,
# para nao exigir que ninguem instale a toolchain para mexer no projeto.
#
#   bash projects/c-puro/build.sh
#
# Saida: raytracer.js + raytracer.wasm, versionados junto com o fonte. Sao os
# arquivos que o GitHub Pages serve; a CI nao compila C.
set -euo pipefail

pasta="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

docker run --rm -v "${pasta}:/src" -w /src emscripten/emsdk:latest \
  emcc raytracer.c -O3 -o raytracer.js \
    -sMODULARIZE=1 \
    -sEXPORT_NAME=criarRaytracer \
    -sEXPORTED_FUNCTIONS='["_renderizar","_obter_buffer","_raios_lancados","_malloc","_free"]' \
    -sEXPORTED_RUNTIME_METHODS='["cwrap","HEAPU8"]' \
    -sALLOW_MEMORY_GROWTH=1 \
    -sENVIRONMENT=web \
    -sFILESYSTEM=0 \
    --closure 0

echo
ls -lh "${pasta}/raytracer.js" "${pasta}/raytracer.wasm"

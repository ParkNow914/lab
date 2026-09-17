#!/usr/bin/env bash
# Compila o labirinto para JavaScript. Nim tem backend JS nativo: nao ha
# emscripten nem WASM no caminho.
set -euo pipefail
pasta="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
docker run --rm -v "${pasta}:/src" -w /src nimlang/nim:latest \
  nim js -d:release --out:labirinto.js labirinto.nim
ls -lh "${pasta}/labirinto.js"

#!/usr/bin/env bash
# Compila a maquina de estados para JavaScript e CAPTURA o erro do compilador
# na versao incompleta — a pagina mostra a saida real, nao uma imitacao.
set -euo pipefail
pasta="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

docker run --rm -v "${pasta}:/src" -w /src dart:stable sh -c '
  dart pub get --offline 2>/dev/null || true
  dart compile js -O2 -o pedido.js lib/pedido.dart
  # A compilacao abaixo DEVE falhar; o erro e o produto.
  dart analyze exemplo/falta_um_caso.dart > erro_compilador.txt 2>&1 || true
'
ls -lh "${pasta}/pedido.js"

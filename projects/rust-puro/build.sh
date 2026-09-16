#!/usr/bin/env bash
# Compila o interpretador para WebAssembly sem wasm-bindgen: so o alvo
# wasm32-unknown-unknown e uma ponte manual de memoria.
#
#   bash projects/rust-puro/build.sh
set -euo pipefail
pasta="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

docker run --rm -v "${pasta}:/src" -w /src rust:1-slim sh -c '
  rustup target add wasm32-unknown-unknown
  cargo test --release
  cargo build --release --target wasm32-unknown-unknown
'

cp "${pasta}/target/wasm32-unknown-unknown/release/linguagem.wasm" "${pasta}/linguagem.wasm"
ls -lh "${pasta}/linguagem.wasm"

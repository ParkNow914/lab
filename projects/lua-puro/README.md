# Sandbox de script para regras de jogo

**Lua (puro)** · Roda no navegador

Escreva script Lua no navegador para controlar entidades numa cena — com limite de memória e de instruções aplicado pelo host.

## Por que este projeto

Lua existe para ser embarcada com segurança em outro programa. Sandbox com orçamento de CPU é exatamente por que Roblox, WoW e Neovim a escolheram.

## Como roda

- **Execução:** Compilado para WebAssembly — executa na máquina do visitante
- **Toolchain:** `Wasmoon (Lua 5.4 em WASM)`

## Build

Nenhum. A página é servida como está; a linguagem roda no navegador por um
runtime carregado via CDN.

## Publicado em

<https://autarktech.com.br/lab/lua-puro/>

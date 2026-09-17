#!/bin/sh
# Grava a sessao. O que entra no .cast e exatamente o que apareceu no
# terminal — os comandos sao digitados por um roteiro para a gravacao caber
# em pouco mais de um minuto, mas quem responde e o Erlang de verdade.
set -e

# 100 colunas: com as 80 padrao, a linha do diff quebra no meio e o editor de
# linha do shell Erlang redesenha os pedacos, o que fica ilegivel na gravacao.
stty cols 100 rows 28 2>/dev/null || true

exec asciinema rec /saida/sessao.cast   --overwrite   --title "Troca a quente de codigo em Erlang"   --idle-time-limit 2   --command "/app/sessao.exp"

# Máquina de estados que o compilador vigia

**Dart 3 (puro)** · Roda no navegador · compilado com dart2js · 54 KB de JavaScript

Fluxo de pedido com sete estados, modelado com classes seladas e pattern matching.

## Por que este projeto

Isolates seriam a escolha óbvia para Dart — mas **não existem no dart2js**, e prometer
isso numa página web seria falso. Classe selada com `switch` exaustivo é o recurso de
destaque do Dart 3, funciona na web, e resolve um problema real: estado novo esquecido
em algum lugar do código.

## O mecanismo

Uma classe selada tem um conjunto **fechado** de subclasses conhecidas. O Dart recusa um
`switch` que não cubra todas. Nenhum dos switches do projeto tem `default` — é a ausência
dele que faz o compilador trabalhar.

## O erro é real, não imitado

`exemplo/falta_um_caso.dart` cria um estado `Cancelado` e não o trata. O build roda
`dart analyze` nele e grava a saída em `erro_compilador.txt`, que a página exibe:

```
error - falta_um_caso.dart:14:31 - The type 'Estado' isn't exhaustively matched by
the switch cases since it doesn't match the pattern 'Cancelado()'. Try adding a
wildcard pattern or cases that match 'Cancelado()'. - non_exhaustive_switch_expression
```

O compilador não só recusa: diz qual caso falta.

## Build

```bash
bash projects/dart-puro/build.sh
```

Compila `lib/pedido.dart` para `pedido.js` e regrava `erro_compilador.txt`. Os dois são
versionados — a CI não compila Dart.

## Verificado no navegador

Caminho completo: `rascunho → aguardando_pagamento → pago → em_separacao → despachado →
entregue`. Estado final não oferece mais eventos.

Transições inválidas são recusadas mesmo chamando o Dart diretamente:

| tentativa | resposta |
|---|---|
| `rascunho` + `entregar` | de "rascunho" não existe transição por "entregar" |
| `entregue` + `cancelar` | de "entregue" não existe transição por "cancelar" |
| `pago` + `pagar` | de "pago" não existe transição por "pagar" |

## Publicado em

<https://autarktech.com.br/lab/dart-puro/>

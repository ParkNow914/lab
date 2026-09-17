# Interpretador metacircular

**Scheme (puro)** · Roda no navegador

Um Scheme escrito em Scheme, avaliando a si mesmo — o exercício clássico do SICP, com REPL aberto.

## Por que este projeto

O avaliador metacircular é o momento em que se entende o que uma linguagem realmente é. Poucas coisas demonstram fundamento melhor que isso.

## Como roda

- **Execução:** Transpilado para JavaScript — executa na máquina do visitante
- **Toolchain:** `BiwaScheme`

## Build

Nenhum. O BiwaScheme vem por CDN e `metacircular.scm` e carregado como arquivo.

## A ideia

Um Scheme escrito em Scheme. O que o visitante digita e avaliado **duas vezes**:
uma pelo BiwaScheme e outra pelo avaliador que roda dentro dele. Se as duas
respostas batem, o avaliador esta correto.

Nao ha parser: em Lisp **codigo ja e dado**, entao o programa chega como lista
pronta. O trabalho todo e decidir o que cada forma significa.

```
navegador -> JavaScript -> BiwaScheme -> meu avaliador -> o seu programa
```

## As duas linhas que importam

- **Fechamento.** `lambda` nao cria funcao: cria uma LISTA com parametros,
  corpo e *o ambiente onde nasceu*. Esse terceiro item e tudo — sem ele, funcao
  devolvida de dentro de outra esqueceria de onde veio.
- **Escopo lexico.** Ao aplicar, o ambiente estendido e o DA DEFINICAO, nao o
  de quem chamou. Trocar `cadddr procedimento` por "ambiente atual"
  transformaria a linguagem inteira em escopo dinamico. Uma linha decide isso.

## O que entende

`define` `lambda` `if` `cond` `let` `begin` `quote`, mais trinta primitivas.
**Nao** entende macro nem chamada de cauda otimizada — recursao muito profunda
estoura a pilha do hospedeiro.

## Verificado no navegador

As cinco respostas batem entre o BiwaScheme e o avaliador:

| exemplo | resultado |
|---|---|
| fatorial | `479001600` (12!) |
| fechamento | `(6 11 15)` — cada `somador` guarda o proprio `n` |
| ordem superior | `((2 4 6 8 10) 28)` — map e composicao escritos na linguagem |
| codigo e dado | `((+ 1 (* 2 3)) + 3)` — `quote` devolve a lista sem avaliar |
| cond e listas | `("negativo" "zero" "pequeno" "grande")` |

## Publicado em

<https://autarktech.com.br/lab/scheme-puro/>

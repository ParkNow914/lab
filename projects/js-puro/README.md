# Motor reativo em 200 linhas

**JavaScript (puro)** · Roda no navegador · 0 dependências · sem build

O núcleo de reatividade que existe dentro do Vue, do Solid e dos signals do Angular,
reescrito do zero com `Proxy` e `Reflect`.

## Por que este projeto

Todo mundo usa React sem saber o que ele faz por baixo. Reimplementar o núcleo
reativo obriga a entender os três pontos onde framework de verdade ganha ou perde
desempenho:

1. **Rastrear dependência** — ao ler uma propriedade dentro de um efeito, anotar que
   aquele efeito depende dela.
2. **Limpar dependência morta** — antes de reexecutar, apagar as dependências antigas,
   porque um `if` pode ter mudado de ramo. É o passo que quase todo tutorial esquece,
   e é a origem de vazamento de memória e de efeito que dispara sem motivo.
3. **Agrupar atualização** — cinco escritas seguidas devem redesenhar a tela uma vez,
   não cinco.

## A API

```js
import { reativo, efeito, computado, lote } from "./reativo.js";

const estado = reativo({ preco: 100, qtd: 2 });

const total = computado(() => estado.preco * estado.qtd);

efeito(() => {
  console.log("total:", total.valor);   // roda agora e a cada mudança
});

estado.qtd = 3;          // -> "total: 300"

lote(() => {             // duas escritas, um efeito
  estado.preco = 90;
  estado.qtd = 10;
});                      // -> "total: 900"
```

`efeito()` devolve uma função que cancela a inscrição e limpa as dependências.

## Detalhes que não são óbvios

- **`Object.is` em vez de `!==`** no `set`: senão `NaN` dispararia eternamente e
  `-0 → +0` contaria como mudança.
- **`ownKeys` também rastreia**: `for..in` e `Object.keys` são leitura e precisam criar
  dependência, senão adicionar chave nova não redesenha nada.
- **Array dispara `length` junto**: `push` muda o índice e o tamanho; quem itera
  observa o `length`.
- **Escrever no que se lê não vira laço**: `disparar` pula o efeito que está em
  execução no momento.
- **`computado` é preguiçoso**: ao ser invalidado ele só marca-se como sujo e avisa
  quem depende. O recálculo acontece na leitura — e só se alguém realmente ler.

## Build

Nenhum. São ES modules nativos servidos como estão.

## Publicado em

<https://autarktech.com.br/lab/js-puro/>

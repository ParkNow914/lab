# O bug de `key` do React, provado

"Não use o índice como `key`" é repetido em todo tutorial e entendido em quase
nenhum, porque ninguém mostra o estrago. Esta página mostra, em dois cliques.

## O que acontece

Cada linha tem um `<input>` **não controlado** — o valor mora dentro do nó do
DOM — e um botão de estrelas com `useState`, cujo valor mora dentro da
instância do componente. Você anota algo em cada linha e insere uma pessoa no
topo.

Com `key={índice}`, o texto sobre a Ana passa a aparecer do lado do Fábio. Com
`key={pessoa.id}`, cada texto acompanha a pessoa de quem ele fala.

Medido na página:

| ação | `key = índice` | `key = id` |
|---|---|---|
| inserir no topo | 6 anotações na linha errada | nenhuma |
| embaralhar 5 linhas | **0** nós movidos | 2 nós movidos |

## O detalhe que engana

Repare na segunda linha da tabela: **com o índice, o React mexe menos no DOM.**
Embaralhar a lista inteira não move nó nenhum — ele só reescreve o texto de
cada linha onde ela já está.

O índice não é a opção lenta. É a opção mentirosa. O reconciliador emparelha os
filhos pela chave, e a chave `0` do render anterior é a chave `0` do render
novo: para ele é o mesmo componente, então reaproveita a instância e o nó, e
troca só o que mudou. Está fazendo exatamente o que foi mandado, e mais barato.

Chave é identidade. Posição não é identidade.

## Como o número de "anotações na linha errada" é calculado

Não é chutado. Um `useRef` guarda, por id, o texto que o visitante quis
escrever. Depois de cada render, um efeito percorre os `<li>` e compara o valor
que está no `<input>` com o texto que deveria estar ali. A diferença é o erro —
e ele é zero por construção quando a chave é a identidade certa.

Os contadores de nó **criado** e **movido** vêm de um `MutationObserver`. O
observador sozinho não distingue os dois casos: mover um nó existente com
`insertBefore` chega como remoção seguida de inserção, idêntico a criar um nó
novo. Um `WeakSet` com os nós já vistos resolve — se o nó que chegou já passou
por ali, ele foi movido.

## Rodando e reconstruindo

A página é estática; basta abrir. O bundle `app.js` vai versionado no
repositório de propósito: o laboratório inteiro é publicado como arquivo
estático, e ter uma etapa de build só para uma demo tornaria a publicação de
todas as outras mais frágil.

```bash
npm install
npm run build
```

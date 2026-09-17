# Labirinto e A* em Nim

**Nim (puro)** · Roda no navegador · backend JavaScript nativo · 48 KB de JS

Labirinto gerado por escavação com pilha e resolvido duas vezes: com e sem heurística.

## Por que este projeto

Nim tem sintaxe de Python e compila para C nativo **ou** para JavaScript — o mesmo
arquivo, sem uma linha condicional. Um algoritmo de busca mostra as duas coisas ao mesmo
tempo: legibilidade de linguagem de script e um resultado que dá para medir.

## O que a página ensina

A* e Dijkstra são o **mesmo** algoritmo. A única diferença é somar, ou não, uma
estimativa do que falta até o destino. Uma parcela na conta de prioridade.

## O achado que mudou o projeto

A primeira versão gerava um labirinto **perfeito** — exatamente um caminho entre dois
pontos quaisquer. Medindo, a economia do A* foi de só **9%**, o que é um péssimo
argumento para uma página cujo tema é a heurística.

Não é bug: num labirinto perfeito não há rota alternativa para descartar, então saber
"para que lado fica o destino" quase não ajuda. A vantagem do A* aparece quando existem
caminhos concorrentes.

Por isso existe o controle de **corredores extras**, que derruba paredes e cria ciclos:

| aberturas | caminho | A* visitou | Dijkstra visitou | economia |
|---|---|---|---|---|
| 0% (perfeito) | 171 | 237 | 260 | **9%** |
| 10% | 83 | 330 | 520 | **37%** |
| 25% | 67 | 293 | 735 | **60%** |
| 40% | 67 | 535 | 807 | **34%** |

O pico fica por volta de 25%: com pouca abertura não há o que podar, e com abertura
demais o espaço vira campo aberto e os dois exploram muito. A* não é magicamente melhor
— ele é melhor **quando há escolha**.

## Heurística admissível

A estimativa precisa ser otimista, nunca maior que a distância real. Se exagerar, o A*
fica rápido mas pode devolver um caminho que não é o mais curto. Manhattan numa grade
nunca exagera. A página confere isso: se o comprimento do caminho divergir entre os dois,
o número aparece em destaque — seria sinal de heurística inadmissível.

## Build

```bash
bash projects/nim-puro/build.sh
```

`nim js -d:release`. Não há emscripten nem WASM no caminho: o backend JavaScript é do
próprio compilador. `labirinto.js` é versionado — a CI não compila Nim.

## Publicado em

<https://autarktech.com.br/lab/nim-puro/>

# DSL de regra de negócio

**Ruby (puro)** · Roda no navegador

Linguagem interna onde a regra é escrita quase em português — `regra :desconto do aplicar 10.percent quando cliente.vip? end` — construída com metaprogramação.

## Por que este projeto

Ruby é a melhor linguagem do mundo para criar DSL. Isso é o que torna o Rails possível, e quase nenhum portfólio mostra a mecânica por trás.

## Como roda

- **Execução:** Compilado para WebAssembly — executa na máquina do visitante
- **Toolchain:** `ruby.wasm`

## Build

Nenhum. O ruby.wasm (Ruby 3.4.1) vem por CDN e `dsl.rb` e carregado como
arquivo, nao embutido na pagina — o que se le e o que roda.

## Os tres recursos que fazem o truque

- **`instance_eval`** executa um bloco trocando o `self`. E por isso que
  `regra` so existe dentro de `Regras.definir`, e `quando`/`entao` so existem
  dentro de `regra` — sem variavel global e sem poluir nada.
- **`method_missing`** resolve `cliente` e `total` na hora da chamada, contra o
  pedido. Nao estao declarados em lugar nenhum. O par obrigatorio
  `respond_to_missing?` esta la: sem ele `respond_to?` mentiria, que e o erro
  classico de quem aprendeu metaprogramacao pela metade.
- **Blocos** guardam a condicao sem executa-la. `quando { total > 500 }` nao
  compara nada na definicao: guarda o codigo para rodar depois, com outro
  `self`.

## Duas coisas que so apareceram testando

- **A ruby.wasm publicada nao traz a stdlib `json`**: `require "json"` morre
  com LoadError. Em vez de trocar de distribuicao, ha um serializador de vinte
  linhas em `dsl.rb` — o que mantem o "zero dependencias" verdadeiro. Na
  entrada, o JavaScript gera literal Ruby direto, escapando `#` para que
  `#{...}` num dado do visitante nao vire interpolacao.
- **`String.replace("end", ...)` troca a PRIMEIRA ocorrencia.** Os exemplos que
  injetam uma regra a mais colocavam-na dentro da primeira regra, e o Ruby
  reclamava de `regra` indefinido numa instancia de Regra. Agora a insercao usa
  `lastIndexOf("
end")`.

## Verificado no navegador

| cenario | regras que dispararam | total |
|---|---|---|
| VIP com pedido grande | VIP, frete gratis, muitos itens | R$ 1.332,00 |
| primeira compra | boas-vindas, entrega no interior | R$ 383,90 |
| regra nova, ao vivo | frete gratis + bloqueio por valor alto | bloqueado |
| dado que nao existe | nenhuma da regra quebrada | R$ 929,90 |

No ultimo, o erro e informativo: *"nao existe o dado 'score_credito'
(disponiveis: nome, vip, pedidos_anteriores)"*. Falhar alto e melhor que
decidir errado com dado faltando — e as outras regras continuam valendo.

## Publicado em

<https://autarktech.com.br/lab/ruby-puro/>

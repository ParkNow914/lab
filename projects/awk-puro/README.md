# Relatório financeiro numa linha só

**AWK (puro)** · Terminal interativo

Extrato em CSV virando resumo por categoria com totais e média — em um único comando AWK.

## Por que este projeto

AWK é de 1977 e continua sendo a forma mais curta de transformar texto tabular. Densidade é o argumento.

## Como roda

- **Execução:** Interpretador em WebAssembly dentro de um terminal na página
- **Toolchain:** `goawk → WASM`

## Build

```bash
docker run --rm -v "$PWD:/src" -w /src -e GOOS=js -e GOARCH=wasm -e GOFLAGS=-mod=mod   golang:1.23-alpine sh -c 'apk add --no-cache git; go mod tidy;   go build -trimpath -ldflags="-s -w" -o awk.wasm .'
```

`wasm_exec.js` vem do mesmo Go 1.23 (identico ao do go-puro). Nesta imagem ele
fica em `/usr/local/go/misc/wasm/`, e nao em `lib/wasm/`.

`awk.wasm` (4,4 MB) e versionado — a CI nao compila Go.

## Por que roda num Web Worker

O GoAWK **nao aceita contexto de cancelamento**: `interp.Config` nao tem campo
`Context`, e `ExecProgram` nao recebe um. Ou seja, `BEGIN { while (1) {} }` nao
tem como ser interrompido de dentro.

Na thread principal isso travaria a aba do visitante para sempre. No worker, o
laco trava apenas aquela thread; a pagina continua respondendo, mata o worker
com `terminate()` e sobe outro.

Medido: durante os 3 segundos de laco infinito, a pagina **respondeu 42 vezes**
a um `setInterval` de 100ms, e o interpretador seguinte funcionou normalmente.

## Sandbox

`NoExec`, `NoFileReads`, `NoFileWrites` e `Environ: []string{}`: `system()`,
pipe, redirecionamento para arquivo e `getline` de arquivo nao funcionam, nem
se alguem tentar.

## Uma armadilha do formato de log

O log de exemplo esta no formato **combined** do Apache, com fuso:

```
177.32.44.10 - - [16/Sep/2026:08:12:03 -0300] "GET /api/agenda HTTP/1.1" 200 1842 0.042
```

O fuso conta como campo proprio, entao o status e `$9` e nao `$8`. Sem ele, o
timestamp vira um campo so e TODOS os indices a partir do quinto escorregam —
foi exatamente o bug da primeira versao desta pagina, que reportava erro no IP
errado. E o bug classico de quem processa log com AWK.

## Verificado no navegador

| exemplo | resultado |
|---|---|
| soma por categoria | receita 14.930,00 / infra 572,80 / ferramenta 511,90 / imposto 1.024,85 |
| resultado do mes | receita − despesa = 12.820,45, margem 85,9% |
| uma linha so | 75 caracteres de programa para o faturamento do mes |
| analise de log | 45.177.2.19 com 3 erros, mais lenta `/webhook/whatsapp` em 3,120s |
| laco infinito | worker morto em 3s, pagina respondeu 42x durante o travamento |

## Publicado em

<https://autarktech.com.br/lab/awk-puro/>

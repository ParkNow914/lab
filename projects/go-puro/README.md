# Simulador visual de concorrência

**Go (puro)** · Roda no navegador

Pool de workers com goroutines e channels desenhado na tela: tarefas entrando na fila, workers pegando trabalho, deadlock e backpressure acontecendo ao vivo.

## Por que este projeto

Concorrência é a razão de existir do Go. Em vez de explicar channels num texto, o visitante mexe nos parâmetros e vê o escalonador reagindo.

## Como roda

- **Execução:** Compilado para WebAssembly — executa na máquina do visitante
- **Toolchain:** `GOOS=js GOARCH=wasm`

## Build

```bash
docker run --rm -v "$PWD:/src" -w /src -e GOOS=js -e GOARCH=wasm golang:1.23-alpine   sh -c 'go build -trimpath -ldflags="-s -w" -o concorrencia.wasm .          && cp "$(go env GOROOT)/lib/wasm/wasm_exec.js" .'
```

`concorrencia.wasm` e `wasm_exec.js` sao versionados — a CI nao compila Go.

## O tamanho do binario

2,4 MB, contra 17 KB do ray tracer em C. A diferenca nao e o codigo: o Go
embarca o proprio escalonador e o coletor de lixo dentro do binario. E
exatamente isso que permite escrever o resto em poucas linhas. O GitHub Pages
serve com gzip, o que reduz bastante na transferencia.

## Comportamento medido (3,5s por cenario)

| cenario | criadas | feitas | descartadas | fila | ociosos |
|---|---|---|---|---|---|
| equilibrado | 17 | 11 | 0 | 2/8 | 0/4 |
| sobrecarga | 58 | 4 | 46 | 6/6 | 0/2 |
| fila zero | 21 | 17 | 1 | 0/0 | 1/4 |
| ocioso | 5 | 4 | 0 | 0/16 | 9/10 |

## Publicado em

<https://autarktech.com.br/lab/go-puro/>

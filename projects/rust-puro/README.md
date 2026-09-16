# Interpretador de linguagem com REPL

**Rust (puro)** · Roda no navegador

Linguagem de brinquedo completa: lexer, parser de descida recursiva, AST e máquina virtual. REPL aberto para o visitante escrever código.

## Por que este projeto

Rust brilha em software que não pode errar: enums exaustivos, pattern matching e Result tornam um interpretador quase à prova de bala. É o projeto que mostra o sistema de tipos trabalhando a seu favor.

## Como roda

- **Execução:** Compilado para WebAssembly — executa na máquina do visitante
- **Toolchain:** `wasm-pack + wasm-bindgen`

## Build

```bash
bash projects/rust-puro/build.sh
```

Roda os testes e compila para `wasm32-unknown-unknown` pela imagem oficial do
Rust no Docker. `linguagem.wasm` (121 KB) e versionado — a CI nao compila Rust.

## Sem wasm-bindgen

A ponte com o JavaScript e manual, de proposito:

```
alocar(n) -> *mut u8      a pagina pede um buffer e escreve UTF-8 nele
avaliar(ptr, n) -> *mut u8  devolve [4 bytes de tamanho][UTF-8]
liberar(ptr, n)           devolve a posse ao Rust
```

WebAssembly so sabe trocar numeros; string e uma convencao construida em cima
disso. Fazer a mao mostra a fronteira que o wasm-bindgen normalmente esconde.

## A linguagem

```
seja x = 10
x = x + 1
mostre "texto" + x
se x > 5 { ... } senao { ... }
enquanto x < 100 { ... }
funcao nome(a, b) { devolva a + b }
```

Embutidas: `raiz`, `piso`, `abs`, `tamanho`.
Operadores: `+ - * / %  ==  !=  <  <=  >  >=  e  ou  nao`.

## Guardas

- **teto de passos** (3 milhoes): um `enquanto verdadeiro {}` digitado pelo
  visitante pararia a aba dele para sempre.
- **teto de recursao** (400 niveis): estouro de pilha em WASM e um trap, que
  mata o modulo inteiro em vez de devolver erro.

Os dois reportam linha e explicacao, como qualquer outro erro.

## Testes

```bash
cargo test --release
```

Quatro testes: precedencia aritmetica, recursao (`fib(15) == 610`), interrupcao
de laco infinito e divisao por zero.

## Publicado em

<https://autarktech.com.br/lab/rust-puro/>

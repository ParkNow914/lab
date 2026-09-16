# Laboratório de consultas com dados reais

**SQL (puro)** · Roda no navegador

Banco completo carregado no navegador: escreva SELECT, JOIN, CTE recursiva e window function sobre dados de verdade e veja o plano de execução.

## Por que este projeto

SQL é a linguagem mais duradoura da computação e a que mais separa quem sabe de quem finge. Window function e CTE recursiva são a fronteira onde isso fica visível.

## Como roda

- **Execução:** Compilado para WebAssembly — executa na máquina do visitante
- **Toolchain:** `DuckDB-WASM`

## Build

```bash
# TODO: comandos para compilar esta demo
```

O resultado precisa acabar como `index.html` (mais assets) nesta pasta.
`tools/build-site.mjs` copia a pasta inteira para `dist/sql-puro/`.

## Publicado em

<https://autarktech.com.br/lab/sql-puro/>

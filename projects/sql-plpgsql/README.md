# Regra de negócio dentro do banco

**PL/pgSQL + PostgreSQL** · Roda no navegador

Trigger, função e constraint garantindo integridade que a aplicação não consegue furar — nem por bug, nem por acesso direto.

## Por que este projeto

Mover invariante crítica para o banco é decisão de arquitetura que muita gente nem considera. Em sistema financeiro é o que salva.

## Como roda

- **Execução:** Compilado para WebAssembly — executa na máquina do visitante
- **Toolchain:** `PGlite (Postgres em WASM)`

## Build

Nenhum. O PGlite (PostgreSQL compilado para WebAssembly) vem por CDN e o banco
nasce na abertura da pagina.

## As tres defesas

1. `CHECK (saldo >= 0)` na coluna — recusa saldo negativo, venha de onde vier.
2. `TRIGGER AFTER INSERT ON lancamentos` — o saldo nao e escrito pela
   aplicacao; ele e consequencia do lancamento, aplicada pelo banco.
3. `TRIGGER BEFORE UPDATE OF saldo ON contas` — confere se o saldo bate com a
   soma do extrato. E isto que torna inutil um UPDATE direto na coluna.

Mais `BEFORE UPDATE OR DELETE ON lancamentos` levantando excecao: livro-razao
e historico, nao se corrige, se estorna.

## Verificado no navegador

Legitimas, aceitas com o saldo recalculado pelo trigger:

| operacao | saldos antes | saldos depois |
|---|---|---|
| depositar R$ 500 | 1.500 / 800 | 2.000 / 800 |
| sacar R$ 120 | 2.000 / 800 | 1.880 / 800 |
| transferir R$ 200 | 1.880 / 800 | 1.680 / 1.000 |

Fraudes, todas recusadas e com saldo intacto:

| tentativa | quem barrou |
|---|---|
| sacar mais do que tem | `contas_saldo_check` |
| alterar lancamento antigo | trigger de imutabilidade |
| apagar lancamento | trigger de imutabilidade |
| escrever saldo de R$ 1 milhao | conferencia contra o extrato |
| lancar valor negativo | `lancamentos_valor_check` |

**O achado mais interessante:** `ALTER TABLE contas DROP CONSTRAINT
contas_saldo_check` **passa** — derrubar constraint e permitido. Mas o UPDATE
com saldo inventado continua recusado, porque a conferencia contra o extrato e
outro mecanismo. Defesa em camadas nao e jargao: da para ver funcionando.

## Uma pegadinha do Postgres

Depois de um erro dentro de `BEGIN`, a sessao fica em estado abortado ate
alguem dar `ROLLBACK`. Sem o rollback no tratamento de erro, toda consulta
seguinte falharia com "current transaction is aborted" — e pareceria que o
banco quebrou.

## Publicado em

<https://autarktech.com.br/lab/sql-plpgsql/>

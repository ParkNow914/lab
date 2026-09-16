# Validador de esquema com tipos derivados

**TypeScript (puro)** · Roda no navegador

Biblioteca de validação em runtime que infere o tipo estático a partir do esquema — no estilo do Zod, construída do zero, com playground de tipos ao vivo.

## Por que este projeto

O sistema de tipos do TypeScript é uma linguagem própria. Tipos condicionais, inferência e template literal types resolvidos à mão mostram domínio real, não uso casual.

## Como roda

- **Execução:** Página estática, sem servidor
- **Toolchain:** `tsc + type-level tests`

## Build

Nenhum. A pagina carrega o compilador do TypeScript por CDN e compila
`esquema.ts` e o codigo do visitante dentro do navegador, com um
`LanguageService` em memoria.

## As tres linhas que fazem tudo

```ts
type Inferir<E> = E extends Esquema<infer T> ? T : never;

type ChavesOpcionais<F> = { [K in keyof F]: undefined extends Inferir<F[K]> ? K : never }[keyof F];

type SaidaObjeto<F> = { [K in ChavesExigidas<F>]: Inferir<F[K]> }
                    & { [K in ChavesOpcionais<F>]?: Inferir<F[K]> };
```

`infer T` puxa o tipo de dentro de `Esquema<T>`. `ChavesOpcionais` percorre os
campos, testa quais aceitam `undefined` e devolve so os nomes. Resultado: um
campo com `opcional()` vira **chave** opcional (`apelido?: string`), nao
`apelido: string | undefined` — que ainda obrigaria a escrever a chave.

## Detalhes que custaram tempo

- **`Achatar<T> = T extends infer O ? { [K in keyof O]: O[K] } : never`**. O
  `extends infer O` parece inutil e nao e: sem ele o TypeScript mantem o
  apelido preguicoso e exibe `Achatar<{...} & {}>` em vez do objeto resolvido,
  principalmente em esquema aninhado.
- **`globais.d.ts`**: `mostrar()` e injetada na execucao via `new Function`. Sem
  uma declaracao para o compilador, ele acusa "Cannot find name" num codigo que
  roda perfeitamente.
- **O `quickInfo` ja vem formatado** com quebras e recuo. Indentar por cima
  soma formatacao sobre formatacao; achatar tudo numa linha antes resolve.

## Verificado no navegador

| exemplo | tipo inferido | diagnostico |
|---|---|---|
| basico | `{ nome: string; idade: number; email: string }` | sem erro |
| campo opcional | `apelido?: string \| undefined` (chave opcional) | sem erro |
| aninhado | objeto dentro de objeto, lista de objeto, uniao | sem erro |
| dado invalido | — | 5 problemas com caminho, incl. `tags[1]` |
| erro de tipo | — | `Type 'number' is not assignable to type 'string'` na linha 11 |

## Publicado em

<https://autarktech.com.br/lab/ts-puro/>

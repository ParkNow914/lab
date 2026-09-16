# Laboratório Poliglota

Um projeto rodando de verdade em cada linguagem de programação que existe.

**→ [autarktech.com.br/lab](https://autarktech.com.br/lab/)**

Isto não é o meu trabalho com cliente. Os sistemas reais — com domínio, usuário e
receita — estão em [autarktech.com.br](https://autarktech.com.br). Aqui ficam estudos:
um programa por linguagem, escolhido para mostrar aquilo que **só aquela linguagem
faz bem**, e que o visitante abre e usa no próprio navegador.

## A regra que define tudo

> Se o visitante não consegue clicar e usar, não entra.

Por isso a arquitetura é **WebAssembly primeiro**. A maior parte das linguagens
compila para WASM ou transpila para JavaScript, então roda na máquina de quem
visita: custo zero, sem cold start, sem servidor para cair às 3h da manhã. Container
só onde não existe alternativa honesta.

| Como roda | O que significa | Custo |
|---|---|---|
| `wasm` | Compilado para WebAssembly | R$ 0 |
| `js` | Transpilado para JavaScript | R$ 0 |
| `static` | Já é HTML/CSS/JS | R$ 0 |
| `terminal` | Interpretador WASM dentro de um terminal na página | R$ 0 |
| `container` | Servidor real com suspensão automática | free tier |
| `cast` | Execução real gravada em asciinema | R$ 0 |

## Estrutura

```
catalog/          fonte da verdade — o que cada projeto é e por que existe
  01-sistemas.json
  02-aplicacao.json
  03-funcionais.json
  04-dados.json
  05-especializadas.json

projects/<id>/    uma demo por pasta, cada uma com seu próprio build
site/             o casco: index.html do laboratório + demo.css compartilhado
tools/            catálogo, build, gerador e teste
dist/             resultado publicado (gerado, não versionado)
```

O catálogo vem antes da pasta, de propósito: se um projeto não foi pensado a ponto
de ter um campo `why` escrito, ele ainda não deveria existir.

## Comandos

```bash
node tools/build-catalog.mjs          # valida e consolida catalog/*.json
node tools/build-site.mjs             # monta dist/
node tools/novo-projeto.mjs <id>      # cria o esqueleto de uma demo
node tools/testar-demos.mjs           # abre cada demo num Chromium de verdade
```

Para ver localmente:

```bash
node tools/build-catalog.mjs && node tools/build-site.mjs && npx serve dist
```

## Adicionar um projeto

1. Escreva a entrada em `catalog/<grupo>.json` — principalmente o `why`.
2. `node tools/novo-projeto.mjs <id>`
3. Escreva a demo dentro de `<main class="palco">`.
4. `node tools/build-site.mjs` e confira no navegador.

O `status` no catálogo não precisa ser editado à mão: `build-site.mjs` marca como
`live` o que tem pasta com `index.html`, e devolve para `planned` o que não tem.
Card que promete demo inexistente é a única mentira que esta página não pode contar.

## Licença

Código sob MIT. Use à vontade, inclusive para montar o seu próprio laboratório.

---

**Alisson Santos** · [autarktech.com.br](https://autarktech.com.br) · Lorena, SP

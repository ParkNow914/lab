// Cria o esqueleto de uma demo a partir da entrada que ja existe no catalogo.
// O catalogo vem primeiro de proposito: se o projeto nao foi pensado a ponto de
// ter um "why" escrito, ele nao deveria virar pasta ainda.
//
// Uso:  node tools/novo-projeto.mjs <id>
//       node tools/novo-projeto.mjs rust-puro

import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const id = process.argv[2];

if (!id) {
  console.error("Uso: node tools/novo-projeto.mjs <id>\nEx.:  node tools/novo-projeto.mjs rust-puro");
  process.exit(1);
}

const existe = async (p) => { try { await stat(p); return true; } catch { return false; } };

const catalogoPath = join(raiz, "site", "catalog.json");
if (!(await existe(catalogoPath))) {
  console.error("Rode antes: node tools/build-catalog.mjs");
  process.exit(1);
}

const catalogo = JSON.parse(await readFile(catalogoPath, "utf8"));
const p = catalogo.grupos.flatMap((g) => g.projetos).find((x) => x.id === id);

if (!p) {
  console.error(`"${id}" nao existe no catalogo.`);
  console.error("Adicione a entrada em catalog/*.json primeiro — e la que mora a decisao do que o projeto e.");
  process.exit(1);
}

const destino = join(raiz, "projects", id);
if (await existe(destino)) {
  console.error(`projects/${id}/ ja existe. Nao vou sobrescrever.`);
  process.exit(1);
}

await mkdir(destino, { recursive: true });

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const metas = [
  p.kind === "framework" ? p.framework : `${p.lang} puro`,
  p.toolchain,
  p.runtimeInfo?.rotulo,
].filter(Boolean);

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)} — Laboratório Autark</title>
<meta name="description" content="${esc(p.pitch)}">
<meta name="color-scheme" content="dark">
<link rel="stylesheet" href="/assets/fonts/fonts.css">
<link rel="stylesheet" href="../demo.css">
</head>

<body>
<a class="skip-link" href="#palco">Pular para a demonstração</a>

<div class="topo">
  <div class="container topo-in">
    <a class="voltar" href="../">← Laboratório</a>
    <span class="topo-sp"></span>
    <span class="topo-lang">${esc(p.lang)}</span>
    <a class="topo-fonte" href="${esc(p.fonte)}">Código ↗</a>
  </div>
</div>

<div class="container cab">
  <h1>${esc(p.title)}</h1>
  <p class="pitch">${esc(p.pitch)}</p>

  <div class="meta">
${metas.map((m) => `    <span>${esc(m)}</span>`).join("\n")}
  </div>

  <div class="porque">
    <b>Por que este projeto</b>
    ${esc(p.why)}
  </div>
</div>

<main class="palco" id="palco">
  <div class="container">

    <section class="painel">
      <h2>Demonstração</h2>
      <!-- TODO: a demo vive aqui. Regras do casco:
           - use as classes de demo.css (.painel, .duas, .linha, .saida, .log)
           - nada de framework: cada demo carrega so o que a linguagem dela exige
           - se algo demora a carregar, mostre <div class="carregando">Carregando…</div>
           - a demo precisa funcionar sem rede depois do primeiro carregamento -->
      <p style="color:var(--text-dim)">Em construção.</p>
    </section>

  </div>
</main>

<div class="rodape">
  <div class="container rodape-in">
    <span>Alisson Santos · Autark</span>
    <a href="../">Laboratório</a>
    <a href="/">Portfólio</a>
    <a href="${esc(p.fonte)}">Ver o código</a>
  </div>
</div>

</body>
</html>
`;

const readme = `# ${p.title}

**${p.lang}${p.kind === "framework" ? ` + ${p.framework}` : " (puro)"}** · ${p.runtimeInfo?.rotulo ?? p.runtime}

${p.pitch}

## Por que este projeto

${p.why}

## Como roda

- **Execução:** ${p.runtimeInfo?.detalhe ?? p.runtime}
- **Toolchain:** \`${p.toolchain}\`

## Build

\`\`\`bash
# TODO: comandos para compilar esta demo
\`\`\`

O resultado precisa acabar como \`index.html\` (mais assets) nesta pasta.
\`tools/build-site.mjs\` copia a pasta inteira para \`dist/${p.id}/\`.

## Publicado em

<https://autarktech.com.br/lab/${p.id}/>
`;

await writeFile(join(destino, "index.html"), html, "utf8");
await writeFile(join(destino, "README.md"), readme, "utf8");

console.log(`
Criado projects/${id}/
  index.html   (casco pronto, demo por fazer)
  README.md

Proximos passos:
  1. escreva a demo dentro de <main class="palco">
  2. node tools/build-site.mjs
  3. abra http://127.0.0.1:8080/${id}/
`);

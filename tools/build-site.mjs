// Monta dist/ com o que vai para o GitHub Pages:
//
//   site/*            -> dist/            (index, demo.css, catalog.json)
//   projects/<id>/    -> dist/<id>/       (cada demo, se tiver index.html)
//
// Em producao isso e servido em autarktech.com.br/lab/, entao dentro de um
// projeto "../demo.css" aponta para /lab/demo.css. Localmente dist/ e servido
// na raiz e o mesmo caminho relativo continua valendo — por isso a estrutura e
// identica nos dois lugares.
//
// Uso:  node tools/build-site.mjs

import { readdir, readFile, rm, mkdir, cp, stat, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(raiz, "dist");

const existe = async (p) => { try { await stat(p); return true; } catch { return false; } };

// 1. Catalogo primeiro: se ele nao valida, nao ha o que publicar.
if (!(await existe(join(raiz, "site", "catalog.json")))) {
  console.error("site/catalog.json nao existe. Rode antes: node tools/build-catalog.mjs");
  process.exit(1);
}

const catalogo = JSON.parse(await readFile(join(raiz, "site", "catalog.json"), "utf8"));
const projetos = catalogo.grupos.flatMap((g) => g.projetos);
const porId = new Map(projetos.map((p) => [p.id, p]));

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

// 2. Casco do site.
await cp(join(raiz, "site"), dist, { recursive: true });

// 3. Demos.
const pastaProjetos = join(raiz, "projects");
const pastas = (await existe(pastaProjetos))
  ? (await readdir(pastaProjetos, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name)
  : [];

const publicados = [];
const semIndex = [];
const orfaos = [];

for (const id of pastas) {
  // Pasta que nao esta no catalogo nunca apareceria no site — e quase sempre
  // um id digitado errado, entao vale falhar em vez de publicar no escuro.
  if (!porId.has(id)) { orfaos.push(id); continue; }

  const origem = join(pastaProjetos, id);
  if (!(await existe(join(origem, "index.html")))) { semIndex.push(id); continue; }

  await cp(origem, join(dist, id), {
    recursive: true,
    // README e material de repositorio, nao de site.
    filter: (src) => !/[\\/](README\.md|\.gitkeep|node_modules)$/.test(src),
  });
  publicados.push(id);
}

// 4. Sincroniza o status: o catalogo nao pode dizer "no ar" para uma pasta que
// nao existe, nem "planejado" para uma demo que ja esta publicada.
let corrigidos = 0;
for (const p of projetos) {
  const temDemo = publicados.includes(p.id);
  const alvo = temDemo ? "live" : p.status === "live" ? "planned" : p.status;
  if (p.status !== alvo) {
    console.log(`  status ajustado: ${p.id} ${p.status} -> ${alvo}`);
    p.status = alvo;
    corrigidos++;
  }
}
if (corrigidos) {
  await writeFile(join(dist, "catalog.json"), JSON.stringify(catalogo, null, 2), "utf8");
}

// 5. Relatorio.
console.log(`\nPublicado em dist/`);
console.log(`  ${publicados.length} demo(s): ${publicados.join(", ") || "(nenhuma ainda)"}`);
console.log(`  ${projetos.length - publicados.length} ainda planejados`);

if (semIndex.length) {
  console.log(`\n  ${semIndex.length} pasta(s) sem index.html (ignoradas): ${semIndex.join(", ")}`);
}

if (orfaos.length) {
  console.error(`\nERRO: pasta(s) em projects/ que nao existem no catalogo: ${orfaos.join(", ")}`);
  console.error("Ou o id esta errado, ou falta a entrada em catalog/*.json.");
  process.exit(1);
}

console.log("");

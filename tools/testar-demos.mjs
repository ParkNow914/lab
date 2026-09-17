// Abre cada demo marcada como "no ar" num Chromium de verdade e reprova se ela
// nao funcionar. Com dezenas de linguagens compilando para WASM, este e o unico
// teste que pega o que importa: modulo que nao carrega, erro de JS na inicializacao,
// binario WASM que nao instancia, pagina que fica em branco.
//
// Uso:  node tools/testar-demos.mjs
//       node tools/testar-demos.mjs js-puro        (so uma)

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(raiz, "dist");
const soEsta = process.argv[2];

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".data": "application/octet-stream",
};

// Servidor minimo: precisa mandar application/wasm corretamente, senao
// instantiateStreaming falha e o teste reprovaria por culpa do teste.
const servidor = createServer(async (req, res) => {
  try {
    let caminho = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (caminho.endsWith("/")) caminho += "index.html";
    const arquivo = join(dist, caminho);

    if (!arquivo.startsWith(dist)) { res.writeHead(403).end(); return; }

    const conteudo = await readFile(arquivo);
    res.writeHead(200, {
      "content-type": TIPOS[extname(arquivo)] ?? "application/octet-stream",
      // Alguns runtimes WASM com threads exigem isolamento de origem.
      "cross-origin-opener-policy": "same-origin",
      "cross-origin-embedder-policy": "require-corp",
    });
    res.end(conteudo);
  } catch {
    res.writeHead(404).end("nao encontrado");
  }
});

await new Promise((r) => servidor.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${servidor.address().port}`;

const catalogo = JSON.parse(await readFile(join(dist, "catalog.json"), "utf8"));
let demos = catalogo.grupos.flatMap((g) => g.projetos).filter((p) => p.status === "live");
if (soEsta) demos = demos.filter((p) => p.id === soEsta);

if (demos.length === 0) {
  console.log("Nenhuma demo marcada como no ar. Nada a testar.");
  servidor.close();
  process.exit(0);
}

const navegador = await chromium.launch();
const falhas = [];

// /assets/ pertence ao site principal (ParkNow914.github.io), servido no mesmo
// dominio. Aqui ele nao existe, e nao deveria: duplicar as fontes so para o
// teste passar desperdicaria o cache de quem chega vindo do portfolio. As
// paginas tem pilha de fallback, entao a fonte e melhoria progressiva.
// Que o caminho continue existindo em producao e conferido no workflow.
const doSitePrincipal = (caminho) => caminho.startsWith("/assets/");

console.log(`\nTestando ${demos.length} demo(s)\n`);

for (const demo of demos) {
  const pagina = await navegador.newPage();
  const erros = [];

  pagina.on("pageerror", (e) => erros.push(`erro de JS: ${e.message}`));

  pagina.on("console", (m) => {
    if (m.type() !== "error") return;
    // O 404 de /assets/ tambem chega como erro de console, e sem a URL no texto.
    // A origem da mensagem e o unico jeito de distinguir.
    const origem = m.location()?.url ?? "";
    if (origem.startsWith(base) && doSitePrincipal(origem.replace(base, ""))) return;
    erros.push(`console: ${m.text()}`);
  });
  pagina.on("requestfailed", (r) => {
    // CDN pode oscilar; recurso local faltando e bug de verdade.
    const url = r.url();
    if (!url.startsWith(base)) return;
    const caminho = url.replace(base, "");
    if (doSitePrincipal(caminho)) return;
    erros.push(`recurso local faltando: ${caminho}`);
  });

  // Demo externa (Vercel, Cloudflare) mora fora daqui, mas a promessa da pagina
  // e a mesma: se o card diz "no ar", tem que abrir. Testar so as locais
  // deixaria justamente as que dependem de servidor sem vigilancia.
  const alvo = demo.demoExterna ?? `${base}/${demo.id}/`;

  try {
    const resposta = await pagina.goto(alvo, { waitUntil: "load", timeout: 45_000 });
    if (!resposta || !resposta.ok()) throw new Error(`HTTP ${resposta?.status()}`);

    // Tempo para WASM baixar, instanciar e a demo desenhar a primeira vez.
    await pagina.waitForTimeout(3_500);

    // Pagina que carrega mas nao mostra nada reprova igual.
    const texto = (await pagina.locator("main.palco").innerText().catch(() => "")).trim();
    if (texto.length < 40) erros.push("o palco ficou praticamente vazio");
    if (/em construção/i.test(texto)) erros.push('ainda esta com o texto "Em construção"');

    const titulo = await pagina.title();
    if (!titulo || /^\s*$/.test(titulo)) erros.push("sem <title>");
  } catch (e) {
    erros.push(String(e.message ?? e));
  }

  await pagina.close();

  if (erros.length) {
    falhas.push({ id: demo.id, erros });
    console.log(`  FALHOU  ${demo.id}`);
    for (const e of erros.slice(0, 5)) console.log(`          ${e}`);
  } else {
    console.log(`  ok      ${demo.id}  (${demo.lang})${demo.demoExterna ? "  [externa]" : ""}`);
  }
}

await navegador.close();
servidor.close();

if (falhas.length) {
  console.error(`\n${falhas.length} de ${demos.length} demo(s) reprovaram.\n`);
  process.exit(1);
}

console.log(`\nTodas as ${demos.length} demo(s) abriram e funcionaram.\n`);

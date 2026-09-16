// Consolida catalog/*.json num único arquivo que o site consome, validando tudo
// antes. Catálogo quebrado aqui é melhor que card quebrado em producao.
//
// Uso:  node tools/build-catalog.mjs [--check]
//       --check apenas valida e nao escreve (usado na CI)

import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const somenteChecar = process.argv.includes("--check");

// Como cada projeto é exibido e onde ele roda. A escolha do runtime decide se o
// projeto custa R$0 para sempre ou se vira uma dependência que pode cair.
const RUNTIMES = {
  wasm: {
    rotulo: "Roda no navegador",
    detalhe: "Compilado para WebAssembly — executa na máquina do visitante",
    custo: "estático",
    icone: "⚡",
  },
  js: {
    rotulo: "Roda no navegador",
    detalhe: "Transpilado para JavaScript — executa na máquina do visitante",
    custo: "estático",
    icone: "⚡",
  },
  static: {
    rotulo: "Roda no navegador",
    detalhe: "Página estática, sem servidor",
    custo: "estático",
    icone: "⚡",
  },
  terminal: {
    rotulo: "Terminal interativo",
    detalhe: "Interpretador em WebAssembly dentro de um terminal na página",
    custo: "estático",
    icone: "⌨",
  },
  container: {
    rotulo: "Servidor ao vivo",
    detalhe: "Container com suspensão automática — pode levar alguns segundos para acordar",
    custo: "container",
    icone: "☁",
  },
  cast: {
    rotulo: "Gravação do terminal",
    detalhe: "Execução real gravada em asciinema — dá play e acompanha",
    custo: "estático",
    icone: "▶",
  },
};

const STATUS = ["planned", "building", "live"];
const KINDS = ["pure", "framework"];
const OBRIGATORIOS = ["id", "lang", "langId", "kind", "title", "pitch", "why", "runtime", "toolchain", "status"];

const erros = [];
const avisos = [];

const arquivos = (await readdir(join(raiz, "catalog")))
  .filter((f) => f.endsWith(".json"))
  .sort();

if (arquivos.length === 0) erros.push("catalog/ nao tem nenhum arquivo .json");

const grupos = [];
const idsVistos = new Map();

for (const arquivo of arquivos) {
  const caminho = join(raiz, "catalog", arquivo);
  let dados;
  try {
    dados = JSON.parse(await readFile(caminho, "utf8"));
  } catch (e) {
    erros.push(`${arquivo}: JSON invalido — ${e.message}`);
    continue;
  }

  if (!dados.grupo) erros.push(`${arquivo}: falta o campo "grupo"`);
  if (!Array.isArray(dados.projetos)) {
    erros.push(`${arquivo}: "projetos" precisa ser uma lista`);
    continue;
  }

  for (const p of dados.projetos) {
    const onde = `${arquivo} › ${p.id ?? "(sem id)"}`;

    for (const campo of OBRIGATORIOS) {
      if (p[campo] === undefined || p[campo] === null || p[campo] === "") {
        erros.push(`${onde}: falta o campo obrigatorio "${campo}"`);
      }
    }

    if (p.id) {
      // id duplicado significa duas pastas disputando a mesma URL
      if (idsVistos.has(p.id)) {
        erros.push(`${onde}: id duplicado, ja usado em ${idsVistos.get(p.id)}`);
      } else {
        idsVistos.set(p.id, arquivo);
      }
      if (!/^[a-z0-9-]+$/.test(p.id)) {
        erros.push(`${onde}: id so pode ter minusculas, numeros e hifen (vira URL)`);
      }
    }

    if (p.runtime && !RUNTIMES[p.runtime]) {
      erros.push(`${onde}: runtime "${p.runtime}" desconhecido (use: ${Object.keys(RUNTIMES).join(", ")})`);
    }
    if (p.status && !STATUS.includes(p.status)) {
      erros.push(`${onde}: status "${p.status}" invalido (use: ${STATUS.join(", ")})`);
    }
    if (p.kind && !KINDS.includes(p.kind)) {
      erros.push(`${onde}: kind "${p.kind}" invalido (use: ${KINDS.join(", ")})`);
    }
    if (p.kind === "framework" && !p.framework) {
      erros.push(`${onde}: kind "framework" exige o campo "framework"`);
    }

    // O "why" e o que diferencia este portfolio de uma lista de hello world.
    // Texto curto demais quase sempre significa que ninguem pensou no projeto.
    if (p.why && p.why.length < 60) {
      avisos.push(`${onde}: o campo "why" esta muito curto — e ele que justifica o projeto`);
    }

    p.grupo = dados.grupo;
    p.runtimeInfo = RUNTIMES[p.runtime] ?? null;
    p.demo = `/lab/${p.id}/`;
    p.fonte = `https://github.com/ParkNow914/lab/tree/main/projects/${p.id}`;
  }

  grupos.push(dados);
}

grupos.sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99));
const todos = grupos.flatMap((g) => g.projetos);

// --- Relatorio -------------------------------------------------------------

const porRuntime = {};
const porStatus = {};
const porLingua = new Set();
for (const p of todos) {
  porRuntime[p.runtime] = (porRuntime[p.runtime] ?? 0) + 1;
  porStatus[p.status] = (porStatus[p.status] ?? 0) + 1;
  porLingua.add(p.langId);
}

console.log(`\nCatalogo: ${todos.length} projetos, ${porLingua.size} linguagens, ${grupos.length} grupos\n`);

console.log("Por runtime:");
for (const [r, n] of Object.entries(porRuntime).sort((a, b) => b[1] - a[1])) {
  const custo = RUNTIMES[r]?.custo ?? "?";
  console.log(`  ${String(n).padStart(3)}  ${r.padEnd(10)} (${custo})`);
}

const containers = porRuntime.container ?? 0;
const gratis = todos.length - containers;
console.log(`\n  ${gratis} projetos custam R$0 e nunca caem`);
console.log(`  ${containers} projetos precisam de container com suspensao automatica`);

console.log("\nPor status:");
for (const s of STATUS) {
  if (porStatus[s]) console.log(`  ${String(porStatus[s]).padStart(3)}  ${s}`);
}

if (avisos.length) {
  console.log(`\n${avisos.length} aviso(s):`);
  for (const a of avisos.slice(0, 15)) console.log(`  ! ${a}`);
}

if (erros.length) {
  console.error(`\n${erros.length} erro(s):`);
  for (const e of erros) console.error(`  x ${e}`);
  process.exit(1);
}

if (somenteChecar) {
  console.log("\nCatalogo valido.\n");
  process.exit(0);
}

await mkdir(join(raiz, "site"), { recursive: true });
await writeFile(
  join(raiz, "site", "catalog.json"),
  JSON.stringify(
    {
      geradoEm: new Date().toISOString(),
      total: todos.length,
      linguagens: porLingua.size,
      runtimes: RUNTIMES,
      grupos,
    },
    null,
    2,
  ),
  "utf8",
);

console.log("\nEscrito: site/catalog.json\n");

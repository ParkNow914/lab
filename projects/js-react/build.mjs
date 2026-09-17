// Empacota o app.jsx num unico modulo ES, para o GitHub Pages servir sem
// nenhuma etapa de build no meio.
//
// O bundle vai versionado no repositorio de proposito: o laboratorio inteiro
// e publicado como arquivo estatico, e ter um passo de build so para uma das
// demos transformaria a publicacao de todas elas num processo mais fragil.
// O fonte fica em src/app.jsx, legivel, e este script o regenera.
import * as esbuild from "esbuild";

const r = await esbuild.build({
  entryPoints: ["src/app.jsx"],
  bundle: true,
  minify: true,
  format: "esm",
  target: "es2020",
  jsx: "automatic",
  // Sem isto o React entra em modo de desenvolvimento: mais lento, mais
  // pesado, e com os avisos de console que a pagina nao deveria emitir.
  define: { "process.env.NODE_ENV": '"production"' },
  outfile: "app.js",
  metafile: true,
});

const bytes = Object.values(r.metafile.outputs)[0].bytes;
console.log(`app.js: ${(bytes / 1024).toFixed(1)} kB (React incluido)`);

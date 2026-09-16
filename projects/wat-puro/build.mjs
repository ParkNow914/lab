// Monta mandelbrot.wat em mandelbrot.wasm.
//
// Uso:  node projects/wat-puro/build.mjs
//
// O .wasm resultante e versionado junto com o .wat: a CI nao monta nada, so
// confere que a pagina abre e desenha.

import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import criarWabt from "wabt";

const pasta = dirname(fileURLToPath(import.meta.url));

const wabt = await criarWabt();
const fonte = await readFile(join(pasta, "mandelbrot.wat"), "utf8");

let modulo;
try {
  modulo = wabt.parseWat("mandelbrot.wat", fonte, {
    // trunc_sat vem da proposta de conversao nao-armadilhante, ja padrao nos
    // navegadores. Sem ela, um NaN na paleta derrubaria o modulo inteiro.
    sat_float_to_int: true,
  });
  modulo.resolveNames();
  modulo.validate();
} catch (e) {
  console.error("Falhou ao montar o WAT:\n" + e.message);
  process.exit(1);
}

const { buffer } = modulo.toBinary({ log: false, write_debug_names: false });
modulo.destroy();

await writeFile(join(pasta, "mandelbrot.wasm"), Buffer.from(buffer));
console.log(`mandelbrot.wasm escrito — ${buffer.length} bytes`);

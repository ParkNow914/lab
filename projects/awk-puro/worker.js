// Web Worker que hospeda o interpretador AWK.
//
// Ele existe por um motivo concreto: o GoAWK nao aceita cancelamento, entao
// `BEGIN { while (1) {} }` nao tem como ser interrompido de dentro. Rodando
// aqui, um laco infinito trava apenas esta thread — e a pagina mata o worker e
// sobe outro. Na thread principal, travaria a aba do visitante.

importScripts("wasm_exec.js");

let pronto = false;

async function iniciar() {
  const go = new Go();
  const r = await WebAssembly.instantiateStreaming(fetch("awk.wasm"), go.importObject);

  // go.run nunca resolve: o main do Go fica parado num select{}.
  go.run(r.instance);

  // Esperar a funcao aparecer no escopo global e mais confiavel do que
  // encadear no then, justamente porque go.run nao termina.
  await new Promise((resolve) => {
    const olhar = () => (typeof awkRodar === "function" ? resolve() : setTimeout(olhar, 20));
    olhar();
  });

  pronto = true;
  postMessage({ tipo: "pronto" });
}

self.onmessage = (e) => {
  const { tipo, id, programa, entrada, separador } = e.data ?? {};
  if (tipo !== "rodar") return;

  if (!pronto) {
    postMessage({ tipo: "resultado", id, erro: "o interpretador ainda está carregando" });
    return;
  }

  try {
    const r = awkRodar(programa, entrada, separador ?? "");
    postMessage({ tipo: "resultado", id, ...r });
  } catch (erro) {
    postMessage({ tipo: "resultado", id, erro: String(erro && erro.message ? erro.message : erro) });
  }
};

iniciar().catch((erro) => {
  postMessage({ tipo: "falhou", erro: String(erro && erro.message ? erro.message : erro) });
});

// Motor de reatividade em JavaScript puro — o nucleo que existe dentro do Vue,
// do Solid e dos signals do Angular, sem nenhuma dependencia e sem build.
//
// A ideia inteira cabe em tres passos:
//   1. Ao LER uma propriedade dentro de um efeito, anote que aquele efeito
//      depende daquela propriedade.  (rastrear)
//   2. Ao ESCREVER numa propriedade, reexecute todos os efeitos anotados.
//      (disparar)
//   3. Antes de reexecutar um efeito, apague as dependencias antigas dele,
//      porque um `if` pode ter mudado de ramo e a dependencia de ontem pode
//      nao existir mais.  (limparDependencias)
//
// O passo 3 e o que quase toda implementacao de tutorial esquece, e e a fonte
// de vazamento de memoria e de efeito que dispara sem motivo.

/** Efeito em execucao neste instante. E assim que a leitura sabe quem a pediu. */
let efeitoAtivo = null;

/** Pilha de efeitos: efeito aninhado precisa devolver o pai ao terminar. */
const pilha = [];

/** objeto reativo -> Map<propriedade, Set<efeito>> */
const mapaDeps = new WeakMap();

/** Proxies ja criados, para que reativo(x) duas vezes devolva o mesmo proxy. */
const cacheProxy = new WeakMap();

/** Quando em lote, efeitos entram aqui em vez de rodar na hora. */
let loteAtivo = 0;
const pendentes = new Set();

/** Gancho opcional de observacao — a pagina usa para desenhar o que acontece. */
let observador = null;
export function observar(fn) { observador = fn; }
const avisar = (evento, dado) => { if (observador) observador(evento, dado); };

// --- Nucleo ---------------------------------------------------------------

function rastrear(alvo, chave) {
  if (!efeitoAtivo) return; // leitura fora de efeito nao cria dependencia

  let porChave = mapaDeps.get(alvo);
  if (!porChave) mapaDeps.set(alvo, (porChave = new Map()));

  let assinantes = porChave.get(chave);
  if (!assinantes) porChave.set(chave, (assinantes = new Set()));

  if (!assinantes.has(efeitoAtivo)) {
    assinantes.add(efeitoAtivo);
    // Guardado dos dois lados: o efeito precisa saber de quais conjuntos sair
    // quando for limpo, senao a limpeza seria uma varredura global.
    efeitoAtivo.deps.push(assinantes);
    avisar("rastreou", { efeito: efeitoAtivo.nome, chave });
  }
}

function disparar(alvo, chave) {
  const assinantes = mapaDeps.get(alvo)?.get(chave);
  if (!assinantes || assinantes.size === 0) return;

  // Copia antes de iterar: reexecutar um efeito altera este mesmo Set.
  for (const ef of [...assinantes]) {
    if (ef === efeitoAtivo) continue; // escrever no que se le nao pode virar laco

    if (loteAtivo > 0) pendentes.add(ef);
    else ef.agendar();
  }
}

function limparDependencias(ef) {
  for (const conjunto of ef.deps) conjunto.delete(ef);
  ef.deps.length = 0;
}

// --- API publica ----------------------------------------------------------

/**
 * Envolve um objeto para que leitura vire dependencia e escrita vire
 * notificacao. Objetos aninhados viram reativos quando lidos, sob demanda —
 * percorrer tudo na criacao seria caro e desnecessario.
 */
export function reativo(objeto) {
  if (objeto === null || typeof objeto !== "object") return objeto;
  if (cacheProxy.has(objeto)) return cacheProxy.get(objeto);

  const proxy = new Proxy(objeto, {
    get(alvo, chave, receptor) {
      // Array dispara mudanca de length sozinho; observar length daria efeito
      // duplicado em toda insercao.
      if (chave === "__ehReativo") return true;

      const valor = Reflect.get(alvo, chave, receptor);
      rastrear(alvo, chave);

      if (valor !== null && typeof valor === "object") return reativo(valor);
      return valor;
    },

    set(alvo, chave, valor, receptor) {
      const anterior = alvo[chave];
      const eraNovaChave = !Object.prototype.hasOwnProperty.call(alvo, chave);
      const ok = Reflect.set(alvo, chave, valor, receptor);

      // Object.is em vez de !== para que NaN nao dispare eternamente e para que
      // -0 e +0 nao contem como mudanca.
      if (ok && (eraNovaChave || !Object.is(anterior, valor))) {
        avisar("mudou", { chave, de: anterior, para: valor });
        disparar(alvo, chave);
        // Push num array muda o indice e o length; quem itera observa o length.
        if (Array.isArray(alvo) && chave !== "length") disparar(alvo, "length");
      }
      return ok;
    },

    deleteProperty(alvo, chave) {
      const tinha = Object.prototype.hasOwnProperty.call(alvo, chave);
      const ok = Reflect.deleteProperty(alvo, chave);
      if (ok && tinha) {
        avisar("removeu", { chave });
        disparar(alvo, chave);
      }
      return ok;
    },

    // for..in e Object.keys tambem sao leitura e tambem criam dependencia.
    ownKeys(alvo) {
      rastrear(alvo, Array.isArray(alvo) ? "length" : Symbol.for("chaves"));
      return Reflect.ownKeys(alvo);
    },
  });

  cacheProxy.set(objeto, proxy);
  return proxy;
}

/**
 * Executa `fn` imediatamente e a reexecuta sempre que algo lido dentro dela
 * mudar. Devolve uma funcao para cancelar.
 */
export function efeito(fn, { nome = fn.name || "efeito", agendador } = {}) {
  const ef = {
    nome,
    deps: [],
    ativo: true,
    rodar() {
      if (!ef.ativo) return;

      // Sem isto, um efeito com `if` continuaria preso na dependencia do ramo
      // que ele nao executa mais.
      limparDependencias(ef);

      pilha.push(efeitoAtivo);
      efeitoAtivo = ef;
      try {
        avisar("rodou", { efeito: nome });
        return fn();
      } finally {
        efeitoAtivo = pilha.pop();
      }
    },
    agendar() {
      if (agendador) agendador(ef.rodar);
      else ef.rodar();
    },
  };

  ef.rodar();

  const parar = function parar() {
    limparDependencias(ef);
    ef.ativo = false;
    avisar("parou", { efeito: nome });
  };
  // `computado` precisa reexecutar o efeito sob demanda, no momento da leitura.
  // Expor o runner aqui evita ter que capturá-lo por um caminho indireto.
  parar.rodar = ef.rodar;
  return parar;
}

/**
 * Valor derivado com cache: so recalcula quando uma dependencia muda, e avisa
 * quem depende dele. E um efeito preguicoso, nao um getter comum.
 */
export function computado(fn, nome = fn.name || "computado") {
  let valor;
  let sujo = true;
  const caixa = {}; // objeto proprio para servir de alvo no grafo de deps

  const efeitoInterno = efeito(
    () => { valor = fn(); },
    {
      nome,
      // Em vez de recalcular na hora, apenas marca como sujo e avisa quem
      // depende. Quem le e que paga o custo — e so se alguem realmente ler.
      //
      // A ordem aqui importa: `disparar` reexecuta efeitos de forma sincrona, e
      // esses efeitos vao ler `.valor` no meio desta chamada. Por isso `sujo`
      // precisa ja estar marcado antes de disparar, e o recalculo precisa estar
      // disponivel — senao a leitura devolveria o valor velho silenciosamente.
      agendador() {
        if (sujo) return; // ja avisado; nao propaga duas vezes
        sujo = true;
        disparar(caixa, "valor");
      },
    },
  );
  sujo = false;

  return {
    get valor() {
      if (sujo) {
        sujo = false; // antes de rodar, para o caso de fn() ler a si mesma
        efeitoInterno.rodar();
      }
      rastrear(caixa, "valor");
      return valor;
    },
  };
}

/**
 * Agrupa varias escritas numa notificacao so. Sem isto, mexer em cinco campos
 * de um formulario redesenharia a tela cinco vezes.
 */
export function lote(fn) {
  loteAtivo++;
  try {
    return fn();
  } finally {
    loteAtivo--;
    if (loteAtivo === 0) {
      const fila = [...pendentes];
      pendentes.clear();
      avisar("lote", { quantidade: fila.length });
      for (const ef of fila) ef.agendar();
    }
  }
}

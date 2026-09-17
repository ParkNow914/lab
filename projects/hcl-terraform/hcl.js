// Analisador de HCL e montador do grafo de dependencia.
//
// Nao e o Terraform: e o miolo dele. Ler HCL, descobrir quem depende de quem
// pelas referencias, ordenar em camadas e comparar a configuracao com o estado
// para dizer o que seria criado, alterado ou destruido.
//
// A parte que importa e a terceira: o `plan` existe porque `apply` as cegas em
// infraestrutura de producao e como rodar DELETE sem WHERE.

// ------------------------------------------------------------------ parser

/**
 * HCL reduzido, mas suficiente: blocos com rotulos, atributos, strings com
 * interpolacao, numeros, booleanos, listas e mapas.
 *
 *   resource "tipo" "nome" {
 *     chave = "valor ${outro.recurso.attr}"
 *     lista = [1, 2, 3]
 *     mapa  = { a = 1 }
 *     bloco { ... }
 *   }
 */
export function analisar(fonte) {
  let i = 0;
  const erros = [];

  const fim = () => i >= fonte.length;
  const olhar = () => fonte[i];

  function pularVazio() {
    while (!fim()) {
      const c = fonte[i];
      if (c === "#" || (c === "/" && fonte[i + 1] === "/")) {
        while (!fim() && fonte[i] !== "\n") i++;
      } else if (c === "/" && fonte[i + 1] === "*") {
        i += 2;
        while (!fim() && !(fonte[i] === "*" && fonte[i + 1] === "/")) i++;
        i += 2;
      } else if (/\s/.test(c)) {
        i++;
      } else {
        return;
      }
    }
  }

  function linhaDe(pos) {
    return fonte.slice(0, pos).split("\n").length;
  }

  function lerString() {
    i++; // abre aspas
    let s = "";
    while (!fim() && fonte[i] !== '"') {
      if (fonte[i] === "\\") { s += fonte[i + 1]; i += 2; continue; }
      s += fonte[i++];
    }
    i++; // fecha aspas
    return { tipo: "string", valor: s };
  }

  function lerIdentificador() {
    let s = "";
    while (!fim() && /[A-Za-z0-9_.\-[\]]/.test(fonte[i])) s += fonte[i++];
    return s;
  }

  function lerValor() {
    pularVazio();
    const c = olhar();

    if (c === '"') return lerString();

    if (c === "[") {
      i++;
      const itens = [];
      for (;;) {
        pularVazio();
        if (fim() || olhar() === "]") { i++; break; }
        itens.push(lerValor());
        pularVazio();
        if (olhar() === ",") i++;
      }
      return { tipo: "lista", valor: itens };
    }

    if (c === "{") {
      i++;
      const mapa = {};
      for (;;) {
        pularVazio();
        if (fim() || olhar() === "}") { i++; break; }
        const chave = olhar() === '"' ? lerString().valor : lerIdentificador();
        pularVazio();
        if (olhar() === "=" || olhar() === ":") i++;
        mapa[chave] = lerValor();
        pularVazio();
        if (olhar() === ",") i++;
      }
      return { tipo: "mapa", valor: mapa };
    }

    if (/[0-9-]/.test(c)) {
      let s = "";
      while (!fim() && /[0-9.\-eE+]/.test(fonte[i])) s += fonte[i++];
      return { tipo: "numero", valor: Number(s) };
    }

    const id = lerIdentificador();
    if (id === "true" || id === "false") return { tipo: "bool", valor: id === "true" };
    // Identificador solto e referencia: var.x, aws_instance.web.id
    return { tipo: "ref", valor: id };
  }

  function lerCorpo() {
    const atributos = {};
    const blocos = [];

    for (;;) {
      pularVazio();
      if (fim() || olhar() === "}") { i++; return { atributos, blocos }; }

      const inicio = i;
      const nome = olhar() === '"' ? lerString().valor : lerIdentificador();
      if (!nome) {
        erros.push({ linha: linhaDe(inicio), msg: `não entendi o que vem aqui: "${fonte[i]}"` });
        i++;
        continue;
      }

      pularVazio();

      if (olhar() === "=") {
        i++;
        atributos[nome] = lerValor();
        continue;
      }

      // Bloco: pode ter rotulos antes da chave.
      const rotulos = [];
      while (!fim() && olhar() !== "{") {
        if (olhar() === '"') rotulos.push(lerString().valor);
        else {
          const r = lerIdentificador();
          if (!r) break;
          rotulos.push(r);
        }
        pularVazio();
      }

      if (olhar() !== "{") {
        erros.push({ linha: linhaDe(inicio), msg: `bloco "${nome}" sem abertura de chave` });
        continue;
      }
      i++;
      blocos.push({ tipo: nome, rotulos, corpo: lerCorpo(), linha: linhaDe(inicio) });
    }
  }

  const raiz = { atributos: {}, blocos: [] };
  for (;;) {
    pularVazio();
    if (fim()) break;

    const inicio = i;
    const nome = lerIdentificador();
    if (!nome) {
      erros.push({ linha: linhaDe(inicio), msg: `caractere inesperado: "${fonte[i]}"` });
      i++;
      continue;
    }

    pularVazio();

    if (olhar() === "=") {
      i++;
      raiz.atributos[nome] = lerValor();
      continue;
    }

    const rotulos = [];
    while (!fim() && olhar() !== "{") {
      if (olhar() === '"') rotulos.push(lerString().valor);
      else {
        const r = lerIdentificador();
        if (!r) break;
        rotulos.push(r);
      }
      pularVazio();
    }

    if (olhar() !== "{") {
      erros.push({ linha: linhaDe(inicio), msg: `bloco "${nome}" sem abertura de chave` });
      continue;
    }
    i++;
    raiz.blocos.push({ tipo: nome, rotulos, corpo: lerCorpo(), linha: linhaDe(inicio) });
  }

  return { raiz, erros };
}

// ------------------------------------------------------------------ recursos

/** Achata os blocos `resource` num mapa endereco -> atributos resolvidos. */
export function extrairRecursos(raiz) {
  const recursos = new Map();
  const variaveis = new Map();

  for (const b of raiz.blocos) {
    if (b.tipo === "variable") {
      const nome = b.rotulos[0];
      const padrao = b.corpo.atributos.default;
      variaveis.set(nome, padrao ? valorSimples(padrao) : null);
    }
  }

  for (const b of raiz.blocos) {
    if (b.tipo !== "resource") continue;

    const [tipo, nome] = b.rotulos;
    if (!tipo || !nome) continue;

    const endereco = `${tipo}.${nome}`;
    const atributos = {};

    for (const [k, v] of Object.entries(b.corpo.atributos)) {
      atributos[k] = valorSimples(v);
    }
    // Bloco aninhado vira atributo composto, so para o diff ter o que comparar.
    for (const sub of b.corpo.blocos) {
      const chave = sub.tipo + (sub.rotulos.length ? "." + sub.rotulos.join(".") : "");
      const dentro = {};
      for (const [k, v] of Object.entries(sub.corpo.atributos)) dentro[k] = valorSimples(v);
      atributos[chave] = dentro;
    }

    recursos.set(endereco, {
      endereco, tipo, nome, atributos,
      linha: b.linha,
      dependencias: dependenciasDe(b, recursos),
    });
  }

  // As dependencias precisam de todos os recursos ja conhecidos.
  for (const b of raiz.blocos) {
    if (b.tipo !== "resource") continue;
    const [tipo, nome] = b.rotulos;
    if (!tipo || !nome) continue;
    const r = recursos.get(`${tipo}.${nome}`);
    if (r) r.dependencias = dependenciasDe(b, recursos);
  }

  return { recursos, variaveis };
}

function valorSimples(v) {
  switch (v.tipo) {
    case "lista": return v.valor.map(valorSimples);
    case "mapa": return Object.fromEntries(Object.entries(v.valor).map(([k, x]) => [k, valorSimples(x)]));
    default: return v.valor;
  }
}

/**
 * Descobre de quem este bloco depende.
 *
 * Duas fontes: `depends_on` explicito e — o que importa de verdade —
 * referencias dentro de interpolacao. Escrever `${aws_vpc.principal.id}` JA E
 * declarar a dependencia; nao existe passo separado para isso, e e por isso
 * que o grafo sai de graca.
 */
function dependenciasDe(bloco, recursos) {
  const achados = new Set();
  const conhecidos = new Set(recursos.keys());

  const varrer = (v) => {
    if (!v) return;
    if (v.tipo === "string") {
      for (const m of String(v.valor).matchAll(/\$\{\s*([A-Za-z0-9_]+\.[A-Za-z0-9_]+)[.\s}]/g)) {
        achados.add(m[1]);
      }
    } else if (v.tipo === "ref") {
      const partes = String(v.valor).split(".");
      if (partes.length >= 2) achados.add(partes[0] + "." + partes[1]);
    } else if (v.tipo === "lista") {
      v.valor.forEach(varrer);
    } else if (v.tipo === "mapa") {
      Object.values(v.valor).forEach(varrer);
    }
  };

  Object.values(bloco.corpo.atributos).forEach(varrer);
  for (const sub of bloco.corpo.blocos) Object.values(sub.corpo.atributos).forEach(varrer);

  // depends_on aparece como lista de refs.
  const dep = bloco.corpo.atributos.depends_on;
  if (dep?.tipo === "lista") {
    for (const d of dep.valor) {
      if (d.tipo === "ref") {
        const p = String(d.valor).split(".");
        if (p.length >= 2) achados.add(p[0] + "." + p[1]);
      }
    }
  }

  const eu = bloco.rotulos.slice(0, 2).join(".");
  return [...achados].filter((a) => a !== eu && (conhecidos.size === 0 || !a.startsWith("var.")));
}

// -------------------------------------------------------------------- grafo

/**
 * Ordena em camadas: a camada 0 nao depende de ninguem, a 1 depende só da 0, e
 * assim por diante. E o que o Terraform usa para saber o que pode ser criado
 * em paralelo.
 *
 * Devolve `ciclo` quando sobra recurso sem ordem possivel — dependencia
 * circular, que e erro de verdade e nao advertencia.
 */
export function camadas(recursos) {
  const restantes = new Map([...recursos].map(([k, v]) => [k, new Set(v.dependencias.filter((d) => recursos.has(d)))]));
  const saida = [];
  const prontos = new Set();

  while (restantes.size) {
    const camada = [];
    for (const [nome, deps] of restantes) {
      if ([...deps].every((d) => prontos.has(d))) camada.push(nome);
    }

    if (camada.length === 0) {
      // Os que sobraram nao sao todos "o ciclo": a maioria so esta BLOQUEADA
      // por depender de quem esta preso nele. Dizer "ciclo entre" e listar
      // todos mandaria a pessoa procurar o problema no lugar errado.
      const ciclo = acharCiclo(restantes);
      const bloqueados = [...restantes.keys()].filter((n) => !ciclo.includes(n));
      return { camadas: saida, ciclo, bloqueados };
    }

    camada.sort();
    for (const n of camada) { restantes.delete(n); prontos.add(n); }
    saida.push(camada);
  }

  return { camadas: saida, ciclo: null, bloqueados: [] };
}

/**
 * Acha um caminho que volta para si mesmo, por busca em profundidade.
 * Devolve os nós do ciclo na ordem em que se referenciam.
 */
function acharCiclo(restantes) {
  const visitando = new Set();
  const visitado = new Set();
  const caminho = [];

  function descer(no) {
    if (visitando.has(no)) {
      // Fecha o laço: recorta do primeiro encontro em diante.
      return caminho.slice(caminho.indexOf(no));
    }
    if (visitado.has(no)) return null;

    visitando.add(no);
    caminho.push(no);

    for (const dep of restantes.get(no) ?? []) {
      if (!restantes.has(dep)) continue;
      const achado = descer(dep);
      if (achado) return achado;
    }

    caminho.pop();
    visitando.delete(no);
    visitado.add(no);
    return null;
  }

  for (const no of restantes.keys()) {
    const achado = descer(no);
    if (achado) return achado;
  }
  return [...restantes.keys()];
}

// --------------------------------------------------------------------- plan

/**
 * Compara o estado atual com a configuracao.
 *
 * Esta funcao e o `terraform plan`. Ela nao muda nada — e exatamente esse o
 * ponto: ver o estrago antes de causá-lo.
 */
export function planejar(estado, recursos) {
  const mudancas = [];

  for (const [endereco, r] of recursos) {
    const anterior = estado[endereco];

    if (!anterior) {
      mudancas.push({ acao: "criar", endereco, tipo: r.tipo, depois: r.atributos });
      continue;
    }

    const campos = [];
    const chaves = new Set([...Object.keys(anterior), ...Object.keys(r.atributos)]);

    for (const k of chaves) {
      const a = JSON.stringify(anterior[k]);
      const b = JSON.stringify(r.atributos[k]);
      if (a !== b) campos.push({ campo: k, de: anterior[k], para: r.atributos[k] });
    }

    if (campos.length) {
      mudancas.push({ acao: "alterar", endereco, tipo: r.tipo, campos });
    }
  }

  for (const endereco of Object.keys(estado)) {
    if (!recursos.has(endereco)) {
      mudancas.push({ acao: "destruir", endereco, tipo: endereco.split(".")[0], antes: estado[endereco] });
    }
  }

  return mudancas;
}

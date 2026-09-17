/**
 * "A chave errada" — o bug de `key` do React, provado em vez de explicado.
 *
 * Todo tutorial diz "nao use o indice como key". Quase nenhum mostra o que
 * acontece quando voce usa. Esta pagina mostra: o texto que voce digitou
 * gruda na POSICAO da lista, nao na pessoa, e passa a pertencer a outra
 * pessoa assim que a ordem muda.
 *
 * O motivo e o reconciliador. React compara a arvore nova com a antiga
 * emparelhando os filhos pela `key`. Com `key={indice}`, a chave 0 do render
 * anterior e a chave 0 do render novo — entao ele conclui que e o MESMO
 * componente, reaproveita a instancia e o no do DOM, e so troca o texto que
 * mudou. O `<input>` nao controlado guarda o valor dentro do no do DOM, e o
 * `useState` guarda dentro da instancia: os dois ficam onde estavam, agora
 * ao lado dos dados errados.
 */

// jsx: "automatic" no esbuild injeta o runtime sozinho — nao existe mais o
// `import React` obrigatorio das versoes antigas.
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";

// ---------------------------------------------------------------- dados

const EQUIPE = [
  { id: 101, nome: "Ana Ribeiro", cargo: "engenharia de dados" },
  { id: 102, nome: "Bruno Sato", cargo: "infraestrutura" },
  { id: 103, nome: "Carla Nunes", cargo: "produto" },
  { id: 104, nome: "Diego Alves", cargo: "seguranca" },
  { id: 105, nome: "Elisa Moraes", cargo: "design" },
];

const CANDIDATOS = [
  { nome: "Fabio Lima", cargo: "backend" },
  { nome: "Gabi Rocha", cargo: "mobile" },
  { nome: "Heitor Paiva", cargo: "qualidade" },
  { nome: "Iara Campos", cargo: "dados" },
];

const iniciais = (nome) =>
  nome.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

// Cor derivada do id: se a cor de uma linha mudar, e porque o no do DOM foi
// reaproveitado para outra pessoa. E mais um sinal visivel do mesmo problema.
const matiz = (id) => (id * 47) % 360;

// ------------------------------------------------------- instrumentacao

/**
 * Conta o que o React realmente fez com o DOM.
 *
 * A distincao que interessa e entre no CRIADO e no MOVIDO, e o
 * MutationObserver sozinho nao a entrega: mover um no existente com
 * insertBefore aparece como remocao seguida de insercao, igualzinho a criar
 * um no novo. Guardar os nos ja vistos num WeakSet resolve — se o no que
 * chegou ja passou por aqui, ele foi movido, nao criado.
 */
function usarEspiaoDoDom(ref, aoMudar, geracao) {
  const vistos = useRef(new WeakSet());
  const observador = useRef(null);

  useLayoutEffect(() => {
    const alvo = ref.current;
    if (!alvo) return;

    const obs = new MutationObserver((registros) => {
      let criados = 0;
      let movidos = 0;
      let removidos = 0;

      for (const r of registros) {
        for (const no of r.addedNodes) {
          if (no.nodeType !== 1 || no.tagName !== "LI") continue;
          if (vistos.current.has(no)) movidos++;
          else {
            criados++;
            vistos.current.add(no);
          }
        }
        for (const no of r.removedNodes) {
          if (no.nodeType === 1 && no.tagName === "LI") removidos++;
        }
      }

      // Um no movido aparece tambem como removido; descontar evita um numero
      // que assusta sem significar nada.
      removidos = Math.max(0, removidos - movidos);

      if (criados || movidos || removidos) aoMudar({ criados, movidos, removidos });
    });

    obs.observe(alvo, { childList: true });
    observador.current = obs;

    return () => {
      obs.disconnect();
      observador.current = null;
    };
  }, [ref, aoMudar]);

  // Resemeia a cada reinicio. Sem isto, os <li> recriados pelo proprio
  // reinicio entrariam na conta como "criados" — ruido do botao, nao
  // resultado de uma acao do visitante.
  //
  // takeRecords() e o que faz a limpeza funcionar: as mutacoes do reinicio ja
  // estao na fila, e a callback so seria entregue depois daqui. Descartar a
  // fila antes de resemear e a unica ordem que produz contador zerado de
  // verdade.
  useLayoutEffect(() => {
    const alvo = ref.current;
    if (!alvo) return;
    observador.current?.takeRecords();
    vistos.current = new WeakSet();
    for (const li of alvo.children) vistos.current.add(li);
  }, [geracao, ref]);
}

// ------------------------------------------------------------- componente

function Linha({ pessoa, aoAnotar, aoMontar }) {
  // Estado que vive DENTRO da instancia do componente. Quando o React
  // reaproveita a instancia para outra pessoa, este numero vai junto.
  const [estrelas, setEstrelas] = useState(0);

  useEffect(() => {
    aoMontar();
    // Sem dependencia nenhuma: roda uma vez por montagem. Se este efeito nao
    // dispara numa reordenacao, e porque a instancia foi reaproveitada.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cor = matiz(pessoa.id);

  return (
    <li className="pessoa" data-id={pessoa.id}>
      <span
        className="av"
        style={{ background: `hsl(${cor} 60% 22%)`, color: `hsl(${cor} 85% 74%)` }}
      >
        {iniciais(pessoa.nome)}
      </span>

      <span className="quem">
        <b>{pessoa.nome}</b>
        <small>
          {pessoa.cargo} · id {pessoa.id}
        </small>
      </span>

      {/* Input NAO controlado de proposito: o valor mora dentro do no do DOM,
          que e exatamente o que o React decide reaproveitar ou nao. */}
      <input
        className="anot"
        type="text"
        placeholder="anote algo sobre esta pessoa"
        defaultValue=""
        onInput={(e) => aoAnotar(pessoa.id, e.target.value)}
        aria-label={`Anotação sobre ${pessoa.nome}`}
      />

      <button
        className="estrela"
        onClick={() => setEstrelas((n) => n + 1)}
        title="estado guardado dentro da instância do componente"
      >
        ★ {estrelas}
      </button>
    </li>
  );
}

function App() {
  const [porIndice, setPorIndice] = useState(true);
  const [pessoas, setPessoas] = useState(EQUIPE);
  const [proximo, setProximo] = useState(0);
  const [dom, setDom] = useState({ criados: 0, movidos: 0, removidos: 0 });
  const [montagens, setMontagens] = useState(0);
  const [foraDoLugar, setForaDoLugar] = useState(0);
  const [ultimaAcao, setUltimaAcao] = useState(null);
  const [geracao, setGeracao] = useState(0);

  const lista = useRef(null);

  // O que o visitante QUIS anotar, por id. E o gabarito: o que estiver no DOM
  // e o que o React de fato entregou.
  const esperado = useRef({});

  const contarDom = useCallback((d) => {
    setDom((a) => ({
      criados: a.criados + d.criados,
      movidos: a.movidos + d.movidos,
      removidos: a.removidos + d.removidos,
    }));
  }, []);

  usarEspiaoDoDom(lista, contarDom, geracao);

  const anotar = useCallback((id, texto) => {
    esperado.current[id] = texto;
  }, []);

  const contarMontagem = useCallback(() => {
    setMontagens((n) => n + 1);
  }, []);

  // Depois de cada render, confere linha por linha se a anotacao que esta na
  // tela pertence a pessoa que esta na tela. Sem array de dependencia: o
  // problema so existe DEPOIS que o React mexeu no DOM.
  useEffect(() => {
    if (!lista.current) return;
    let erradas = 0;
    for (const li of lista.current.children) {
      const id = Number(li.dataset.id);
      const campo = li.querySelector("input");
      if (!campo) continue;
      if ((campo.value || "") !== (esperado.current[id] || "")) erradas++;
    }
    setForaDoLugar(erradas);
  });

  // ------------------------------------------------------------- acoes

  function anotarTodas() {
    if (!lista.current) return;
    for (const li of lista.current.children) {
      const id = Number(li.dataset.id);
      const campo = li.querySelector("input");
      const pessoa = pessoas.find((p) => p.id === id);
      if (!campo || !pessoa) continue;
      const texto = `nota sobre ${pessoa.nome.split(" ")[0]}`;
      campo.value = texto;
      esperado.current[id] = texto;
    }
    setUltimaAcao("Anotei uma frase em cada linha. Agora mude a ordem.");
    setForaDoLugar(0);
  }

  function inserirNoTopo() {
    const modelo = CANDIDATOS[proximo % CANDIDATOS.length];
    const nova = { id: 200 + proximo, nome: modelo.nome, cargo: modelo.cargo };
    setProximo((n) => n + 1);
    setPessoas((ps) => [nova, ...ps]);
    setUltimaAcao(`Inseri ${modelo.nome} no topo.`);
  }

  function removerPrimeira() {
    setPessoas((ps) => (ps.length > 1 ? ps.slice(1) : ps));
    setUltimaAcao("Removi a primeira linha.");
  }

  function embaralhar() {
    setPessoas((ps) => {
      const c = [...ps];
      for (let i = c.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [c[i], c[j]] = [c[j], c[i]];
      }
      return c;
    });
    setUltimaAcao("Embaralhei a lista.");
  }

  function reiniciar(novoModo) {
    // Trocar a estrategia de chave remonta a lista inteira, e os <input> nao
    // controlados perdem o valor junto. Reiniciar de proposito evita comparar
    // duas situacoes que nao sao comparaveis.
    setPessoas(EQUIPE);
    setProximo(0);
    setDom({ criados: 0, movidos: 0, removidos: 0 });
    setMontagens(0);
    setForaDoLugar(0);
    esperado.current = {};
    if (typeof novoModo === "boolean") setPorIndice(novoModo);
    setUltimaAcao(null);
    // Incrementar por ultimo e so um detalhe de leitura: e este valor que
    // manda o espiao resemear depois que tudo acima ja entrou no mesmo lote.
    setGeracao((n) => n + 1);
  }

  const modo = porIndice ? "key={índice}" : "key={pessoa.id}";

  return (
    <div className="duas">
      <section className="painel">
        <h2>
          A lista <span className="hint">com {modo}</span>
        </h2>

        <div className="opcoes">
          <button className={porIndice ? "sel" : ""} onClick={() => reiniciar(true)}>
            key = índice
          </button>
          <button className={!porIndice ? "sel" : ""} onClick={() => reiniciar(false)}>
            key = id
          </button>
        </div>

        <ol className="lista" ref={lista}>
          {pessoas.map((p, i) => (
            <Linha
              key={porIndice ? i : p.id}
              pessoa={p}
              aoAnotar={anotar}
              aoMontar={contarMontagem}
            />
          ))}
        </ol>

        <div className="linha" style={{ marginTop: 16 }}>
          <button className="pri" onClick={anotarTodas}>
            1. Anotar em todas
          </button>
          <button onClick={inserirNoTopo}>2. Inserir no topo</button>
          <button onClick={embaralhar}>Embaralhar</button>
          <button onClick={removerPrimeira}>Remover a 1ª</button>
          <button onClick={() => reiniciar()}>Reiniciar</button>
        </div>

        {ultimaAcao && <p className="acao">{ultimaAcao}</p>}
      </section>

      <section className="painel">
        <h2>
          O que o React fez <span className="hint">medido, não suposto</span>
        </h2>

        <div className={`veredito ${foraDoLugar ? "ruim" : "bom"}`}>
          {foraDoLugar > 0 ? (
            <>
              <b>{foraDoLugar} anotação(ões) na linha errada.</b> O texto ficou onde
              estava — colado na posição — e agora pertence a outra pessoa.
            </>
          ) : (
            <>
              <b>Nenhuma anotação fora do lugar.</b> Cada texto continua com a pessoa de
              quem ele fala.
            </>
          )}
        </div>

        <div className="kpis">
          <div className="kpi">
            <div className="n">{dom.criados}</div>
            <div className="l">nós criados</div>
          </div>
          <div className="kpi">
            <div className="n">{dom.movidos}</div>
            <div className="l">nós movidos</div>
          </div>
          <div className="kpi">
            <div className="n">{dom.removidos}</div>
            <div className="l">nós removidos</div>
          </div>
          <div className="kpi">
            <div className="n">{montagens}</div>
            <div className="l">componentes montados</div>
          </div>
        </div>

        <p className="dica">
          <b>Como reproduzir em dois cliques.</b> Com <code>key = índice</code>: clique em{" "}
          <b>“Anotar em todas”</b> e depois em <b>“Inserir no topo”</b>. As anotações e as
          estrelas ficam paradas enquanto os nomes descem uma linha. Repita com{" "}
          <b>key = id</b> e nada sai do lugar.
        </p>

        <p className="dica">
          <b>Por que acontece.</b> O reconciliador emparelha os filhos pela chave. Com o
          índice, a chave <code>0</code> de antes e a chave <code>0</code> de agora são a
          mesma coisa para ele — então reaproveita a instância e o nó do DOM, e troca só o
          texto que mudou. O <code>&lt;input&gt;</code> não controlado guarda o valor dentro
          do nó; o <code>useState</code> das estrelas guarda dentro da instância. Os dois
          ficam onde estavam.
        </p>

        <p className="dica">
          <b>O detalhe que engana.</b> Repare nos contadores: com o índice o React mexe{" "}
          <em>menos</em> no DOM — cria e move menos nós, e monta menos componentes. Ele está
          fazendo exatamente o que foi mandado, e mais barato. O índice não é lento; é
          mentiroso. Chave é identidade, e posição não é identidade.
        </p>
      </section>
    </div>
  );
}

createRoot(document.getElementById("raiz")).render(<App />);

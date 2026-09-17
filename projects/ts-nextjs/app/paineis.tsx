// Os painéis do dashboard. Todos são Server Components: eles rodam no
// servidor, o resultado chega como HTML e **nenhuma linha deles vai para o
// navegador como JavaScript**.
//
// Cada um emite, no próprio HTML, um script de uma linha que grava o instante
// em que aquele pedaço chegou. É a medição mais honesta possível: acontece na
// hora em que o navegador analisa o trecho, não quando o React hidrata.

import {
  resumoDoDia,
  maisVendidos,
  movimentoPorHora,
  conciliacaoFinanceira,
  type Consulta,
} from "./dados";

const dinheiro = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function MarcarChegada({ id }: { id: string }) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html:
          `window.__chegada=window.__chegada||{};` +
          `window.__chegada[${JSON.stringify(id)}]=performance.now();`,
      }}
    />
  );
}

function Cabecalho({ c }: { c: Consulta<unknown> }) {
  return (
    <div className="p-topo">
      <span className="p-nome">{c.rotulo}</span>
      <span className="p-lat">{c.medidoMs} ms no servidor</span>
    </div>
  );
}

// ------------------------------------------------------------------ resumo

export async function PainelResumo() {
  const c = await resumoDoDia();
  return (
    <section className="cartao">
      <MarcarChegada id={c.id} />
      <Cabecalho c={c} />
      <div className="kpis">
        <div>
          <div className="kpi-n">{dinheiro(c.dados.vendasHoje)}</div>
          <div className="kpi-l">faturamento</div>
        </div>
        <div>
          <div className="kpi-n">{c.dados.pedidos}</div>
          <div className="kpi-l">atendimentos</div>
        </div>
        <div>
          <div className="kpi-n">{dinheiro(c.dados.ticket)}</div>
          <div className="kpi-l">ticket médio</div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- produtos

export async function PainelProdutos() {
  const c = await maisVendidos();
  const maior = Math.max(...c.dados.map((p) => p.receita));

  return (
    <section className="cartao">
      <MarcarChegada id={c.id} />
      <Cabecalho c={c} />
      <ul className="lista">
        {c.dados.map((p) => (
          <li key={p.nome}>
            <span className="l-nome">{p.nome}</span>
            <span className="l-barra">
              <i style={{ width: `${(p.receita / maior) * 100}%` }} />
            </span>
            <span className="l-valor">{dinheiro(p.receita)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ------------------------------------------------------------------- horas

export async function PainelHoras() {
  const c = await movimentoPorHora();
  const maior = Math.max(...c.dados.map((h) => h.valor));

  return (
    <section className="cartao">
      <MarcarChegada id={c.id} />
      <Cabecalho c={c} />
      <div className="colunas">
        {c.dados.map((h) => (
          <div key={h.hora} className="coluna">
            <i style={{ height: `${(h.valor / maior) * 100}%` }} title={dinheiro(h.valor)} />
            <span>{h.hora}h</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ------------------------------------------------------------- conciliação

export async function PainelConciliacao() {
  const c = await conciliacaoFinanceira();
  return (
    <section className="cartao">
      <MarcarChegada id={c.id} />
      <Cabecalho c={c} />
      <div className="conc">
        <div className="conc-linha">
          <span>recebido</span>
          <b>{dinheiro(c.dados.recebido)}</b>
        </div>
        <div className="conc-linha">
          <span>a receber</span>
          <b>{dinheiro(c.dados.aReceber)}</b>
        </div>
        <div className="conc-linha">
          <span>taxas</span>
          <b className="neg">− {dinheiro(c.dados.taxas)}</b>
        </div>
        <div className="conc-linha destaque">
          <span>divergências</span>
          <b className={c.dados.divergencias > 0 ? "alerta" : ""}>{c.dados.divergencias}</b>
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------- esqueleto

export function Esqueleto({ rotulo, ms }: { rotulo: string; ms: number }) {
  return (
    <section className="cartao esqueleto">
      <div className="p-topo">
        <span className="p-nome">{rotulo}</span>
        <span className="p-lat">carregando… (~{ms} ms)</span>
      </div>
      <div className="barras-falsas">
        <i /><i /><i />
      </div>
    </section>
  );
}

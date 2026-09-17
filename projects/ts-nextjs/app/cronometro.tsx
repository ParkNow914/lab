"use client";

// A cascata de chegada.
//
// Este é o ÚNICO componente cliente da página. Todo o resto é Server Component
// e não envia JavaScript nenhum ao navegador — o que a própria página mostra
// no rodapé.
//
// Ele lê `window.__chegada`, preenchido pelos scripts de uma linha que cada
// painel emite no meio do HTML, e desenha quando cada pedaço apareceu.

import { useEffect, useState } from "react";

type Chegada = { id: string; rotulo: string; ms: number };

const ROTULOS: Record<string, string> = {
  resumo: "Resumo do dia",
  produtos: "Mais vendidos",
  horas: "Movimento por hora",
  conciliacao: "Conciliação financeira",
};

const ORDEM = ["resumo", "produtos", "horas", "conciliacao"];

export function Cronometro({ modo }: { modo: string }) {
  const [chegadas, setChegadas] = useState<Chegada[]>([]);
  const [completo, setCompleto] = useState(false);

  useEffect(() => {
    const ler = () => {
      const bruto = (window as unknown as { __chegada?: Record<string, number> }).__chegada ?? {};
      const lista = ORDEM.filter((id) => bruto[id] !== undefined).map((id) => ({
        id,
        rotulo: ROTULOS[id] ?? id,
        ms: Math.round(bruto[id]),
      }));
      setChegadas(lista);
      if (lista.length === ORDEM.length) setCompleto(true);
      return lista.length === ORDEM.length;
    };

    if (ler()) return;

    // Amostragem curta: durante o streaming os painéis chegam ao longo de
    // alguns segundos, e cada leitura pega os que já apareceram.
    const t = setInterval(() => { if (ler()) clearInterval(t); }, 100);
    const parar = setTimeout(() => clearInterval(t), 15000);
    return () => { clearInterval(t); clearTimeout(parar); };
  }, []);

  const total = chegadas.length ? Math.max(...chegadas.map((c) => c.ms)) : 1;
  const primeiro = chegadas.length ? Math.min(...chegadas.map((c) => c.ms)) : 0;
  const escala = Math.max(total, 1);

  return (
    <div className="cascata">
      <div className="cascata-topo">
        <span>quando cada painel chegou ao navegador</span>
        {completo && (
          <span className="cascata-resumo">
            primeiro em <b>{Math.round(primeiro)} ms</b> · último em <b>{Math.round(total)} ms</b>
          </span>
        )}
      </div>

      {ORDEM.map((id) => {
        const c = chegadas.find((x) => x.id === id);
        const largura = c ? (c.ms / escala) * 100 : 0;
        return (
          <div className="cascata-linha" key={id}>
            <span className="cascata-nome">{ROTULOS[id]}</span>
            <span className="cascata-trilho">
              <i
                className={c ? "chegou" : ""}
                style={{ width: `${Math.max(largura, c ? 3 : 0)}%` }}
              />
            </span>
            <span className="cascata-ms">{c ? `${c.ms} ms` : "…"}</span>
          </div>
        );
      })}

      <p className="cascata-nota">
        {modo === "bloqueante" ? (
          <>
            No modo <b>bloqueante</b> as quatro barras terminam juntas: o servidor esperou a
            consulta mais lenta antes de enviar qualquer coisa. O visitante olhou para uma
            tela em branco o tempo todo.
          </>
        ) : (
          <>
            No modo <b>streaming</b> cada barra termina no seu tempo: o servidor foi enviando
            cada pedaço assim que ficou pronto. O primeiro conteúdo apareceu muito antes do
            relatório pesado terminar.
          </>
        )}
      </p>
    </div>
  );
}

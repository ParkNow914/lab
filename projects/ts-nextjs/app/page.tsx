import { Suspense } from "react";
import {
  PainelResumo,
  PainelProdutos,
  PainelHoras,
  PainelConciliacao,
  Esqueleto,
} from "./paineis";
import { Cronometro } from "./cronometro";

// Sem cache: esta página mede tempo de resposta, e uma resposta servida do
// cache mediria zero — o que apagaria o ponto da demonstração.
export const dynamic = "force-dynamic";

export default async function Pagina({
  searchParams,
}: {
  // No Next 16 searchParams é uma Promise: a página pode começar a renderizar
  // antes de a URL ser resolvida.
  searchParams: Promise<{ modo?: string }>;
}) {
  const { modo } = await searchParams;
  const bloqueante = modo === "bloqueante";

  return (
    <>
      <div className="topo">
        <div className="container topo-in">
          <a className="voltar" href="https://autarktech.com.br/lab/">← Laboratório</a>
          <span className="topo-sp" />
          <span className="topo-lang">TypeScript · Next.js</span>
          <a
            className="topo-fonte"
            href="https://github.com/ParkNow914/lab/tree/main/projects/ts-nextjs"
          >
            Código ↗
          </a>
        </div>
      </div>

      <div className="container cab">
        <h1>O usuário não precisa esperar o dado mais lento</h1>
        <p className="pitch">
          Este painel tem quatro consultas: 150 ms, 600 ms, 1,2 s e 2,2 s. No modo{" "}
          <strong>bloqueante</strong>, o servidor espera todas antes de mandar qualquer
          coisa — tela branca por 2,2 segundos. Com <strong>streaming</strong>, cada pedaço
          é enviado assim que fica pronto. O mesmo dado, a mesma espera total, experiência
          completamente diferente.
        </p>

        <div className="meta">
          <span>Next.js 16</span>
          <span>React Server Components</span>
          <span>Suspense + streaming</span>
          <span>1 componente cliente</span>
          <span>hospedado na Vercel</span>
        </div>

        <div className="porque">
          <b>Por que este projeto</b>
          Next.js é onde eu trabalho todo dia. Server Components é a parte que quase
          ninguém usa direito — e a diferença não é teórica: é a distância entre uma tela
          branca de dois segundos e um painel que começa a aparecer em cento e cinquenta
          milissegundos.
        </div>
      </div>

      <main className="palco">
        <div className="container">
          <section className="painel">
            <h2>
              Modo <span className="hint">troque e recarregue</span>
            </h2>
            <div className="modos">
              <a className={!bloqueante ? "ativo" : ""} href="/?modo=streaming">
                streaming
              </a>
              <a className={bloqueante ? "ativo" : ""} href="/?modo=bloqueante">
                bloqueante
              </a>
            </div>

            <Cronometro modo={bloqueante ? "bloqueante" : "streaming"} />
          </section>

          <div className="grade-paineis">
            {bloqueante ? (
              // Sem Suspense: o React precisa de TODOS os componentes resolvidos
              // antes de emitir o HTML. O `await` mais lento manda na página.
              <>
                <PainelResumo />
                <PainelProdutos />
                <PainelHoras />
                <PainelConciliacao />
              </>
            ) : (
              // Com Suspense: cada fronteira vira um pedaço independente no
              // fluxo. O servidor manda o esqueleto na hora e substitui cada um
              // conforme fica pronto — sem nenhum JavaScript de aplicação.
              <>
                <Suspense fallback={<Esqueleto rotulo="Resumo do dia" ms={150} />}>
                  <PainelResumo />
                </Suspense>
                <Suspense fallback={<Esqueleto rotulo="Mais vendidos" ms={600} />}>
                  <PainelProdutos />
                </Suspense>
                <Suspense fallback={<Esqueleto rotulo="Movimento por hora" ms={1200} />}>
                  <PainelHoras />
                </Suspense>
                <Suspense fallback={<Esqueleto rotulo="Conciliação financeira" ms={2200} />}>
                  <PainelConciliacao />
                </Suspense>
              </>
            )}
          </div>

          <section className="painel">
            <h2>O que muda no código</h2>
            <p className="dica">
              Literalmente uma coisa: envolver cada painel num <code>&lt;Suspense&gt;</code>.
              As consultas são as mesmas, os componentes são os mesmos, o tempo total do
              servidor é o mesmo.
            </p>
            <pre className="codigo">{`// bloqueante — o await mais lento manda na página
<PainelResumo />
<PainelProdutos />
<PainelHoras />
<PainelConciliacao />

// streaming — cada fronteira vira um pedaço independente do fluxo
<Suspense fallback={<Esqueleto />}><PainelResumo /></Suspense>
<Suspense fallback={<Esqueleto />}><PainelProdutos /></Suspense>
<Suspense fallback={<Esqueleto />}><PainelHoras /></Suspense>
<Suspense fallback={<Esqueleto />}><PainelConciliacao /></Suspense>`}</pre>

            <p className="dica" style={{ marginTop: 16 }}>
              <b>E o JavaScript?</b> Os quatro painéis são Server Components: eles rodam no
              servidor e chegam como HTML. Nenhuma linha deles vai para o navegador. O único
              componente cliente desta página é a cascata acima — ela precisa do{" "}
              <code>useEffect</code> para ler os tempos.
            </p>
            <p className="dica">
              Abra as ferramentas do desenvolvedor na aba de rede e recarregue: no modo
              streaming, o documento HTML fica <b>aberto</b> por mais de dois segundos,
              recebendo pedaço por pedaço. Não é uma requisição por painel — é{" "}
              <b>uma resposta só</b>, enviada aos poucos.
            </p>
            <p className="dica">
              <b>Medido nesta própria hospedagem</b>, lendo a resposta byte a byte: no
              streaming o primeiro byte sai em algumas centenas de milissegundos e os
              painéis vão chegando; no bloqueante, o primeiro byte só sai depois de ~2,5 s,
              e aí tudo chega junto. Os números exatos variam com a rede e com partida a
              frio — a cascata no topo mostra os da <em>sua</em> visita.
            </p>
            <p className="dica">
              Um detalhe honesto: os dois primeiros painéis costumam chegar <em>juntos</em>,
              e não em 150 ms e 600 ms separadamente. O React agrupa descargas próximas em
              vez de mandar um pedaço minúsculo por vez — enviar TCP de 200 bytes seria pior
              que esperar meio segundo. Streaming não é “um pedaço por componente”; é o
              servidor decidindo quando vale a pena mandar o que já tem.
            </p>
          </section>
        </div>
      </main>

      <div className="rodape">
        <div className="container rodape-in">
          <span>Alisson Santos · Autark</span>
          <a href="https://autarktech.com.br/lab/">Laboratório</a>
          <a href="https://autarktech.com.br/">Portfólio</a>
          <a href="https://github.com/ParkNow914/lab/tree/main/projects/ts-nextjs">
            Ver o código
          </a>
        </div>
      </div>
    </>
  );
}

# Painel com Server Components e streaming

**TypeScript + Next.js 16** · Hospedado na Vercel · React 19

**→ <https://lab-nextjs-streaming.vercel.app/>**

O mesmo painel servido de dois jeitos: esperando a consulta mais lenta, ou enviando cada
pedaço assim que fica pronto.

## Por que este projeto

Next.js é onde eu trabalho todo dia. Server Components é a parte que quase ninguém usa
direito — e a diferença não é teórica: é a distância entre uma tela branca de dois
segundos e um painel que começa a aparecer em algumas centenas de milissegundos.

## O que muda no código

Literalmente uma coisa: envolver cada painel num `<Suspense>`. As consultas são as
mesmas, os componentes são os mesmos, o tempo total do servidor é o mesmo.

## Medido lendo a resposta byte a byte

Local (`next start`):

| modo | primeiro byte | painéis chegam em |
|---|---|---|
| streaming | **81 ms** | 684 / 684 / 1287 / 2308 ms |
| bloqueante | **2217 ms** | tudo junto aos 2217 ms |

Em produção na Vercel (com rede e partida a frio):

| modo | primeiro byte | painéis chegam em |
|---|---|---|
| streaming | **435 ms** | 1011 / 1612 / 2611 / 2613 ms |
| bloqueante | **2581 ms** | tudo junto aos 2581 ms |

**A Vercel faz streaming de verdade** — não bufferiza a resposta. Isso precisava ser
verificado, não presumido.

## Um detalhe honesto

Os dois primeiros painéis costumam chegar *juntos*, e não em 150 ms e 600 ms
separadamente. O React agrupa descargas próximas em vez de mandar um pedaço minúsculo por
vez — enviar um TCP de 200 bytes seria pior que esperar meio segundo. Streaming não é
"um pedaço por componente"; é o servidor decidindo quando vale a pena mandar o que já tem.

## Casco visual sem duplicação

A página carrega `https://autarktech.com.br/lab/demo.css` e as fontes por URL absoluta. Os
assets do laboratório respondem com `Access-Control-Allow-Origin: *`, então funciona de
outro domínio — e evita manter uma cópia divergente do CSS só porque esta demo mora na
Vercel.

## Rodar local

```bash
npm install
npm run build && npm start
```

## Publicar

```bash
vercel deploy --prod
```

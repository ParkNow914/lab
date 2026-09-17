# A parte do RAG que decide a qualidade

**Python + FastAPI** · Função serverless na Vercel · BM25 escrito do zero

**→ <https://lab-rag-busca.vercel.app/>**

Busca com citação da fonte sobre a documentação técnica dos meus próprios sistemas.

## Por que este projeto

Quase toda conversa sobre RAG gira em torno do modelo de linguagem. Mas o modelo só
responde com o que recebe: se a recuperação trouxer o trecho errado, **nenhum modelo
salva**. A parte que determina a qualidade acontece antes do LLM, e é ela que está aqui.

## O que tem dentro

1. **Fatiamento por seção** — a decisão mais subestimada do RAG. Pedaço grande dilui o
   assunto e traz ruído; pequeno perde o contexto. Cortar por seção respeita a estrutura
   que o autor já criou, em vez de partir a cada N caracteres.
2. **Índice invertido** com frequência por documento.
3. **BM25** — o mesmo algoritmo do Elasticsearch e do Lucene. `k1` controla a saturação
   (a décima ocorrência vale menos que a segunda) e `b` o peso do tamanho do trecho.
4. **Citação** — documento, seção e *quais termos* fizeram aquele trecho vencer. Não
   afirma que é relevante: mostra a conta.

## O que este projeto não esconde

BM25 é **lexical**. Pergunte "como pagar com cartão de crédito?" e a busca não encontra
nada — os textos falam de PIX. A API devolve `termos_ausentes` com exatamente as palavras
que não existem em trecho nenhum, e a página explica que é aí que entram os embeddings.

Não coloquei embeddings porque exigiriam chave de API paga, e demo de portfólio não
deveria depender de fatura. A peça que mudaria é só o ranqueamento; fatiamento, índice e
citação continuam iguais.

## API

```
GET /api/saude
GET /api/buscar?q=<pergunta>&limite=4
GET /api/docs          OpenAPI gerado pelo FastAPI
```

## Medido em produção

31 trechos de 6 documentos, 498 termos no índice, indexação em **2,57 ms** na partida e
busca em **0,096 ms**.

## Uma armadilha da Vercel

A primeira versão tinha `rewrites` mandando tudo para `/api/index`, e **todas** as rotas
davam 404 — com o 404 do próprio FastAPI, o que confunde. O log de build avisa:

> *Internal rewrites in backend framework projects now route requests using the rewritten
> destination path.*

Ou seja: o rewrite troca o caminho que a aplicação recebe. A Vercel já detecta FastAPI
como framework de backend e roteia sozinha — a correção foi **remover** o rewrite.

## Rodar local

```bash
pip install -r requirements.txt
uvicorn api.index:app --reload
```

## Publicar

```bash
vercel deploy --prod
```

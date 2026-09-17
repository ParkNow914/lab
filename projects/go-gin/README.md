# "Dados inválidos" não é mensagem de erro

**Go + Gin** · Função serverless na Vercel · validator/v10

**→ <https://lab-gin-validacao.vercel.app/>**

## Por que este projeto

Gin é o framework HTTP mais usado em Go. Mas o que separa uma API boa de uma ruim
raramente é o framework: é o que ela devolve quando algo dá errado. Erro genérico empurra
o custo para quem consome — e quem consome costuma ser você mesmo, seis meses depois.

## O que a demo mostra

**Validação acionável.** Um POST com seis campos errados devolve seis frases, todas de
uma vez:

```
nome: precisa de pelo menos 3 caracteres
sku: só aceita letras e números
preco: precisa ser maior que 0
estoque: não pode ser menor que 0
categoria: precisa ser um destes — servico, produto, assinatura
email: não é um e-mail válido
```

O `validator` devolve `Key: 'Produto.SKU' Error:Field validation for 'SKU' failed on the
'len' tag`. A função `traduzir` transforma isso em português. São trinta linhas que mudam
a experiência de quem integra.

**A cadeia de middleware, visível.** Cada resposta traz as etapas na ordem em que
rodaram, com o tempo de cada uma: `recuperar → identificar → limitar → validar → handler`.

**Panic que não vira resposta vazia.** `GET /api/explodir` dispara um panic de propósito;
o middleware de recuperação devolve 500 com explicação em vez de uma resposta truncada.

## O que a demo não finge

O rate limit é só um selo na cadeia. Em função serverless o estado não sobrevive entre
instâncias — limite de verdade mora no Redis ou na borda. Uma versão em memória que
"funciona" seria mentira que só aparece em produção, sob carga.

## Três armadilhas da Vercel com Go

1. **Todo `.go` dentro de `api/` vira uma função** e precisa de um `Handler` exportado.
   Um segundo arquivo só com a declaração do `go:embed` quebra o build.
2. **Nomes-base iguais colidem**: `api/pagina.go` e `api/pagina.html` disputam a rota
   `/api/pagina`. Por isso o HTML foi para `api/web/`.
3. **Go precisa de `rewrites`; FastAPI precisa do contrário.** A Vercel detecta FastAPI
   como framework de backend e passa a rotear pelo caminho *reescrito* — lá o rewrite tem
   que ser removido. Go não é detectado, então sem rewrite só `/api/index` responde. As
   duas demos deste laboratório usam configurações opostas, e cada uma está certa.

## Rodar local

```bash
go run ./api   # precisa de um main; na Vercel o ponto de entrada é Handler
```

## Publicar

```bash
vercel deploy --prod
```

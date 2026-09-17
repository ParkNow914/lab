# Sala colaborativa com LiveView

Um quadro que várias pessoas escrevem ao mesmo tempo, e um botão vermelho que
mata o processo do servidor para o supervisor recriá-lo na frente de quem está
olhando.

## O que a página prova

**Zero JavaScript de aplicação.** O único `.js` servido é o cliente do Phoenix:
ele mantém um websocket e aplica no DOM as diferenças de HTML que o servidor
calcula. Quem digita, quem está online, o que o quadro mostra — tudo é decidido
em Elixir, no servidor.

**Tolerância a falha que dá para verificar.** `Process.exit(pid, :kill)` mata o
`GenServer` que guarda o quadro. O que acontece em seguida é o ponto inteiro:

- o **PID muda** — é outro processo, criado do zero;
- as **notas somem**, porque estavam dentro dele;
- a **página não cai**, a lista de presença continua, e sua conexão nem pisca.

Sob `strategy: :one_for_one`, só o processo que morreu é recriado. O endpoint,
o PubSub e cada conexão aberta são outros processos, e a falha não vaza de um
para o outro.

## Três decisões que o código toma, e por quê

**O contador de mortes vive fora do processo.** Em `:persistent_term`, não no
estado do `GenServer` — senão ele voltaria a zero justamente na hora que
precisa contar. É a pergunta que OTP obriga a responder em todo projeto: o que
pode se perder num reinício, e o que precisa sobreviver a ele.

**Ele é incrementado no `init`, não no `terminate/2`.** Com `:kill`, o
`terminate/2` **não é chamado** — nem `try`, nem `rescue` pegam esse sinal.
Contar no nascimento é a única forma que funciona: todo `init` depois do
primeiro é, por definição, um renascimento. Tentar contar na morte produziria
um contador que fica em zero para sempre, e um contador errado é pior do que
contador nenhum.

**A presença é relida a cada segundo, em vez de avisada na saída.** O
`Registry` com `keys: :duplicate` desregistra sozinho quando o processo da
conexão morre, então basta perguntar de novo. A alternativa — avisar quando
alguém sai — dependeria de um `terminate` que nem sempre roda, que é
exatamente o erro que esta página existe para não cometer.

E existe uma janela de alguns milissegundos entre a morte e a recriação. Uma
chamada que caísse nela derrubaria a LiveView junto — irônico numa página sobre
supervisão. Daí o `seguro/1`, que captura o `:exit` e devolve `nil`.

## Rodando

```bash
docker build -t sala .
docker run -p 4000:4000 -e SECRET_KEY_BASE="$(openssl rand -base64 48)" -e PHX_HOST=localhost sala
```

Abra <http://localhost:4000> em duas abas.

## Hospedagem

Esta é uma das poucas demos do laboratório que **não** roda no navegador do
visitante: um quadro compartilhado precisa, por definição, de um servidor
compartilhado. Ela vai para o [Render](https://render.com) pelo `render.yaml`
na raiz do repositório — plano gratuito, sem cartão de crédito.

O serviço dorme depois de 15 minutos sem visita e leva cerca de um minuto para
acordar. Isso não é um defeito escondido: está dito na página, porque um
visitante que espera sem explicação conclui que o sistema quebrou.

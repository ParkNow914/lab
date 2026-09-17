# Build em dois estagios: o primeiro tem Elixir, Erlang e o compilador; o
# segundo tem so a maquina virtual. O que vai para producao e o release — um
# diretorio com o codigo ja compilado e o ERTS embutido — e nao o codigo-fonte.
#
# Importa porque o plano gratis do Render da 512 MB de RAM: quanto menor a
# imagem, mais rapido o servico acorda depois de dormir.

# ------------------------------------------------------------------ builder
FROM elixir:1.17-alpine AS builder

# build-base porque algumas dependencias compilam NIFs em C.
RUN apk add --no-cache build-base git

WORKDIR /app

RUN mix local.hex --force && mix local.rebar --force

ENV MIX_ENV=prod

# As dependencias vem antes do codigo de proposito: elas mudam pouco, e assim
# o Docker reaproveita esta camada em toda build em que so o codigo mudou.
COPY mix.exs mix.lock ./
RUN mix deps.get --only prod
RUN mix deps.compile

COPY config config
COPY priv priv
COPY assets assets
COPY lib lib

# esbuild baixa o binario na primeira execucao; --if-missing evita refazer isso
# quando a camada vem do cache.
RUN mix assets.setup
RUN mix assets.deploy

RUN mix compile
RUN mix release

# ------------------------------------------------------------------ runtime
FROM alpine:3.22 AS app

# libstdc++ e ncurses-libs sao exigidos pela maquina virtual do Erlang;
# openssl, pelo :crypto. Sem eles o release sobe e morre sem mensagem util.
RUN apk add --no-cache libstdc++ openssl ncurses-libs ca-certificates

# Rodar como root dentro de um container exposto a internet nao tem por que.
RUN adduser -D -h /app sala
WORKDIR /app
USER sala

COPY --from=builder --chown=sala:sala /app/_build/prod/rel/sala ./

# PHX_SERVER liga o servidor HTTP: num release, o Phoenix nao sobe sozinho.
# Esquecer isto produz um container que inicia, nao loga erro nenhum e nao
# responde a nada.
ENV PHX_SERVER=true

EXPOSE 4000

CMD ["/app/bin/sala", "start"]

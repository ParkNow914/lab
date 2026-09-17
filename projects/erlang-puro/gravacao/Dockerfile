# Imagem so para gravar a sessao. Ela nao e publicada: o que sai daqui e o
# arquivo .cast que vai para o site.
#
# O contexto de build e a RAIZ do projeto, nao esta pasta:
#
#   docker build -f gravacao/Dockerfile -t lab-cast-erlang .
#
# Assim a gravacao usa exatamente os mesmos .erl que a pagina exibe. Com uma
# copia dentro de gravacao/ os dois arquivos divergiriam em silencio, e a
# pagina passaria a explicar um codigo que nao foi o que rodou.
FROM elixir:1.17-alpine

# erl ja vem na imagem; expect e para digitar dentro do shell interativo de
# verdade, e asciinema e o gravador.
RUN apk add --no-cache asciinema expect ncurses

WORKDIR /app
COPY contador_v1.erl contador_v2.erl ./
COPY gravacao/sessao.exp gravacao/roteiro.sh ./
RUN chmod +x roteiro.sh sessao.exp && cp contador_v1.erl contador.erl

ENV TERM=xterm-256color

CMD ["/app/roteiro.sh"]

# Imagem so para gravar a sessao. Ela nao e publicada: o que vai para o site e
# o arquivo .cast que sai daqui.
FROM elixir:1.17-alpine

# erl vem na imagem; expect e para digitar dentro do shell interativo de
# verdade, e asciinema e o gravador.
RUN apk add --no-cache asciinema expect ncurses

WORKDIR /app
COPY contador_v1.erl contador_v2.erl ./
COPY sessao.exp roteiro.sh ./
RUN chmod +x roteiro.sh sessao.exp && cp contador_v1.erl contador.erl

ENV TERM=xterm-256color

CMD ["/app/roteiro.sh"]

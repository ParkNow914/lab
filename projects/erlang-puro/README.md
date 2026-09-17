# Troca a quente de código em Erlang

Um processo está contando e tem 12 guardados. Sem reiniciar nada, o módulo é
recompilado com regras diferentes **e outro formato de estado** — e na mensagem
seguinte ele já está rodando o código novo, com os 12 intactos.

[Assistir à sessão](https://autarktech.com.br/lab/erlang-puro/) · 34 segundos.

## Por que é uma gravação, e não algo rodando no navegador

Todas as outras demos do laboratório rodam na máquina de quem visita. Esta não
pode: o assunto dela *é* a máquina virtual do Erlang — o carregador de código,
a tabela de módulos, a fresta entre duas versões de uma função. Não existe isso
compilado para WebAssembly.

Então é uma gravação de terminal em asciinema. Os comandos são digitados por um
script `expect` para a sessão caber em meio minuto; tudo que responde é a VM
rodando de verdade, com o carimbo de tempo de cada tecla. Os PIDs mudam a cada
gravação, que é o jeito mais simples de conferir isso.

## O detalhe que faz funcionar

O laço termina em `?MODULE:loop(...)`, com o nome do módulo na frente.

```erlang
loop(Total) ->
    receive
        {somar, N} -> ?MODULE:loop(Total + N);
        {ler, De}  -> De ! {valor, Total}, ?MODULE:loop(Total)
    end.
```

Um `loop(...)` seco seria uma chamada **local**: a VM saltaria para dentro da
mesma versão do código, e o processo continuaria rodando a versão com que
nasceu para sempre, por mais vezes que o módulo fosse recompilado. Escrever o
módulo na frente manda procurar a versão **atual** a cada volta. A troca a
quente inteira mora nessa fresta.

## O caso difícil é o estado, não a regra

Mudar regra é fácil. Mudar o formato do que já está na memória, não. Quando a
versão 2 entra, existe um processo lá fora segurando um inteiro, e o código
novo espera uma tupla:

```erlang
%% Sem esta clausula, a troca da function_clause e mata o processo —
%% a atualizacao teria feito exatamente o estrago que veio evitar.
loop(Total) when is_integer(Total) ->
    ?MODULE:loop({Total, 0});

loop({Total, Ops}) -> ...
```

É isso que `code_change/3` faz num `gen_server`. Aqui está escrito à mão, como
uma cláusula a mais, porque o ponto é deixar a migração visível em vez de
escondida atrás da abstração.

Na gravação dá para ver a ordem exata: a soma roda no código **velho** (o
processo estava parado num `receive` da versão 1) e a migração no **novo**, na
mesma volta do laço. Por isso a mensagem diz `migrou o estado: 15`, e não 12.

## Duas versões, não mais

A VM mantém no máximo o código *atual* e o *antigo* de cada módulo. Recarregar
uma terceira vez mata qualquer processo que ainda esteja executando a mais
velha. É um jeito real de derrubar processo com "atualizei rápido demais", e é
por isso que sistema sério faz isso com `release_handler`, não na mão.

## Regravando

```bash
cd gravacao
cp ../contador_v1.erl ../contador_v2.erl .
docker build -t lab-cast-erlang .
docker run --rm -t -v "$PWD/..:/saida" lab-cast-erlang
```

Duas coisas que custaram uma regravação cada, e que valem para qualquer
gravação nova:

- **`stty_init "-echo"`.** Sem isso cada comando aparece duas vezes — uma pelo
  eco do pty e outra pelo editor de linha do shell Erlang, que redesenha o que
  leu.
- **Nada de não-ASCII nos `.erl`.** A imagem não tem locale UTF-8, e um
  travessão num comentário vira lixo no meio da gravação quando o `os:cmd`
  devolve os bytes crus.

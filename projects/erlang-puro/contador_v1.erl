%% Versao 1 -- a que vai estar rodando quando a troca acontecer.
-module(contador).
-export([iniciar/0, somar/1, ler/0, loop/1]).

iniciar() ->
    Pid = spawn(fun() -> loop(0) end),
    register(contador, Pid),
    Pid.

somar(N) ->
    contador ! {somar, N},
    ok.

ler() ->
    contador ! {ler, self()},
    receive {valor, V} -> V
    after 1000 -> tempo_esgotado
    end.

%% A chamada QUALIFICADA (?MODULE:loop) e o detalhe inteiro deste projeto.
%%
%% Um `loop(...)` simples seria uma chamada local: o processo continuaria
%% executando a versao do codigo com que nasceu, para sempre, por mais vezes
%% que o modulo fosse recompilado. Escrever o nome do modulo na frente manda a
%% maquina virtual procurar a versao ATUAL a cada volta -- e e nessa fresta que
%% a troca a quente entra.
loop(Total) ->
    receive
        {somar, N} ->
            ?MODULE:loop(Total + N);
        {ler, De} ->
            De ! {valor, Total},
            ?MODULE:loop(Total)
    end.

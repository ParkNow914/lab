%% Versao 2 -- carregada com o processo da versao 1 ainda vivo e com estado.
%%
%% Mudam duas coisas: passa a recusar numero negativo, e passa a contar
%% quantas operacoes aceitou. A segunda muda o FORMATO do estado, que e o
%% caso dificil de verdade.
-module(contador).
-export([iniciar/0, somar/1, ler/0, loop/1]).

iniciar() ->
    Pid = spawn(fun() -> loop({0, 0}) end),
    register(contador, Pid),
    Pid.

somar(N) ->
    contador ! {somar, N},
    ok.

ler() ->
    contador ! {ler, self()},
    receive {valor, V, Ops} -> {V, Ops}
    after 1000 -> tempo_esgotado
    end.

%% Esta clausula e a migracao de estado, e ela existe porque o processo la
%% fora esta rodando AGORA com um inteiro na mao. Ele vai entrar aqui na
%% proxima mensagem que receber, e precisa ser recebido como estava -- nao
%% como o codigo novo gostaria que ele estivesse.
%%
%% Sem ela, a troca daria function_clause e o processo morreria: o estado
%% antigo nao casa com nenhuma clausula nova. Isto e o que `code_change/3` faz
%% num gen_server, escrito a mao para ficar visivel.
loop(Total) when is_integer(Total) ->
    io:format("    [migrou o estado: ~p vira {~p,0}]~n", [Total, Total]),
    ?MODULE:loop({Total, 0});

loop({Total, Ops}) ->
    receive
        {somar, N} when N < 0 ->
            io:format("    [recusou ~p: a versao 2 nao aceita negativo]~n", [N]),
            ?MODULE:loop({Total, Ops});
        {somar, N} ->
            ?MODULE:loop({Total + N, Ops + 1});
        {ler, De} ->
            De ! {valor, Total, Ops},
            ?MODULE:loop({Total, Ops})
    end.

defmodule Sala.Quadro do
  @moduledoc """
  O processo que guarda o estado do quadro compartilhado.

  É um GenServer comum, e é aí que está a graça: ele pode morrer. Mate-o pelo
  botão da página e o supervisor o recria em milissegundos, com o estado
  inicial de volta. Ninguém precisa reiniciar a aplicação, e os outros
  processos — inclusive as conexões de quem está olhando — não sentem nada.

  É isso que "deixe quebrar" significa na prática: em vez de blindar cada
  função contra todo erro possível, isola-se a falha num processo e confia-se
  no supervisor para restaurar um estado bom conhecido.
  """

  use GenServer

  @topico "quadro"
  @limite_notas 24

  defstruct notas: [], criado_em: nil, mortes: 0

  # --------------------------------------------------------------- interface

  def start_link(_opts) do
    GenServer.start_link(__MODULE__, :ok, name: __MODULE__)
  end

  def estado, do: GenServer.call(__MODULE__, :estado)

  def anotar(texto, autor), do: GenServer.call(__MODULE__, {:anotar, texto, autor})

  def limpar, do: GenServer.call(__MODULE__, :limpar)

  @doc """
  Mata o processo de propósito.

  `Process.exit(pid, :kill)` é o tiro que não dá para o processo tratar: nem
  `try`, nem `rescue`, nem `terminate/2`. É de propósito — um processo que
  conseguisse se defender disso não provaria nada sobre supervisão.
  """
  def matar do
    pid = Process.whereis(__MODULE__)
    if pid, do: Process.exit(pid, :kill)
    :ok
  end

  def topico, do: @topico

  # ------------------------------------------------------------------ server

  @impl true
  def init(:ok) do
    # O contador vive FORA do processo, num :persistent_term, porque tudo que
    # está dentro morre junto com ele. É a distinção entre estado que se perde
    # de propósito e estado que precisa sobreviver ao reinício.
    #
    # E ele é incrementado aqui, no init, e não num `terminate/2`: com
    # `Process.exit(pid, :kill)` o `terminate` NÃO é chamado. Contar no
    # nascimento é o único jeito que funciona — cada init depois do primeiro
    # é, por definição, um renascimento.
    reinicios = :persistent_term.get({__MODULE__, :reinicios}, -1) + 1
    :persistent_term.put({__MODULE__, :reinicios}, reinicios)

    estado = %__MODULE__{
      notas: notas_iniciais(),
      criado_em: System.system_time(:millisecond),
      mortes: reinicios
    }

    # Avisa quem estiver olhando que existe um processo novo no ar.
    Phoenix.PubSub.broadcast(Sala.PubSub, @topico, {:renasceu, resumo(estado)})

    {:ok, estado}
  end

  @impl true
  def handle_call(:estado, _de, estado), do: {:reply, resumo(estado), estado}

  def handle_call({:anotar, texto, autor}, _de, estado) do
    nota = %{
      texto: String.slice(texto, 0, 140),
      autor: autor,
      em: System.system_time(:millisecond)
    }

    notas = Enum.take([nota | estado.notas], @limite_notas)
    novo = %{estado | notas: notas}

    Phoenix.PubSub.broadcast(Sala.PubSub, @topico, {:quadro, resumo(novo)})
    {:reply, :ok, novo}
  end

  def handle_call(:limpar, _de, estado) do
    novo = %{estado | notas: []}
    Phoenix.PubSub.broadcast(Sala.PubSub, @topico, {:quadro, resumo(novo)})
    {:reply, :ok, novo}
  end

  # ------------------------------------------------------------------ apoio

  defp resumo(estado) do
    %{
      notas: estado.notas,
      pid: inspect(self()),
      criado_em: estado.criado_em,
      vivo_ha_ms: System.system_time(:millisecond) - estado.criado_em,
      mortes: estado.mortes
    }
  end

  defp notas_iniciais do
    [
      %{
        texto: "Este quadro é compartilhado: abra em outra aba e escreva.",
        autor: "sistema",
        em: System.system_time(:millisecond)
      }
    ]
  end
end

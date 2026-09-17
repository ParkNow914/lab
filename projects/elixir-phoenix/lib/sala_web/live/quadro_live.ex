defmodule SalaWeb.QuadroLive do
  @moduledoc """
  A sala colaborativa.

  Zero JavaScript escrito por mim. O que chega pelo websocket é HTML: o
  servidor calcula a diferença entre o que a página mostra e o que deveria
  mostrar, e manda só o pedaço que mudou.

  É a aposta do Phoenix contra a complexidade do front-end moderno — e um
  quadro compartilhado é a demonstração mais difícil de fingir, porque exige
  que a página de um visitante mude quando OUTRO visitante digita.
  """

  use SalaWeb, :live_view

  alias Sala.Quadro

  @presenca "presenca:quadro"

  @impl true
  def mount(_params, _sessao, socket) do
    if connected?(socket) do
      Phoenix.PubSub.subscribe(Sala.PubSub, Quadro.topico())
      Phoenix.PubSub.subscribe(Sala.PubSub, @presenca)
      :timer.send_interval(1000, self(), :tique)
    end

    apelido = apelido_aleatorio()

    socket =
      socket
      |> assign(apelido: apelido, texto: "", aviso: nil, agora: System.system_time(:millisecond))
      |> assign(quadro: seguro(fn -> Quadro.estado() end))
      |> assign(pessoas: entrar(apelido, connected?(socket)))

    {:ok, socket}
  end

  # ------------------------------------------------------------------ eventos

  @impl true
  def handle_event("anotar", %{"texto" => texto}, socket) do
    texto = String.trim(texto)

    if texto == "" do
      {:noreply, socket}
    else
      seguro(fn -> Quadro.anotar(texto, socket.assigns.apelido) end)
      {:noreply, assign(socket, texto: "")}
    end
  end

  def handle_event("digitando", %{"texto" => texto}, socket) do
    {:noreply, assign(socket, texto: texto)}
  end

  def handle_event("limpar", _params, socket) do
    seguro(fn -> Quadro.limpar() end)
    {:noreply, socket}
  end

  def handle_event("matar", _params, socket) do
    Quadro.matar()

    {:noreply,
     assign(socket,
       aviso: "Processo morto. O supervisor já deve ter criado outro — repare no PID."
     )}
  end

  # ------------------------------------------------------------------ mensagens

  @impl true
  def handle_info({:quadro, resumo}, socket), do: {:noreply, assign(socket, quadro: resumo)}

  def handle_info({:renasceu, resumo}, socket) do
    {:noreply,
     assign(socket,
       quadro: resumo,
       aviso: "Processo novo no ar. As notas voltaram ao estado inicial; a página não caiu."
     )}
  end

  def handle_info(:tique, socket) do
    # Releitura periódica: mantém "vivo há" andando e reaproveita o caminho que
    # falha caso o processo esteja morto naquele instante.
    #
    # A lista de presença também é relida aqui, e isso resolve a saída de
    # alguém sem nenhum código de limpeza: o Registry desregistra sozinho
    # quando o processo da conexão morre, então basta perguntar de novo. A
    # alternativa — avisar na saída — depende de um `terminate` que nem sempre
    # roda, que é exatamente o erro que esta página existe para não cometer.
    {:noreply,
     socket
     |> assign(agora: System.system_time(:millisecond))
     |> assign(quadro: seguro(fn -> Quadro.estado() end) || socket.assigns.quadro)
     |> assign(pessoas: if(connected?(socket), do: listar_presenca(), else: []))}
  end

  def handle_info({:presenca, pessoas}, socket), do: {:noreply, assign(socket, pessoas: pessoas)}

  # ------------------------------------------------------------------ apoio

  # Entre a morte do processo e a recriação pelo supervisor existe uma janela
  # de alguns milissegundos. Uma chamada que caia exatamente nela derrubaria a
  # LiveView junto — o que seria irônico numa página sobre tolerância a falha.
  defp seguro(fun) do
    fun.()
  catch
    :exit, _ -> nil
  end

  defp entrar(apelido, true) do
    Registry.register(Sala.Presenca, :quadro, apelido)
    avisar_presenca()
    listar_presenca()
  end

  defp entrar(_apelido, false), do: []

  defp avisar_presenca do
    # De propósito depois do registro, e para todo mundo: quem entra precisa
    # aparecer na tela de quem já estava.
    Task.start(fn ->
      Process.sleep(50)
      Phoenix.PubSub.broadcast(Sala.PubSub, @presenca, {:presenca, listar_presenca()})
    end)
  end

  defp listar_presenca do
    Sala.Presenca
    |> Registry.lookup(:quadro)
    |> Enum.map(fn {_pid, apelido} -> apelido end)
    |> Enum.uniq()
    |> Enum.sort()
  end

  defp apelido_aleatorio do
    cores = ~w(verde azul âmbar coral roxo turquesa)
    bichos = ~w(tucano jaguar arara lobo bugio quati onça)
    "#{Enum.random(cores)}-#{Enum.random(bichos)}"
  end

  defp quando(em, agora) do
    seg = div(agora - em, 1000)

    cond do
      seg < 5 -> "agora"
      seg < 60 -> "há #{seg}s"
      true -> "há #{div(seg, 60)}min"
    end
  end

  # ------------------------------------------------------------------ render

  @impl true
  def render(assigns) do
    ~H"""
    <div class="topo">
      <div class="container topo-in">
        <a class="voltar" href="https://autarktech.com.br/lab/">← Laboratório</a>
        <span class="topo-sp"></span>
        <span class="topo-lang">Elixir · Phoenix LiveView</span>
        <a class="topo-fonte" href="https://github.com/ParkNow914/lab/tree/main/projects/elixir-phoenix">Código ↗</a>
      </div>
    </div>

    <div class="container cab">
      <h1>Escreva aqui. Abra em outra aba. Mate o processo.</h1>
      <p class="pitch">
        Este quadro é compartilhado por todo mundo que estiver na página agora, e não há
        <strong>uma linha de JavaScript</strong> escrita por mim: o que viaja pelo
        websocket é HTML pronto. E o botão vermelho mata de verdade o processo que guarda
        o estado — para você ver o supervisor recriá-lo sem a página cair.
      </p>

      <div class="meta">
        <span>Elixir</span>
        <span>Phoenix LiveView</span>
        <span>OTP / supervisor</span>
        <span>sem JavaScript de aplicação</span>
        <span>container no Render</span>
      </div>

      <div class="porque">
        <b>Por que este projeto</b>
        "Deixe quebrar" só convence quando você vê quebrar e voltar. OTP é o modelo de
        confiabilidade mais maduro que existe e quase ninguém demonstra na prática — a
        maioria explica em texto. Aqui o processo morre de verdade, o supervisor o recria
        em milissegundos, e a sua conexão nem percebe.
      </div>
    </div>

    <main class="palco">
      <div class="container">
        <div class="duas">
          <section class="painel">
            <h2>O quadro <span class="hint">compartilhado ao vivo</span></h2>

            <form phx-submit="anotar" phx-change="digitando" style="display:flex;gap:10px;flex-wrap:wrap">
              <input
                type="text"
                name="texto"
                value={@texto}
                placeholder="escreva algo e aperte enter"
                autocomplete="off"
                maxlength="140"
                style="flex:1 1 240px"
              />
              <button class="pri" type="submit">Anotar</button>
            </form>

            <div :if={@aviso} class="aviso-linha"><%= @aviso %></div>

            <ul class="notas">
              <li :for={nota <- (@quadro[:notas] || [])}>
                <span class="n-autor"><%= nota.autor %></span>
                <span class="n-texto"><%= nota.texto %></span>
                <span class="n-quando"><%= quando(nota.em, @agora) %></span>
              </li>
            </ul>

            <div class="linha" style="margin-top:14px">
              <button phx-click="limpar" type="button">Limpar quadro</button>
            </div>

            <p class="dica" style="margin-top:16px">
              Quem está aqui agora:
              <b :for={p <- @pessoas}><%= p %> </b>
              <span :if={@pessoas == []}>(só você)</span>
            </p>
          </section>

          <section class="painel">
            <h2>O processo por trás <span class="hint">e o botão que o mata</span></h2>

            <div class="proc">
              <div class="proc-linha">
                <span>PID</span><b><%= @quadro[:pid] || "—" %></b>
              </div>
              <div class="proc-linha">
                <span>vivo há</span>
                <b><%= div((@quadro[:vivo_ha_ms] || 0), 1000) %>s</b>
              </div>
              <div class="proc-linha">
                <span>vezes que já morreu</span>
                <b class={if (@quadro[:mortes] || 0) > 0, do: "alerta"}><%= @quadro[:mortes] || 0 %></b>
              </div>
            </div>

            <div class="linha" style="margin-top:16px">
              <button phx-click="matar" type="button" class="matar">Matar o processo</button>
            </div>

            <p class="dica" style="margin-top:16px">
              <b>O que observar.</b> O <b>PID muda</b> — é outro processo, criado do zero pelo
              supervisor. As notas voltam ao estado inicial, porque estavam dentro dele. E a
              sua conexão, a lista de quem está online e a página inteira <b>continuam de
              pé</b>: elas são outros processos, e a falha não vaza de um para o outro.
            </p>
            <p class="dica">
              O contador de mortes sobrevive porque vive <em>fora</em> do processo. Essa é a
              decisão de projeto que o OTP obriga a tomar: o que pode se perder num reinício,
              e o que precisa sobreviver a ele.
            </p>
            <p class="dica">
              <code>Process.exit(pid, :kill)</code> é o tiro que o processo não consegue
              tratar — nem <code>try</code>, nem <code>rescue</code>, nem
              <code>terminate/2</code>. De propósito: um processo que se defendesse disso
              não provaria nada sobre supervisão.
            </p>
          </section>
        </div>
      </div>
    </main>

    <div class="rodape">
      <div class="container rodape-in">
        <span>Alisson Santos · Autark</span>
        <a href="https://autarktech.com.br/lab/">Laboratório</a>
        <a href="https://autarktech.com.br/">Portfólio</a>
        <a href="https://github.com/ParkNow914/lab/tree/main/projects/elixir-phoenix">Ver o código</a>
      </div>
    </div>
    """
  end
end

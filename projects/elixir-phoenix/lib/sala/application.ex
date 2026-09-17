defmodule Sala.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      SalaWeb.Telemetry,
      {DNSCluster, query: Application.get_env(:sala, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: Sala.PubSub},

      # Registro de quem esta com a pagina aberta. :duplicate_keys porque
      # varias conexoes compartilham a mesma chave (:quadro), e cada uma
      # some sozinha quando o processo dela morre — sem limpeza manual.
      {Registry, keys: :duplicate, name: Sala.Presenca},

      # O processo que guarda o quadro. A estrategia :one_for_one significa
      # que, se ele morrer, SO ele e recriado: o endpoint, o PubSub e as
      # conexoes abertas nao sao tocados. E o ponto inteiro da demonstracao.
      Sala.Quadro,
      # Start to serve requests, typically the last entry
      SalaWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Sala.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    SalaWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end

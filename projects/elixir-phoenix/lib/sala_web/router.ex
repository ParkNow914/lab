defmodule SalaWeb.Router do
  use SalaWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {SalaWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", SalaWeb do
    pipe_through :browser

    live "/", QuadroLive, :index
  end

  # Other scopes may use custom stacks.
  # scope "/api", SalaWeb do
  #   pipe_through :api
  # end
end

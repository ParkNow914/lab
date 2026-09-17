// O único JavaScript desta demo, e nenhuma linha dele é minha.
//
// É o cliente do Phoenix: ele abre o websocket, recebe as diferenças de HTML
// que o servidor calcula e as aplica no DOM. Toda a lógica da sala — quem está
// online, o que o quadro mostra, o que acontece quando o processo morre — vive
// no servidor, em Elixir.
import "phoenix_html"
import { Socket } from "phoenix"
import { LiveSocket } from "phoenix_live_view"

const csrfToken = document
  .querySelector("meta[name='csrf-token']")
  .getAttribute("content")

const liveSocket = new LiveSocket("/live", Socket, {
  longPollFallbackMs: 2500,
  params: { _csrf_token: csrfToken }
})

liveSocket.connect()
window.liveSocket = liveSocket

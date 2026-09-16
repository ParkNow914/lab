// Simulador visual de concorrencia em Go.
//
// Nao e uma animacao imitando goroutines: sao goroutines de verdade, channels
// de verdade e um WaitGroup de verdade, rodando no WebAssembly do navegador. O
// estado que a pagina desenha e lido do mesmo mundo que os workers alteram —
// por isso o mutex existe, e por isso o contador de disputa e honesto.
//
// Compilado com GOOS=js GOARCH=wasm.
package main

import (
	"fmt"
	"math/rand"
	"sync"
	"sync/atomic"
	"syscall/js"
	"time"
)

type estadoWorker int

const (
	ocioso estadoWorker = iota
	trabalhando
	bloqueado
)

type worker struct {
	id        int
	estado    estadoWorker
	tarefa    int
	progresso float64
	feitas    int
}

type mundo struct {
	mu sync.Mutex

	workers []*worker
	fila    chan int   // o canal E a fila: sem lista, sem semaforo, sem lock proprio
	feitas  int64      // atomic: lido pela UI enquanto os workers escrevem
	criadas int64
	perdidas int64     // tarefas descartadas porque a fila estava cheia

	cancelar chan struct{}
	wg       sync.WaitGroup
	rodando  bool

	// Quanto tempo, no total, os produtores ficaram parados esperando espaco.
	// E a medida de backpressure: a fila cheia empurra o custo para quem produz.
	esperaProdutor int64
}

var m = &mundo{}

// iniciar(nWorkers, tamanhoFila, ritmoProducao, duracaoTarefaMs)
func (w *mundo) iniciar(nWorkers, tamFila, ritmo, duracao int) {
	w.parar()

	w.mu.Lock()
	w.workers = make([]*worker, nWorkers)
	for i := range w.workers {
		w.workers[i] = &worker{id: i, estado: ocioso}
	}
	w.mu.Unlock()

	// Canal com buffer: tamFila == 0 vira canal sincrono, em que o produtor so
	// entrega quando ha um worker pronto para receber na mesma hora.
	w.fila = make(chan int, tamFila)
	w.cancelar = make(chan struct{})
	atomic.StoreInt64(&w.feitas, 0)
	atomic.StoreInt64(&w.criadas, 0)
	atomic.StoreInt64(&w.perdidas, 0)
	atomic.StoreInt64(&w.esperaProdutor, 0)
	w.rodando = true

	// --- Consumidores -----------------------------------------------------
	for i := 0; i < nWorkers; i++ {
		w.wg.Add(1)
		go func(idx int) {
			defer w.wg.Done()
			wk := w.workers[idx]

			for {
				// Enquanto espera no canal, a goroutine nao consome CPU: o
				// escalonador simplesmente nao a agenda. Isso e o que separa
				// isto de um laco que fica perguntando "ja tem tarefa?".
				w.setEstado(wk, ocioso, 0, 0)

				select {
				case <-w.cancelar:
					return
				case tarefa, ok := <-w.fila:
					if !ok {
						return
					}
					w.setEstado(wk, trabalhando, tarefa, 0)

					// Trabalho fingido, mas o tempo e real e o sono devolve a
					// thread ao escalonador, como faria uma chamada de rede.
					passos := 10
					for p := 0; p < passos; p++ {
						select {
						case <-w.cancelar:
							return
						case <-time.After(time.Duration(duracao/passos) * time.Millisecond):
						}
						w.setProgresso(wk, float64(p+1)/float64(passos))
					}

					atomic.AddInt64(&w.feitas, 1)
					w.mu.Lock()
					wk.feitas++
					w.mu.Unlock()
				}
			}
		}(i)
	}

	// --- Produtor ---------------------------------------------------------
	w.wg.Add(1)
	go func() {
		defer w.wg.Done()
		tick := time.NewTicker(time.Duration(ritmo) * time.Millisecond)
		defer tick.Stop()

		for {
			select {
			case <-w.cancelar:
				return
			case <-tick.C:
				id := int(atomic.AddInt64(&w.criadas, 1))

				// O default transforma o envio em nao-bloqueante. Sem ele, o
				// produtor pararia aqui ate abrir espaco — que e exatamente o
				// backpressure. Com ele, a tarefa e descartada. As duas coisas
				// sao decisoes de produto, nao detalhes tecnicos.
				inicio := time.Now()
				select {
				case w.fila <- id:
					atomic.AddInt64(&w.esperaProdutor, time.Since(inicio).Microseconds())
				default:
					atomic.AddInt64(&w.perdidas, 1)
				}
			}
		}
	}()
}

func (w *mundo) setEstado(wk *worker, e estadoWorker, tarefa int, prog float64) {
	w.mu.Lock()
	wk.estado = e
	wk.tarefa = tarefa
	wk.progresso = prog
	w.mu.Unlock()
}

func (w *mundo) setProgresso(wk *worker, prog float64) {
	w.mu.Lock()
	wk.progresso = prog
	w.mu.Unlock()
}

func (w *mundo) parar() {
	if !w.rodando {
		return
	}
	close(w.cancelar)
	w.wg.Wait()
	w.rodando = false
}

// snapshot devolve o estado para a pagina desenhar, como JSON.
func (w *mundo) snapshot() string {
	w.mu.Lock()
	defer w.mu.Unlock()

	s := "{"
	s += fmt.Sprintf(`"feitas":%d,`, atomic.LoadInt64(&w.feitas))
	s += fmt.Sprintf(`"criadas":%d,`, atomic.LoadInt64(&w.criadas))
	s += fmt.Sprintf(`"perdidas":%d,`, atomic.LoadInt64(&w.perdidas))
	s += fmt.Sprintf(`"naFila":%d,`, len(w.fila))
	s += fmt.Sprintf(`"capFila":%d,`, cap(w.fila))
	s += fmt.Sprintf(`"esperaProdutorMs":%.1f,`, float64(atomic.LoadInt64(&w.esperaProdutor))/1000.0)
	s += `"workers":[`
	for i, wk := range w.workers {
		if i > 0 {
			s += ","
		}
		s += fmt.Sprintf(`{"id":%d,"estado":%d,"tarefa":%d,"progresso":%.3f,"feitas":%d}`,
			wk.id, int(wk.estado), wk.tarefa, wk.progresso, wk.feitas)
	}
	s += "]}"
	return s
}

func main() {
	rand.Seed(1)

	js.Global().Set("goIniciar", js.FuncOf(func(this js.Value, args []js.Value) any {
		m.iniciar(args[0].Int(), args[1].Int(), args[2].Int(), args[3].Int())
		return nil
	}))

	js.Global().Set("goParar", js.FuncOf(func(this js.Value, args []js.Value) any {
		m.parar()
		return nil
	}))

	js.Global().Set("goSnapshot", js.FuncOf(func(this js.Value, args []js.Value) any {
		return m.snapshot()
	}))

	js.Global().Set("goPronto", js.ValueOf(true))

	// main nao pode retornar: o runtime do Go em WASM encerra junto, e as
	// funcoes exportadas deixariam de existir.
	select {}
}

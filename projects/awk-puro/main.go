// Ponte para rodar AWK no navegador.
//
// O interpretador e o GoAWK, que implementa o AWK do POSIX por inteiro. Este
// arquivo so faz a fronteira: recebe programa e entrada do JavaScript, executa
// num ambiente fechado e devolve saida, erro e quanto demorou.
//
// Este binario roda dentro de um Web Worker, e nao na pagina. A razao e
// concreta: o GoAWK nao aceita contexto de cancelamento, entao um
// `BEGIN { while (1) {} }` digitado pelo visitante nao tem como ser
// interrompido de dentro. No worker, a pagina simplesmente mata a thread.
//
// Compilado com GOOS=js GOARCH=wasm.
package main

import (
	"bytes"
	"fmt"
	"strings"
	"syscall/js"
	"time"

	"github.com/benhoyt/goawk/interp"
	"github.com/benhoyt/goawk/parser"
)

// rodar(programa, entrada, separador) -> { saida, erro, ms, linhas }
func rodar(this js.Value, args []js.Value) any {
	if len(args) < 2 {
		return resposta("", "faltou programa ou entrada", 0, 0)
	}

	fonte := args[0].String()
	entrada := args[1].String()

	separador := " "
	if len(args) > 2 && args[2].Type() == js.TypeString && args[2].String() != "" {
		separador = args[2].String()
	}

	prog, err := parser.ParseProgram([]byte(fonte), nil)
	if err != nil {
		// O erro do GoAWK ja vem com linha e coluna; repassar cru e mais util
		// do que reescrever.
		return resposta("", "erro de sintaxe — "+err.Error(), 0, 0)
	}

	var saida, erro bytes.Buffer

	config := &interp.Config{
		Stdin:  strings.NewReader(entrada),
		Output: &saida,
		Error:  &erro,
		Args:   []string{},
		Vars:   []string{"FS", separador},

		// Fecha as portas que um script hostil usaria: system(), pipe,
		// redirecionamento para arquivo e getline de arquivo.
		NoExec:       true,
		NoFileWrites: true,
		NoFileReads:  true,
		Environ:      []string{},
	}

	inicio := time.Now()
	_, execErr := interp.ExecProgram(prog, config)
	ms := float64(time.Since(inicio).Microseconds()) / 1000.0

	msgErro := strings.TrimSpace(erro.String())
	if execErr != nil {
		msgErro = strings.TrimSpace(msgErro + "\n" + execErr.Error())
	}

	texto := saida.String()
	linhas := 0
	if texto != "" {
		linhas = strings.Count(strings.TrimRight(texto, "\n"), "\n") + 1
	}

	return resposta(texto, msgErro, ms, linhas)
}

func resposta(saida, erro string, ms float64, linhas int) any {
	return map[string]any{
		"saida":  saida,
		"erro":   erro,
		"ms":     fmt.Sprintf("%.2f", ms),
		"linhas": linhas,
	}
}

func main() {
	js.Global().Set("awkRodar", js.FuncOf(rodar))
	js.Global().Set("awkPronto", js.ValueOf(true))

	// main nao pode retornar: o runtime do Go encerra junto e a funcao
	// exportada deixaria de existir.
	select {}
}

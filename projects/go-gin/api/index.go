// API de catálogo com Gin, rodando como função serverless na Vercel.
//
// O que esta demo mostra não é o CRUD: é a cadeia de middleware e a validação
// devolvendo erro que serve para alguma coisa.
//
// Erro de validação genérico ("dados inválidos") é uma das piores coisas que
// uma API faz com quem a consome: obriga a adivinhar. Aqui cada campo errado
// volta com o nome, a regra violada e uma frase em português.
package handler

import (
	_ "embed"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// O HTML fica embutido, e em api/web/, por dois motivos.
//
// Primeiro: a Vercel trata TODO arquivo .go dentro de api/ como uma funcao
// serverless propria e exige um Handler exportado em cada um — entao a
// declaracao do embed nao pode morar num segundo arquivo. E ela recusa dois
// arquivos com o mesmo nome base no mesmo diretorio, porque disputariam a
// mesma rota.
//
// Segundo: a pagina usa template literal do JavaScript, delimitado por crase,
// e crase tambem delimita raw string em Go. As duas coisas colidiriam numa
// constante aqui dentro.
//
//go:embed web/pagina.html
var pagina string

// ------------------------------------------------------------------ modelo

type Produto struct {
	ID        int     `json:"id"`
	Nome      string  `json:"nome"      binding:"required,min=3,max=80"`
	SKU       string  `json:"sku"       binding:"required,alphanum,len=8"`
	Preco     float64 `json:"preco"     binding:"required,gt=0,lte=1000000"`
	Estoque   int     `json:"estoque"   binding:"gte=0"`
	Categoria string  `json:"categoria" binding:"required,oneof=servico produto assinatura"`
	Email     string  `json:"email_responsavel" binding:"required,email"`
}

// Banco em memória. Função serverless não tem estado entre invocações frias,
// e isso é dito na página: aqui não há banco de propósito, porque o assunto
// é a camada HTTP.
var (
	mu       sync.RWMutex
	catalogo = []Produto{
		{ID: 1, Nome: "Corte + barba", SKU: "SRV00012", Preco: 90, Estoque: 0, Categoria: "servico", Email: "contato@autarktech.com.br"},
		{ID: 2, Nome: "Pacote mensal de manutenção", SKU: "ASS00031", Preco: 1200, Estoque: 0, Categoria: "assinatura", Email: "contato@autarktech.com.br"},
		{ID: 3, Nome: "Placa de identificação de vaga", SKU: "PRD00104", Preco: 47.5, Estoque: 230, Categoria: "produto", Email: "contato@autarktech.com.br"},
	}
	proximoID = 4
)

// ------------------------------------------------------------- mensagens

// traduzir transforma o erro cru do validator em algo que quem consome a API
// consegue agir. É a diferença entre "Key: 'Produto.SKU' Error:Field validation
// for 'SKU' failed on the 'len' tag" e "sku: precisa ter exatamente 8
// caracteres".
func traduzir(e validator.FieldError) string {
	campo := strings.ToLower(e.Field())

	switch e.Tag() {
	case "required":
		return campo + ": é obrigatório"
	case "min":
		return fmt.Sprintf("%s: precisa de pelo menos %s caracteres", campo, e.Param())
	case "max":
		return fmt.Sprintf("%s: passou de %s caracteres", campo, e.Param())
	case "len":
		return fmt.Sprintf("%s: precisa ter exatamente %s caracteres", campo, e.Param())
	case "gt":
		return fmt.Sprintf("%s: precisa ser maior que %s", campo, e.Param())
	case "gte":
		return fmt.Sprintf("%s: não pode ser menor que %s", campo, e.Param())
	case "lte":
		return fmt.Sprintf("%s: não pode passar de %s", campo, e.Param())
	case "email":
		return campo + ": não é um e-mail válido"
	case "alphanum":
		return campo + ": só aceita letras e números"
	case "oneof":
		return fmt.Sprintf("%s: precisa ser um destes — %s", campo, strings.ReplaceAll(e.Param(), " ", ", "))
	default:
		return fmt.Sprintf("%s: não passou na regra '%s'", campo, e.Tag())
	}
}

// ------------------------------------------------------------- middleware

type etapa struct {
	Nome string `json:"nome"`
	Us   int64  `json:"us"`
	Nota string `json:"nota"`
}

const chaveTrace = "trace"

func registrar(c *gin.Context, nome, nota string, inicio time.Time) {
	v, _ := c.Get(chaveTrace)
	lista, _ := v.(*[]etapa)
	if lista == nil {
		return
	}
	*lista = append(*lista, etapa{Nome: nome, Us: time.Since(inicio).Microseconds(), Nota: nota})
}

// trace monta a lista de etapas que a resposta devolve. É o que permite a
// página mostrar a cadeia de middleware executando, em vez de afirmar que ela
// existe.
func trace() gin.HandlerFunc {
	return func(c *gin.Context) {
		lista := make([]etapa, 0, 6)
		c.Set(chaveTrace, &lista)

		inicio := time.Now()
		c.Next()

		total := time.Since(inicio)
		c.Header("X-Tempo-Total-Us", fmt.Sprint(total.Microseconds()))
	}
}

func identificar() gin.HandlerFunc {
	return func(c *gin.Context) {
		t := time.Now()
		id := fmt.Sprintf("req_%d", time.Now().UnixNano()%1_000_000_000)
		c.Set("requisicao_id", id)
		c.Header("X-Requisicao-Id", id)
		registrar(c, "identificar", "gera o id que aparece em todo log desta requisição", t)
		c.Next()
	}
}

func recuperar() gin.HandlerFunc {
	return func(c *gin.Context) {
		t := time.Now()
		defer func() {
			// Sem isto, um panic derrubaria a função inteira e o cliente
			// receberia uma resposta vazia, sem pista nenhuma.
			if r := recover(); r != nil {
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
					"erro":  "algo quebrou no servidor",
					"panic": fmt.Sprint(r),
				})
			}
		}()
		registrar(c, "recuperar", "protege contra panic virar resposta vazia", t)
		c.Next()
	}
}

func limitar() gin.HandlerFunc {
	return func(c *gin.Context) {
		t := time.Now()
		// Limite simbólico: numa função serverless o estado não sobrevive entre
		// instâncias, então rate limit de verdade mora no Redis ou na borda.
		// Deixar aqui uma versão que "funciona" em memória seria mentira.
		registrar(c, "limitar", "na vida real vive no Redis ou na borda, não na memória do processo", t)
		c.Next()
	}
}

// ------------------------------------------------------------------ rotas

var (
	uma sync.Once
	app *gin.Engine
)

func motor() *gin.Engine {
	uma.Do(func() {
		gin.SetMode(gin.ReleaseMode)
		r := gin.New()

		// A ordem importa: trace precisa começar antes de tudo, e recuperar
		// precisa estar fora do handler para capturar o panic dele.
		r.Use(trace(), recuperar(), identificar(), limitar())

		r.GET("/api/saude", func(c *gin.Context) {
			v, _ := c.Get(chaveTrace)
			lista, _ := v.(*[]etapa)
			c.JSON(http.StatusOK, gin.H{
				"ok":      true,
				"go":      "gin",
				"produtos": len(catalogo),
				"trace":   lista,
			})
		})

		r.GET("/api/produtos", func(c *gin.Context) {
			t := time.Now()
			mu.RLock()
			copia := append([]Produto(nil), catalogo...)
			mu.RUnlock()
			registrar(c, "handler", "lê o catálogo sob RWMutex", t)

			v, _ := c.Get(chaveTrace)
			lista, _ := v.(*[]etapa)
			c.JSON(http.StatusOK, gin.H{"produtos": copia, "trace": lista})
		})

		r.POST("/api/produtos", func(c *gin.Context) {
			t := time.Now()
			var p Produto

			if err := c.ShouldBindJSON(&p); err != nil {
				var problemas []string

				// O validator devolve um erro por campo; transformar cada um
				// numa frase é o que torna a resposta acionável.
				var ve validator.ValidationErrors
				if ok := asValidation(err, &ve); ok {
					for _, fe := range ve {
						problemas = append(problemas, traduzir(fe))
					}
				} else {
					problemas = append(problemas, "corpo não é um JSON válido: "+err.Error())
				}

				registrar(c, "validar", fmt.Sprintf("recusou com %d problema(s)", len(problemas)), t)
				v, _ := c.Get(chaveTrace)
				lista, _ := v.(*[]etapa)

				c.JSON(http.StatusUnprocessableEntity, gin.H{
					"erro":      "não dá para cadastrar assim",
					"problemas": problemas,
					"trace":     lista,
				})
				return
			}

			registrar(c, "validar", "todos os campos passaram", t)

			t2 := time.Now()
			mu.Lock()
			p.ID = proximoID
			proximoID++
			catalogo = append(catalogo, p)
			mu.Unlock()
			registrar(c, "handler", "gravou sob Mutex", t2)

			v, _ := c.Get(chaveTrace)
			lista, _ := v.(*[]etapa)
			c.JSON(http.StatusCreated, gin.H{"produto": p, "trace": lista})
		})

		// Rota que estoura de propósito, para o middleware de recuperação ter
		// o que mostrar.
		r.GET("/api/explodir", func(c *gin.Context) {
			panic("isto é um panic proposital")
		})

		r.GET("/", func(c *gin.Context) {
			c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(pagina))
		})

		r.NoRoute(func(c *gin.Context) {
			c.JSON(http.StatusNotFound, gin.H{
				"erro":            "rota não existe",
				"caminho_recebido": c.Request.URL.Path,
				"rotas":           []string{"GET /", "GET /api/saude", "GET /api/produtos", "POST /api/produtos", "GET /api/explodir"},
			})
		})

		app = r
	})
	return app
}

// asValidation evita depender de errors.As com genéricos no ponto de uso.
func asValidation(err error, alvo *validator.ValidationErrors) bool {
	if ve, ok := err.(validator.ValidationErrors); ok {
		*alvo = ve
		return true
	}
	return false
}

// Handler é o ponto de entrada da função serverless da Vercel.
func Handler(w http.ResponseWriter, r *http.Request) {
	motor().ServeHTTP(w, r)
}

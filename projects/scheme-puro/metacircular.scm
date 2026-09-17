; Avaliador metacircular: um Scheme escrito em Scheme.
;
; O exercicio classico do SICP, e o momento em que se entende o que uma
; linguagem realmente e. Nao ha parser aqui — o proprio Scheme ja entrega o
; programa como LISTA, porque codigo e dado (homoiconicidade). O trabalho todo
; e decidir o que cada forma significa.
;
; Repare no tamanho: uma linguagem com condicional, funcoes de primeira classe,
; fechamentos e recursao cabe nisto.

; ------------------------------------------------------------------ ambiente
;
; Uma lista de quadros. Cada quadro e uma lista de pares (nome . valor).
; Procurar sobe da frente para tras — e isso, e so isso, que faz escopo
; aninhado funcionar.

(define (quadro-novo nomes valores)
  (if (null? nomes)
      '()
      (cons (cons (car nomes) (car valores))
            (quadro-novo (cdr nomes) (cdr valores)))))

(define (ambiente-estender nomes valores ambiente)
  (cons (quadro-novo nomes valores) ambiente))

(define (buscar nome ambiente)
  (if (null? ambiente)
      (error (string-append "variável livre: " (symbol->string nome)))
      (let ((achado (assq nome (car ambiente))))
        (if achado
            (cdr achado)
            (buscar nome (cdr ambiente))))))

(define (definir! nome valor ambiente)
  (set-car! ambiente (cons (cons nome valor) (car ambiente)))
  nome)

; ---------------------------------------------------------------- utilitario

(define (tagged? exp tag)
  (and (pair? exp) (eq? (car exp) tag)))

(define (avaliar-lista exps ambiente)
  (if (null? exps)
      '()
      (cons (avaliar (car exps) ambiente)
            (avaliar-lista (cdr exps) ambiente))))

(define (avaliar-sequencia exps ambiente)
  (cond ((null? exps) '())
        ((null? (cdr exps)) (avaliar (car exps) ambiente))
        (else (avaliar (car exps) ambiente)
              (avaliar-sequencia (cdr exps) ambiente))))

; ------------------------------------------------------------------- avaliar
;
; O coracao. Cada ramo do cond e uma regra da linguagem.

(define (avaliar exp ambiente)
  (cond
    ; Auto-avaliaveis: numero, texto e booleano valem eles mesmos.
    ((number? exp) exp)
    ((string? exp) exp)
    ((boolean? exp) exp)

    ; Simbolo: procura no ambiente.
    ((symbol? exp) (buscar exp ambiente))

    ; (quote x) devolve x sem avaliar. E o que separa codigo de dado.
    ((tagged? exp 'quote) (cadr exp))

    ; (if condicao entao senao)
    ((tagged? exp 'if)
     (if (nao-falso? (avaliar (cadr exp) ambiente))
         (avaliar (caddr exp) ambiente)
         (if (null? (cdddr exp))
             '()
             (avaliar (cadddr exp) ambiente))))

    ; (define nome valor)  ou  (define (nome . args) corpo...)
    ((tagged? exp 'define)
     (if (pair? (cadr exp))
         (definir! (car (cadr exp))
                   (list 'fechamento (cdr (cadr exp)) (cddr exp) ambiente)
                   ambiente)
         (definir! (cadr exp) (avaliar (caddr exp) ambiente) ambiente)))

    ; (lambda (args) corpo...) — NAO cria funcao nativa: cria uma LISTA que
    ; guarda parametros, corpo e o ambiente onde nasceu. Esse terceiro item e
    ; o fechamento; sem ele, funcao devolvida de dentro de outra esqueceria de
    ; onde veio.
    ((tagged? exp 'lambda)
     (list 'fechamento (cadr exp) (cddr exp) ambiente))

    ; (let ((n v) ...) corpo) e acucar para aplicar um lambda na hora.
    ((tagged? exp 'let)
     (avaliar (cons (list 'lambda (map car (cadr exp)) (caddr exp))
                    (map cadr (cadr exp)))
              ambiente))

    ((tagged? exp 'begin)
     (avaliar-sequencia (cdr exp) ambiente))

    ; (cond (teste corpo) ... (else corpo))
    ((tagged? exp 'cond)
     (avaliar-cond (cdr exp) ambiente))

    ; Qualquer outra coisa e aplicacao: avalia o operador, avalia os
    ; argumentos, aplica.
    ((pair? exp)
     (aplicar (avaliar (car exp) ambiente)
              (avaliar-lista (cdr exp) ambiente)))

    (else (error "não sei avaliar isto"))))

(define (nao-falso? v) (not (eq? v #f)))

(define (avaliar-cond clausulas ambiente)
  (cond ((null? clausulas) '())
        ((eq? (car (car clausulas)) 'else)
         (avaliar-sequencia (cdr (car clausulas)) ambiente))
        ((nao-falso? (avaliar (car (car clausulas)) ambiente))
         (avaliar-sequencia (cdr (car clausulas)) ambiente))
        (else (avaliar-cond (cdr clausulas) ambiente))))

; ------------------------------------------------------------------- aplicar

(define (aplicar procedimento argumentos)
  (cond
    ; Primitiva: uma funcao do Scheme hospedeiro, embrulhada.
    ((tagged? procedimento 'primitiva)
     (apply (cadr procedimento) argumentos))

    ; Fechamento: estende o ambiente ONDE A FUNCAO NASCEU — nao o de quem
    ; chamou. E essa uma linha que define escopo lexico.
    ((tagged? procedimento 'fechamento)
     (avaliar-sequencia
       (caddr procedimento)
       (ambiente-estender (cadr procedimento) argumentos (cadddr procedimento))))

    (else (error "não é uma função"))))

; ------------------------------------------------------------- ambiente base

(define (primitiva f) (list 'primitiva f))

(define (ambiente-inicial)
  (list
    (quadro-novo
      '(+ - * / = < > <= >= car cdr cons list null? pair? not
        length append reverse abs min max modulo remainder
        eq? equal? number? symbol? string? zero? display)
      (list (primitiva +) (primitiva -) (primitiva *) (primitiva /)
            (primitiva =) (primitiva <) (primitiva >) (primitiva <=) (primitiva >=)
            (primitiva car) (primitiva cdr) (primitiva cons) (primitiva list)
            (primitiva null?) (primitiva pair?) (primitiva not)
            (primitiva length) (primitiva append) (primitiva reverse)
            (primitiva abs) (primitiva min) (primitiva max)
            (primitiva modulo) (primitiva remainder)
            (primitiva eq?) (primitiva equal?) (primitiva number?)
            (primitiva symbol?) (primitiva string?) (primitiva zero?)
            (primitiva display)))))

; Ponto de entrada: recebe uma lista de expressoes e devolve o valor da ultima.
(define (rodar programa)
  (avaliar-sequencia programa (ambiente-inicial)))

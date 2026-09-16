;; Conjunto de Mandelbrot escrito diretamente em WebAssembly Text.
;;
;; Nao existe linguagem de origem aqui: nao ha C, Rust ou AssemblyScript sendo
;; compilado. Isto e o assembly da web, escrito a mao, com pilha de operandos e
;; variaveis locais numeradas — a forma final em que todas as outras linguagens
;; deste laboratorio acabam.
;;
;; Montado com wat2wasm (wabt).

(module
  ;; 64 paginas de 64 KB = 4 MB. Cabe ate cerca de 1000x1000 pixels em RGBA.
  ;; Memoria em WebAssembly e um unico array de bytes, sem tipo e sem nomes:
  ;; "ponteiro" aqui e literalmente um indice inteiro.
  (memory (export "memoria") 64)

  ;; ---------------------------------------------------------------- paleta
  ;;
  ;; Recebe a fracao t = iteracoes / maximo e devolve um canal de cor 0..255.
  ;; A curva e a classica de fractal: polinomio que sobe e desce, dando anel
  ;; colorido em vez de degrade linear.
  ;;
  ;;   vermelho:  9 * (1-t) * t^3
  ;;   verde:    15 * (1-t)^2 * t^2
  ;;   azul:    8.5 * (1-t)^3 * t

  ;; Em WAT toda declaracao de local vem antes da primeira instrucao do corpo —
  ;; nao existe declarar no meio, como em C.
  (func $canal (param $t f64) (param $peso f64) (param $expUm i32) (param $expT i32) (result i32)
    (local $v f64)
    (local $i i32)
    (local $k i32)

    ;; v = peso
    local.get $peso
    local.set $v

    ;; v *= (1 - t) elevado a $expUm
    i32.const 0
    local.set $k
    (block $saiUm
      (loop $loopUm
        local.get $k
        local.get $expUm
        i32.ge_s
        br_if $saiUm

        local.get $v
        f64.const 1
        local.get $t
        f64.sub
        f64.mul
        local.set $v

        local.get $k
        i32.const 1
        i32.add
        local.set $k
        br $loopUm
      )
    )

    ;; v *= t elevado a $expT
    i32.const 0
    local.set $k
    (block $saiT
      (loop $loopT
        local.get $k
        local.get $expT
        i32.ge_s
        br_if $saiT

        local.get $v
        local.get $t
        f64.mul
        local.set $v

        local.get $k
        i32.const 1
        i32.add
        local.set $k
        br $loopT
      )
    )

    ;; i = trunc(v * 255), preso entre 0 e 255
    local.get $v
    f64.const 255
    f64.mul
    i32.trunc_sat_f64_s
    local.set $i

    local.get $i
    i32.const 0
    i32.lt_s
    if
      i32.const 0
      local.set $i
    end

    local.get $i
    i32.const 255
    i32.gt_s
    if
      i32.const 255
      local.set $i
    end

    local.get $i
  )

  ;; --------------------------------------------------------------- render
  ;;
  ;; Escreve RGBA a partir do byte 0 da memoria. Devolve o total de iteracoes
  ;; gastas no quadro inteiro, que e a medida honesta do custo.

  (func (export "render")
    (param $largura i32)
    (param $altura i32)
    (param $centroX f64)
    (param $centroY f64)
    (param $zoom f64)
    (param $maxIter i32)
    (result i64)

    (local $px i32) (local $py i32)
    (local $x0 f64) (local $y0 f64)
    (local $x f64) (local $y f64) (local $xt f64)
    (local $i i32) (local $off i32)
    (local $escala f64) (local $t f64)
    (local $total i64)

    ;; escala: quantas unidades do plano complexo cabem em um pixel
    f64.const 3.5
    local.get $zoom
    f64.div
    local.get $largura
    f64.convert_i32_s
    f64.div
    local.set $escala

    i32.const 0
    local.set $py

    (block $fimLinhas
      (loop $linhas
        local.get $py
        local.get $altura
        i32.ge_s
        br_if $fimLinhas

        i32.const 0
        local.set $px

        (block $fimColunas
          (loop $colunas
            local.get $px
            local.get $largura
            i32.ge_s
            br_if $fimColunas

            ;; x0 = centroX + (px - largura/2) * escala
            local.get $px
            f64.convert_i32_s
            local.get $largura
            f64.convert_i32_s
            f64.const 2
            f64.div
            f64.sub
            local.get $escala
            f64.mul
            local.get $centroX
            f64.add
            local.set $x0

            ;; y0 = centroY + (py - altura/2) * escala
            local.get $py
            f64.convert_i32_s
            local.get $altura
            f64.convert_i32_s
            f64.const 2
            f64.div
            f64.sub
            local.get $escala
            f64.mul
            local.get $centroY
            f64.add
            local.set $y0

            f64.const 0
            local.set $x
            f64.const 0
            local.set $y
            i32.const 0
            local.set $i

            ;; Itera z = z^2 + c ate escapar do raio 2 ou estourar o maximo.
            (block $escapou
              (loop $itera
                local.get $i
                local.get $maxIter
                i32.ge_s
                br_if $escapou

                ;; x*x + y*y > 4  ->  escapou
                local.get $x
                local.get $x
                f64.mul
                local.get $y
                local.get $y
                f64.mul
                f64.add
                f64.const 4
                f64.gt
                br_if $escapou

                ;; xt = x*x - y*y + x0
                local.get $x
                local.get $x
                f64.mul
                local.get $y
                local.get $y
                f64.mul
                f64.sub
                local.get $x0
                f64.add
                local.set $xt

                ;; y = 2*x*y + y0
                f64.const 2
                local.get $x
                f64.mul
                local.get $y
                f64.mul
                local.get $y0
                f64.add
                local.set $y

                local.get $xt
                local.set $x

                local.get $i
                i32.const 1
                i32.add
                local.set $i

                br $itera
              )
            )

            local.get $total
            local.get $i
            i64.extend_i32_s
            i64.add
            local.set $total

            ;; off = (py * largura + px) * 4
            local.get $py
            local.get $largura
            i32.mul
            local.get $px
            i32.add
            i32.const 4
            i32.mul
            local.set $off

            (if (i32.ge_s (local.get $i) (local.get $maxIter))
              (then
                ;; Dentro do conjunto: preto.
                local.get $off
                i32.const 0
                i32.store8
                local.get $off
                i32.const 1
                i32.add
                i32.const 0
                i32.store8
                local.get $off
                i32.const 2
                i32.add
                i32.const 0
                i32.store8
              )
              (else
                ;; t = i / maxIter
                local.get $i
                f64.convert_i32_s
                local.get $maxIter
                f64.convert_i32_s
                f64.div
                local.set $t

                local.get $off
                (call $canal (local.get $t) (f64.const 9)   (i32.const 1) (i32.const 3))
                i32.store8

                local.get $off
                i32.const 1
                i32.add
                (call $canal (local.get $t) (f64.const 15)  (i32.const 2) (i32.const 2))
                i32.store8

                local.get $off
                i32.const 2
                i32.add
                (call $canal (local.get $t) (f64.const 8.5) (i32.const 3) (i32.const 1))
                i32.store8
              )
            )

            ;; alfa sempre opaco
            local.get $off
            i32.const 3
            i32.add
            i32.const 255
            i32.store8

            local.get $px
            i32.const 1
            i32.add
            local.set $px
            br $colunas
          )
        )

        local.get $py
        i32.const 1
        i32.add
        local.set $py
        br $linhas
      )
    )

    local.get $total
  )
)

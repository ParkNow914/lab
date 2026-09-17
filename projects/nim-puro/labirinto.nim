## Gerador de labirinto e resolvedor A*, em Nim.
##
## Nim tem sintaxe de Python e compila para C nativo ou para JavaScript. Este
## arquivo é o mesmo em qualquer um dos dois: nada aqui depende do alvo.
##
## O ponto do projeto é o custo da heurística. A* e Dijkstra são o MESMO
## algoritmo — a única diferença é somar uma estimativa da distância que falta.
## Essa soma muda quantas células precisam ser visitadas, e a página mostra a
## diferença em número.

import std/[algorithm, random]

type
  Celula* = object
    parede*: bool

  Labirinto* = object
    largura*, altura*: int
    celulas*: seq[Celula]

  Ponto* = tuple[x, y: int]

  Resultado* = object
    caminho*: seq[Ponto]
    visitados*: seq[Ponto]
    encontrou*: bool

proc idx(lab: Labirinto, x, y: int): int {.inline.} =
  y * lab.largura + x

proc dentro(lab: Labirinto, x, y: int): bool {.inline.} =
  x >= 0 and y >= 0 and x < lab.largura and y < lab.altura

proc parede*(lab: Labirinto, x, y: int): bool {.inline.} =
  not lab.dentro(x, y) or lab.celulas[lab.idx(x, y)].parede

# ------------------------------------------------------------------- geração
#
# Escavação por caminhada aleatória com pilha ("recursive backtracker"). Começa
# com tudo sólido e vai abrindo, sempre pulando de dois em dois para que reste
# parede entre corredores. O resultado é um labirinto perfeito: existe exatamente
# UM caminho entre quaisquer duas células.

proc gerar*(largura, altura: int, semente: int, aberturaPct: int = 0): Labirinto =
  var rng = initRand(semente)

  result.largura = largura
  result.altura = altura
  result.celulas = newSeq[Celula](largura * altura)
  for c in result.celulas.mitems:
    c.parede = true

  var pilha: seq[Ponto] = @[(1, 1)]
  result.celulas[result.idx(1, 1)].parede = false

  while pilha.len > 0:
    let (x, y) = pilha[^1]

    var vizinhos: seq[Ponto] = @[]
    for (dx, dy) in [(0, -2), (2, 0), (0, 2), (-2, 0)]:
      let nx = x + dx
      let ny = y + dy
      if result.dentro(nx, ny) and result.parede(nx, ny):
        vizinhos.add((nx, ny))

    if vizinhos.len == 0:
      discard pilha.pop()
      continue

    let escolhido = vizinhos[rng.rand(vizinhos.len - 1)]
    # Abre também a parede do meio, senão os corredores ficariam isolados.
    result.celulas[result.idx((x + escolhido.x) div 2, (y + escolhido.y) div 2)].parede = false
    result.celulas[result.idx(escolhido.x, escolhido.y)].parede = false
    pilha.add(escolhido)

  # Derruba paredes extras, criando ciclos.
  #
  # Isto existe por causa de um achado ao medir: num labirinto PERFEITO a
  # heuristica do A* quase nao ajuda (uns 9%), porque so ha um caminho e nao ha
  # rota alternativa para podar. A vantagem do A* aparece quando existem muitas
  # rotas possiveis — e e isso que estas aberturas criam.
  if aberturaPct > 0:
    for y in 1 ..< altura - 1:
      for x in 1 ..< largura - 1:
        if result.parede(x, y) and rng.rand(99) < aberturaPct:
          result.celulas[result.idx(x, y)].parede = false

# ------------------------------------------------------------------- busca

proc manhattan(a, b: Ponto): int {.inline.} =
  abs(a.x - b.x) + abs(a.y - b.y)

## Busca com fronteira ordenada por custo.
##
## `comHeuristica = false` faz disto um Dijkstra: a fronteira é ordenada só pelo
## que já foi andado. Com `true`, soma a estimativa do que falta — e vira A*.
## O algoritmo é o mesmo; muda uma parcela na conta.
proc buscar*(lab: Labirinto, inicio, destino: Ponto, comHeuristica: bool): Resultado =
  const Infinito = high(int) div 2

  var custo = newSeq[int](lab.celulas.len)
  var veioDe = newSeq[int](lab.celulas.len)
  for i in 0 ..< custo.len:
    custo[i] = Infinito
    veioDe[i] = -1

  custo[lab.idx(inicio.x, inicio.y)] = 0

  # Fronteira como sequência ordenada: com labirinto deste tamanho é mais
  # simples e rápido que montar um heap, e o gargalo aqui não é a fila.
  var fronteira: seq[tuple[prioridade: int, p: Ponto]] = @[(0, inicio)]

  while fronteira.len > 0:
    fronteira.sort(proc (a, b: tuple[prioridade: int, p: Ponto]): int =
      cmp(a.prioridade, b.prioridade))

    let atual = fronteira[0].p
    fronteira.delete(0)
    result.visitados.add(atual)

    if atual == destino:
      result.encontrou = true
      var p = destino
      while p != inicio:
        result.caminho.add(p)
        let anterior = veioDe[lab.idx(p.x, p.y)]
        p = (anterior mod lab.largura, anterior div lab.largura)
      result.caminho.add(inicio)
      result.caminho.reverse()
      return

    for (dx, dy) in [(0, -1), (1, 0), (0, 1), (-1, 0)]:
      let nx = atual.x + dx
      let ny = atual.y + dy
      if lab.parede(nx, ny): continue

      let novoCusto = custo[lab.idx(atual.x, atual.y)] + 1
      if novoCusto < custo[lab.idx(nx, ny)]:
        custo[lab.idx(nx, ny)] = novoCusto
        veioDe[lab.idx(nx, ny)] = lab.idx(atual.x, atual.y)
        let prioridade =
          if comHeuristica: novoCusto + manhattan((nx, ny), destino)
          else: novoCusto
        fronteira.add((prioridade, (nx, ny)))

# --------------------------------------------------------------- ponte com JS

when defined(js):
  import std/jsffi

  proc paraJs(lab: Labirinto, r: Resultado): JsObject =
    var paredes = newJsAssoc[int, bool]()
    for i, c in lab.celulas:
      paredes[i] = c.parede

    var caminho = newJsAssoc[int, int]()
    for i, p in r.caminho:
      caminho[i] = p.y * lab.largura + p.x

    var visitados = newJsAssoc[int, int]()
    for i, p in r.visitados:
      visitados[i] = p.y * lab.largura + p.x

    result = newJsObject()
    result["largura"] = lab.largura
    result["altura"] = lab.altura
    result["paredes"] = paredes
    result["caminho"] = caminho
    result["visitados"] = visitados
    result["passosCaminho"] = r.caminho.len
    result["passosVisitados"] = r.visitados.len
    result["encontrou"] = r.encontrou

  proc nimResolver(largura, altura, semente, aberturaPct: int,
                   comHeuristica: bool): JsObject {.exportc.} =
    let lab = gerar(largura, altura, semente, aberturaPct)
    let inicio: Ponto = (1, 1)
    # Canto oposto ímpar: o gerador só abre células ímpares.
    let destino: Ponto = ((largura - 2) or 1, (altura - 2) or 1)
    let r = buscar(lab, inicio, destino, comHeuristica)
    paraJs(lab, r)

  {.emit: "globalThis.nimResolver = nimResolver;".}
  {.emit: "globalThis.nimPronto = true;".}

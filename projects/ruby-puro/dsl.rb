# Motor de regras de negócio com DSL interna.
#
# Ninguém escreve parser aqui. A "linguagem" de regras abaixo É Ruby — só que
# Ruby dobrado até parecer outra coisa. Três recursos fazem todo o trabalho:
#
#   instance_eval    executa um bloco trocando o `self`, o que faz `regra`,
#                    `quando` e `entao` existirem só dentro do bloco certo
#   method_missing   `cliente` e `total` não são métodos declarados em lugar
#                    nenhum: viram consulta ao dado na hora da chamada
#   blocos           `quando { ... }` guarda a condição sem executá-la, para
#                    avaliar depois, com outro `self`
#
# É exatamente essa combinação que permite `has_many :pedidos` e
# `validates :email, presence: true` existirem no Rails.

# --------------------------------------------------------------------- json
#
# A distribuição publicada do ruby.wasm não traz a stdlib `json`: um
# `require "json"` morre com LoadError. Escrever vinte linhas aqui é mais
# honesto do que trocar de build só para importar uma biblioteca — e mantém o
# "zero dependências" verdadeiro.

module Json
  def self.gerar(valor)
    case valor
    when Hash    then "{" + valor.map { |k, v| "#{texto(k.to_s)}:#{gerar(v)}" }.join(",") + "}"
    when Array   then "[" + valor.map { |v| gerar(v) }.join(",") + "]"
    when String  then texto(valor)
    when Numeric then valor.to_s
    when true, false then valor.to_s
    when nil     then "null"
    else texto(valor.to_s)
    end
  end

  # Escape caractere a caractere: mais longo que um gsub encadeado, e sem a
  # confusão de contrabarra dentro de expressão de substituição.
  def self.texto(str)
    saida = +'"'
    str.each_char do |c|
      saida << case c
               when '"'  then '\"'
               when "\\" then "\\\\"
               when "\n" then "\\n"
               when "\t" then "\\t"
               when "\r" then "\\r"
               else c
               end
    end
    saida << '"'
  end
end

# ----------------------------------------------------------------- registro

# Embrulha um Hash para que `cliente.vip?` funcione sem classe declarada.
class Registro
  def initialize(dados)
    @dados = dados
  end

  def method_missing(nome, *args)
    chave = nome.to_s.chomp("?")

    unless @dados.key?(chave)
      disponiveis = @dados.keys.join(", ")
      raise NoMethodError, "não existe o dado '#{chave}' (disponíveis: #{disponiveis})"
    end

    valor = @dados[chave]

    # `algo?` devolve booleano; `algo` devolve o valor.
    return !!valor && valor != 0 if nome.to_s.end_with?("?")

    valor.is_a?(Hash) ? Registro.new(valor) : valor
  end

  # Sem isto, `respond_to?` mentiria — e `method_missing` sem
  # `respond_to_missing?` é o erro clássico de quem aprendeu metaprogramação
  # pela metade.
  def respond_to_missing?(nome, incluir_privados = false)
    @dados.key?(nome.to_s.chomp("?")) || super
  end
end

# ----------------------------------------------------------------- execução

# O `self` durante `quando` e `entao`. Junta os dados do pedido com as ações
# que uma regra pode disparar.
class Execucao < Registro
  attr_reader :desconto_pct, :frete, :avisos, :bloqueado

  def initialize(dados)
    super
    @desconto_pct = 0
    @frete = 39.90
    @avisos = []
    @bloqueado = false
  end

  # --- ações disponíveis dentro de `entao` ---

  def aplicar_desconto(pct)
    @desconto_pct += pct
  end

  def frete_gratis!
    @frete = 0.0
  end

  def cobrar_frete(valor)
    @frete = valor.to_f
  end

  def avisar(mensagem)
    @avisos << mensagem
  end

  def bloquear!(motivo)
    @bloqueado = true
    @avisos << motivo
  end
end

# --------------------------------------------------------------------- regra

class Regra
  attr_reader :nome, :descricao

  def initialize(nome)
    @nome = nome
    @descricao = nil
  end

  # Estes três não são chamados por ninguém diretamente: eles só existem
  # porque `instance_eval` colocou uma Regra no lugar do `self`.
  def descricao=(texto)
    @descricao = texto
  end

  def quando(&bloco)
    @condicao = bloco
  end

  def entao(&bloco)
    @acao = bloco
  end

  def bate?(execucao)
    return false unless @condicao
    # instance_exec: roda o bloco com `self` trocado pela execução, o que faz
    # `total` e `cliente` resolverem contra o pedido.
    !!execucao.instance_exec(&@condicao)
  end

  def aplicar(execucao)
    execucao.instance_exec(&@acao) if @acao
  end
end

# ------------------------------------------------------------------ montador

class Montador
  attr_reader :regras

  def initialize
    @regras = []
  end

  def regra(nome, &corpo)
    r = Regra.new(nome)
    r.instance_eval(&corpo)
    @regras << r
  end
end

module Regras
  # Ponto de entrada da DSL.
  def self.definir(&bloco)
    m = Montador.new
    m.instance_eval(&bloco)
    m.regras
  end

  # Avalia todas as regras contra um pedido e devolve o resultado.
  def self.avaliar(regras, dados)
    exec = Execucao.new(dados)
    disparadas = []
    erros = []

    regras.each do |r|
      begin
        if r.bate?(exec)
          r.aplicar(exec)
          disparadas << r.nome
        end
      rescue NoMethodError => e
        erros << "regra '#{r.nome}': #{e.message}"
      rescue StandardError => e
        erros << "regra '#{r.nome}': #{e.class} — #{e.message}"
      end
    end

    subtotal = dados["total"].to_f
    desconto = (subtotal * exec.desconto_pct / 100.0).round(2)
    total = (subtotal - desconto + exec.frete).round(2)

    {
      "disparadas" => disparadas,
      "avaliadas"  => regras.map(&:nome),
      "subtotal"   => subtotal,
      "desconto_pct" => exec.desconto_pct,
      "desconto"   => desconto,
      "frete"      => exec.frete.round(2),
      "total"      => total,
      "avisos"     => exec.avisos,
      "bloqueado"  => exec.bloqueado,
      "erros"      => erros,
    }
  end
end

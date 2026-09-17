// Máquina de estados de um pedido, modelada com classes seladas do Dart 3.
//
// O ponto não é a máquina de estados: é que o COMPILADOR vigia o `switch`.
// Uma classe selada tem um conjunto fechado de subclasses conhecidas, e o Dart
// recusa um `switch` que não cubra todas. Esquecer um estado deixa de ser um
// bug que aparece em produção e vira um erro de compilação.
//
// É por isso que este projeto é este e não o de isolates que estava planejado:
// isolates não existem no dart2js, e prometer isso numa página web seria falso.

import 'dart:convert';
import 'dart:js_interop';
import 'dart:js_interop_unsafe';

// ------------------------------------------------------------------ estados

sealed class Estado {
  const Estado();

  /// O nome curto usado pela interface.
  String get codigo;
}

final class Rascunho extends Estado {
  const Rascunho();
  @override
  String get codigo => 'rascunho';
}

final class AguardandoPagamento extends Estado {
  final double valor;
  const AguardandoPagamento(this.valor);
  @override
  String get codigo => 'aguardando_pagamento';
}

final class Pago extends Estado {
  final String meio;
  const Pago(this.meio);
  @override
  String get codigo => 'pago';
}

final class EmSeparacao extends Estado {
  final int itens;
  const EmSeparacao(this.itens);
  @override
  String get codigo => 'em_separacao';
}

final class Despachado extends Estado {
  final String rastreio;
  const Despachado(this.rastreio);
  @override
  String get codigo => 'despachado';
}

final class Entregue extends Estado {
  final String recebidoPor;
  const Entregue(this.recebidoPor);
  @override
  String get codigo => 'entregue';
}

final class Cancelado extends Estado {
  final String motivo;
  const Cancelado(this.motivo);
  @override
  String get codigo => 'cancelado';
}

// ------------------------------------------------------------------ eventos

enum Evento { enviarParaPagamento, pagar, separar, despachar, entregar, cancelar }

// ------------------------------------------------------------- transições
//
// O `switch` expressão abaixo é exaustivo nos dois eixos: estado e evento. Não
// há `default`, e é justamente isso que faz o compilador trabalhar. Se um
// estado novo for criado e este switch não for atualizado, o código não compila.

Estado? transicao(Estado atual, Evento evento) => switch ((atual, evento)) {
      // Do rascunho só dá para ir cobrar ou desistir.
      (Rascunho(), Evento.enviarParaPagamento) => const AguardandoPagamento(289.90),
      (Rascunho(), Evento.cancelar) => const Cancelado('desistiu antes de fechar'),

      (AguardandoPagamento(), Evento.pagar) => const Pago('pix'),
      (AguardandoPagamento(), Evento.cancelar) => const Cancelado('pagamento não confirmado'),

      (Pago(), Evento.separar) => const EmSeparacao(3),
      (Pago(), Evento.cancelar) => const Cancelado('cancelado após pagamento — gera estorno'),

      (EmSeparacao(), Evento.despachar) => const Despachado('BR937284510SP'),
      (EmSeparacao(), Evento.cancelar) => const Cancelado('cancelado na separação'),

      (Despachado(), Evento.entregar) => const Entregue('porteiro'),

      // Qualquer outra combinação é transição inválida. Devolver null aqui é
      // decisão de projeto: a regra fica num lugar só, e quem chama trata.
      _ => null,
    };

/// Descrição legível de cada estado. Sem `default`: se alguém criar um estado
/// novo, o compilador exige tratá-lo aqui também.
String descrever(Estado e) => switch (e) {
      Rascunho() => 'Pedido em rascunho, ainda editável.',
      AguardandoPagamento(valor: final v) =>
        'Aguardando pagamento de R\$ ${v.toStringAsFixed(2)}.',
      Pago(meio: final m) => 'Pagamento confirmado via $m.',
      EmSeparacao(itens: final n) => 'Separando $n itens no estoque.',
      Despachado(rastreio: final r) => 'A caminho. Rastreio $r.',
      Entregue(recebidoPor: final quem) => 'Entregue e recebido por $quem.',
      Cancelado(motivo: final m) => 'Cancelado: $m.',
    };

/// Estado final não aceita mais evento nenhum.
bool ehFinal(Estado e) => switch (e) {
      Entregue() || Cancelado() => true,
      Rascunho() ||
      AguardandoPagamento() ||
      Pago() ||
      EmSeparacao() ||
      Despachado() =>
        false,
    };

/// A cor que a interface usa. Mais um switch exaustivo.
String cor(Estado e) => switch (e) {
      Rascunho() => 'neutro',
      AguardandoPagamento() => 'espera',
      Pago() || EmSeparacao() || Despachado() => 'andamento',
      Entregue() => 'sucesso',
      Cancelado() => 'falha',
    };

// ------------------------------------------------------------- reconstrução

/// Recria o estado a partir do código, para a interface poder mandar de volta
/// o que recebeu.
Estado? doCodigo(String codigo) => switch (codigo) {
      'rascunho' => const Rascunho(),
      'aguardando_pagamento' => const AguardandoPagamento(289.90),
      'pago' => const Pago('pix'),
      'em_separacao' => const EmSeparacao(3),
      'despachado' => const Despachado('BR937284510SP'),
      'entregue' => const Entregue('porteiro'),
      'cancelado' => const Cancelado('cancelado'),
      _ => null,
    };

Evento? eventoDoCodigo(String codigo) =>
    Evento.values.where((e) => e.name == codigo).firstOrNull;

// ------------------------------------------------------------------- ponte

Map<String, dynamic> _comoMapa(Estado e) => {
      'codigo': e.codigo,
      'descricao': descrever(e),
      'cor': cor(e),
      'final': ehFinal(e),
      'eventos': ehFinal(e)
          ? <String>[]
          : Evento.values
              .where((ev) => transicao(e, ev) != null)
              .map((ev) => ev.name)
              .toList(),
    };

void main() {
  // Estado inicial e o mapa inteiro da máquina, para a interface desenhar.
  globalContext.setProperty(
    'dartMaquina'.toJS,
    (() {
      final estados = ['rascunho', 'aguardando_pagamento', 'pago', 'em_separacao',
        'despachado', 'entregue', 'cancelado'];
      return jsonEncode({
        'inicial': 'rascunho',
        'estados': [for (final c in estados) _comoMapa(doCodigo(c)!)],
      }).toJS;
    }).toJS,
  );

  // Aplica um evento e devolve o estado novo, ou o motivo da recusa.
  globalContext.setProperty(
    'dartAplicar'.toJS,
    ((JSString estadoJs, JSString eventoJs) {
      final atual = doCodigo(estadoJs.toDart);
      final evento = eventoDoCodigo(eventoJs.toDart);

      if (atual == null || evento == null) {
        return jsonEncode({'erro': 'estado ou evento desconhecido'}).toJS;
      }

      final proximo = transicao(atual, evento);
      if (proximo == null) {
        return jsonEncode({
          'erro': 'de "${atual.codigo}" não existe transição por "${evento.name}"',
        }).toJS;
      }

      return jsonEncode({'estado': _comoMapa(proximo)}).toJS;
    }).toJS,
  );

  globalContext.setProperty('dartPronto'.toJS, true.toJS);
}

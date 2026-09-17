// Versao PROPOSITALMENTE incompleta.
//
// O estado `Cancelado` existe, mas o switch de `descrever` nao o trata. Em
// linguagem com `default`, isso passaria e quebraria em producao. Aqui o
// compilador recusa — e a saida dele e capturada no build para a pagina
// mostrar o erro de verdade, nao uma imitacao.

sealed class Estado {}

final class Rascunho extends Estado {}
final class Pago extends Estado {}
final class Cancelado extends Estado {}

String descrever(Estado e) => switch (e) {
      Rascunho() => 'rascunho',
      Pago() => 'pago',
      // Cancelado() nao esta aqui — de proposito.
    };

void main() {
  print(descrever(Rascunho()));
}

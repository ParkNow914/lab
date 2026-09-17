// Fontes de dado do painel.
//
// A latência é artificial e declarada, porque o ponto da página é o TEMPO: sem
// saber quanto cada consulta demora, não dá para ver o que o streaming resolve.
// Num sistema real esses números viriam de um banco, de uma API de pagamento e
// de um relatório agregado — com exatamente essa diferença de ordem de grandeza.

export type Consulta<T> = {
  id: string;
  rotulo: string;
  latenciaMs: number;
  dados: T;
  medidoMs: number;
};

async function esperar(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function consultar<T>(
  id: string,
  rotulo: string,
  latenciaMs: number,
  produzir: () => T,
): Promise<Consulta<T>> {
  const inicio = Date.now();
  await esperar(latenciaMs);
  return { id, rotulo, latenciaMs, dados: produzir(), medidoMs: Date.now() - inicio };
}

// ------------------------------------------------------------------ painéis

export type Resumo = { vendasHoje: number; pedidos: number; ticket: number };

export function resumoDoDia() {
  return consultar<Resumo>("resumo", "Resumo do dia", 150, () => ({
    vendasHoje: 18470.5,
    pedidos: 63,
    ticket: 18470.5 / 63,
  }));
}

export type Produto = { nome: string; qtd: number; receita: number };

export function maisVendidos() {
  return consultar<Produto[]>("produtos", "Mais vendidos", 600, () => [
    { nome: "Corte + barba", qtd: 22, receita: 1980 },
    { nome: "Coloração", qtd: 9, receita: 2340 },
    { nome: "Manicure", qtd: 17, receita: 850 },
    { nome: "Hidratação", qtd: 11, receita: 1320 },
    { nome: "Pacote mensal", qtd: 4, receita: 3600 },
  ]);
}

export type Hora = { hora: number; valor: number };

export function movimentoPorHora() {
  return consultar<Hora[]>("horas", "Movimento por hora", 1200, () =>
    [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((hora) => ({
      hora,
      // Dois picos: manhã e fim de tarde. Determinístico de propósito, para o
      // gráfico não mudar a cada recarga e confundir quem compara os modos.
      valor: Math.round(
        400 +
          900 * Math.exp(-((hora - 10.5) ** 2) / 3) +
          1400 * Math.exp(-((hora - 17.5) ** 2) / 4),
      ),
    })),
  );
}

export type Conciliacao = {
  recebido: number;
  aReceber: number;
  taxas: number;
  divergencias: number;
};

export function conciliacaoFinanceira() {
  // O relatório pesado: é ele que segura a página inteira no modo bloqueante.
  return consultar<Conciliacao>("conciliacao", "Conciliação financeira", 2200, () => ({
    recebido: 14220.3,
    aReceber: 4250.2,
    taxas: 613.7,
    divergencias: 2,
  }));
}

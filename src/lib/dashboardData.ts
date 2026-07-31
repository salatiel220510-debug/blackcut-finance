import { prisma } from "@/lib/prisma";

export async function serieUltimosDias(dias: number, filtro: { barberId?: string } = {}) {
  const hoje = new Date();
  hoje.setHours(23, 59, 59, 999);
  const inicio = new Date(hoje);
  inicio.setDate(inicio.getDate() - (dias - 1));
  inicio.setHours(0, 0, 0, 0);

  const transacoes = await prisma.transaction.findMany({
    where: {
      deletedAt: null,
      date: { gte: inicio, lte: hoje },
      ...(filtro.barberId ? { barberId: filtro.barberId } : {}),
    },
    select: { date: true, type: true, amount: true, commissionAmount: true },
  });

  const dadosPorDia: Record<string, { entradas: number; saidas: number; comissao: number }> = {};

  for (let i = 0; i < dias; i++) {
    const d = new Date(inicio);
    d.setDate(d.getDate() + i);
    dadosPorDia[d.toISOString().slice(0, 10)] = { entradas: 0, saidas: 0, comissao: 0 };
  }

  for (const t of transacoes) {
    const chave = t.date.toISOString().slice(0, 10);
    if (!dadosPorDia[chave]) continue;
    if (t.type === "INCOME") {
      dadosPorDia[chave].entradas += Number(t.amount);
      dadosPorDia[chave].comissao += Number(t.commissionAmount ?? 0);
    } else {
      dadosPorDia[chave].saidas += Number(t.amount);
    }
  }

  return Object.entries(dadosPorDia).map(([data, valores]) => ({
    dia: new Date(data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    ...valores,
  }));
}

export async function faturamentoPorBarbeiro(dias: number) {
  const hoje = new Date();
  hoje.setHours(23, 59, 59, 999);
  const inicio = new Date(hoje);
  inicio.setDate(inicio.getDate() - (dias - 1));
  inicio.setHours(0, 0, 0, 0);

  const transacoes = await prisma.transaction.findMany({
    where: { deletedAt: null, type: "INCOME", barberId: { not: null }, date: { gte: inicio, lte: hoje } },
    include: { barber: { select: { name: true } } },
  });

  const porBarbeiro: Record<string, number> = {};
  for (const t of transacoes) {
    const nome = t.barber?.name ?? "—";
    porBarbeiro[nome] = (porBarbeiro[nome] ?? 0) + Number(t.amount);
  }

  return Object.entries(porBarbeiro)
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total);
}
import { prisma } from "@/lib/prisma";
import { enviarEmail } from "@/lib/email";
import { enviarPushParaDonos } from "@/lib/push";

import { limitesDoMesEspecifico } from "@/lib/datasBrasil";

export async function calcularFechamento(ano: number, mesIndex0: number) {
  const { inicio, fimExclusivo } = limitesDoMesEspecifico(ano, mesIndex0);

  const transacoes = await prisma.transaction.findMany({
    where: { date: { gte: inicio, lt: fimExclusivo }, deletedAt: null },
    include: { expenseCategory: true },
  });

  const faturamentoBruto = transacoes
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + Number(t.amount), 0);

  const totalComissoes = transacoes
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + Number(t.commissionAmount ?? 0), 0);

  const despesas = transacoes.filter((t) => t.type === "EXPENSE");

  const totalDespesasFixas = despesas.filter((t) => t.expenseCategory?.type === "FIXED").reduce((s, t) => s + Number(t.amount), 0);
  const totalDespesasVariaveis = despesas.filter((t) => t.expenseCategory?.type === "VARIABLE").reduce((s, t) => s + Number(t.amount), 0);
  const totalInvestimento = despesas.filter((t) => t.expenseCategory?.type === "INVESTMENT").reduce((s, t) => s + Number(t.amount), 0);
  const totalMarketing = despesas.filter((t) => t.expenseCategory?.type === "MARKETING").reduce((s, t) => s + Number(t.amount), 0);
  const totalDespesas = despesas.reduce((s, t) => s + Number(t.amount), 0);

  const lucroLiquido = faturamentoBruto - totalDespesas - totalComissoes;

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const pctOperacional = settings ? Number(settings.envelopeOperacionalPct) : 60;
  const pctProLabore = settings ? Number(settings.envelopeProLaborePct) : 30;
  const pctReserva = settings ? Number(settings.envelopeReservaPct) : 10;

  const base = Math.max(lucroLiquido, 0);
  const envelopeOperacional = Number((base * (pctOperacional / 100)).toFixed(2));
  const envelopeProLabore = Number((base * (pctProLabore / 100)).toFixed(2));
  const envelopeReserva = Number((base * (pctReserva / 100)).toFixed(2));

  return {
    faturamentoBruto,
    totalDespesasFixas,
    totalDespesasVariaveis,
    totalInvestimento,
    totalMarketing,
    totalDespesas,
    totalComissoes,
    lucroLiquido,
    envelopeOperacional,
    envelopeProLabore,
    envelopeReserva,
  };
}

export async function fecharMes(ano: number, mesIndex0: number, notificar = true) {
  const mesData = new Date(Date.UTC(ano, mesIndex0, 1));

  const existente = await prisma.monthlyClosure.findUnique({ where: { mes: mesData } });
  if (existente) {
    throw new Error("Esse mês já foi fechado anteriormente.");
  }

  const calculo = await calcularFechamento(ano, mesIndex0);

  const fechamento = await prisma.monthlyClosure.create({
    data: { mes: mesData, ...calculo },
  });

  if (notificar) {
    const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const nomeMes = mesData.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

    await enviarEmail({
      to: "rafaelhv850@gmail.com",
      subject: `Fechamento de ${nomeMes} — BlackCut Finance`,
      html: `
        <h2>Fechamento de ${nomeMes}</h2>
        <p><strong>Faturamento bruto:</strong> ${formatar(calculo.faturamentoBruto)}</p>
        <p><strong>Despesas fixas:</strong> ${formatar(calculo.totalDespesasFixas)}</p>
        <p><strong>Despesas variáveis:</strong> ${formatar(calculo.totalDespesasVariaveis)}</p>
        <p><strong>Investimento:</strong> ${formatar(calculo.totalInvestimento)}</p>
        <p><strong>Marketing:</strong> ${formatar(calculo.totalMarketing)}</p>
        <p><strong>Comissões pagas:</strong> ${formatar(calculo.totalComissoes)}</p>
        <p><strong>Lucro líquido:</strong> ${formatar(calculo.lucroLiquido)}</p>
        <hr/>
        <p><strong>Envelope Operacional:</strong> ${formatar(calculo.envelopeOperacional)}</p>
        <p><strong>Envelope Pró-labore:</strong> ${formatar(calculo.envelopeProLabore)}</p>
        <p><strong>Envelope Reserva:</strong> ${formatar(calculo.envelopeReserva)}</p>
      `,
    }).catch((e) => console.error("[fechamento] erro ao enviar e-mail:", e));

    await enviarPushParaDonos({
      title: `Fechamento de ${nomeMes} concluído`,
      body: `Lucro líquido: ${formatar(calculo.lucroLiquido)}`,
    }).catch((e) => console.error("[fechamento] erro ao notificar:", e));
  }

  return fechamento;
}
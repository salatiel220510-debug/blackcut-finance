import { prisma } from "@/lib/prisma";
import { limitesDoMesEspecifico } from "@/lib/datasBrasil";

export async function faturamentoMensalBarbeiro(barberId: string, quantidade: number) {
  const agora = new Date();
  const resultado: { mes: string; faturamento: number }[] = [];

  for (let i = quantidade - 1; i >= 0; i--) {
    const data = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() - i, 1));
    const { inicio, fimExclusivo } = limitesDoMesEspecifico(data.getUTCFullYear(), data.getUTCMonth());

    const agg = await prisma.transaction.aggregate({
      where: { barberId, type: "INCOME", deletedAt: null, date: { gte: inicio, lt: fimExclusivo } },
      _sum: { amount: true },
    });

    resultado.push({
      mes: data.toLocaleDateString("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" }),
      faturamento: Number(agg._sum.amount ?? 0),
    });
  }

  return resultado;
}
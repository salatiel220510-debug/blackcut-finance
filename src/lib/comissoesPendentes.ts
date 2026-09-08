import { prisma } from "@/lib/prisma";
import { limitesDoMesEspecifico } from "@/lib/datasBrasil";

export async function comissaoPendenteBarbeiro(barberId: string) {
  const agg = await prisma.transaction.aggregate({
    where: { barberId, type: "INCOME", deletedAt: null, commissionSettled: false, commissionAmount: { not: null } },
    _sum: { commissionAmount: true },
  });
  return Number(agg._sum.commissionAmount ?? 0);
}

export async function totalComissaoPendente() {
  const agg = await prisma.transaction.aggregate({
    where: { type: "INCOME", deletedAt: null, commissionSettled: false, commissionAmount: { not: null } },
    _sum: { commissionAmount: true },
  });
  return Number(agg._sum.commissionAmount ?? 0);
}

export async function totalRecebidoBarbeiro(barberId: string) {
  const agg = await prisma.commissionSettlement.aggregate({
    where: { barberId },
    _sum: { valorPago: true },
  });
  return Number(agg._sum.valorPago ?? 0);
}

export async function totalRecebidoMesBarbeiro(barberId: string) {
  const agora = new Date();
  const { inicio, fimExclusivo } = limitesDoMesEspecifico(agora.getUTCFullYear(), agora.getUTCMonth());

  const agg = await prisma.commissionSettlement.aggregate({
    where: { barberId, createdAt: { gte: inicio, lt: fimExclusivo } },
    _sum: { valorPago: true },
  });
  return Number(agg._sum.valorPago ?? 0);
}
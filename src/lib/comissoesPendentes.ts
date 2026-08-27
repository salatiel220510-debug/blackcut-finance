import { prisma } from "@/lib/prisma";

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
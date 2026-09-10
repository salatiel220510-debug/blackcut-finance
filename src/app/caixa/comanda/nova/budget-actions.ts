"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { despesasPorCategoriaMes } from "@/lib/dashboardFinanceiro";

export async function consultarOrcamentoCategoria(categoriaId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  if (!categoriaId) return null;

  const categoria = await prisma.expenseCategory.findUnique({ where: { id: categoriaId } });
  if (!categoria) return null;

  const agora = new Date();
  const gastos = await despesasPorCategoriaMes(agora.getUTCFullYear(), agora.getUTCMonth());
  const gastoAtual = gastos.find((g) => g.nome === categoria.name)?.valor ?? 0;

  return {
    nome: categoria.name,
    limite: categoria.budgetLimit ? Number(categoria.budgetLimit) : null,
    gastoAtual,
  };
}
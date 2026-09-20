"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { comissaoPendenteBarbeiro } from "@/lib/comissoesPendentes";
import { z } from "zod";
import { verificarPermissao } from "@/lib/permissoes";

const liquidarComissaoSchema = z.object({
  valorPago: z.coerce
    .number({ error: "Informe um valor válido." })
    .min(0.01, "O valor pago deve ser maior que zero."),
});

export async function liquidarComissao(barberId: string, formData: FormData) {
 const session = await verificarPermissao("verComissoesTodos");
  const ownerId = (session.user as any).id;

  const validacao = liquidarComissaoSchema.safeParse(Object.fromEntries(formData));
  if (!validacao.success) return { erro: validacao.error.issues[0].message };

  const totalAcumulado = await comissaoPendenteBarbeiro(barberId);
  if (totalAcumulado <= 0) return { erro: "Não há comissão pendente para esse barbeiro." };

  const { valorPago } = validacao.data;
  if (valorPago > totalAcumulado) {
    return { erro: `Valor maior que o pendente (${totalAcumulado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}).` };
  }

  const valorAbsorvido = Number((totalAcumulado - valorPago).toFixed(2));

  await prisma.$transaction(async (tx) => {
    const despesa = await tx.transaction.create({
      data: {
        type: "EXPENSE",
        category: "Comissão Paga",
        amount: valorPago,
        barberId,
        createdById: ownerId,
      },
    });

    await tx.transaction.updateMany({
      where: { barberId, type: "INCOME", deletedAt: null, commissionSettled: false, commissionAmount: { not: null } },
      data: { commissionSettled: true },
    });

    await tx.commissionSettlement.create({
      data: {
        barberId,
        totalAcumulado,
        valorPago,
        valorAbsorvido,
        expenseTransactionId: despesa.id,
        paidById: ownerId,
      },
    });
  });

  revalidatePath("/admin/comissoes");
  revalidatePath("/caixa");
  revalidatePath("/home");
  revalidatePath("/perfil");
  return { sucesso: true };
}
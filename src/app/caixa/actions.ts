"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { enviarPushParaDonos } from "@/lib/push";

export async function excluirTransacao(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");

  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  const transacao = await prisma.transaction.findUnique({ where: { id } });
  if (!transacao || transacao.deletedAt) throw new Error("Lançamento não encontrado.");

  const podeExcluir = role === "OWNER" || transacao.createdById === userId;
  if (!podeExcluir) throw new Error("Você não tem permissão para excluir este lançamento.");

  await prisma.transaction.update({
    where: { id },
    data: { deletedAt: new Date(), deletedById: userId },
  });

  if (role === "BARBER") {
    const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    await enviarPushParaDonos({
      title: "Lançamento excluído",
      body: `${session.user?.name} excluiu: ${transacao.category} — ${formatar(Number(transacao.amount))}`,
    }).catch((e) => console.error("[push] erro ao notificar:", e));
  }

  revalidatePath("/caixa");
  revalidatePath("/home");
  revalidatePath("/perfil");
}
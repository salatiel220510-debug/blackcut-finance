"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { enviarPushParaDonos } from "@/lib/push";
import { diaBrasilDeData } from "@/lib/datasBrasil";
import { temPermissao } from "@/lib/permissoes";
import { fecharDiaInterno } from "@/lib/fecharDia";

export async function excluirTransacao(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");

  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  const transacao = await prisma.transaction.findUnique({ where: { id } });
  if (!transacao || transacao.deletedAt) throw new Error("Lançamento não encontrado.");

  const podeExcluir = role === "OWNER" || transacao.createdById === userId;
  if (!podeExcluir) throw new Error("Você não tem permissão para excluir este lançamento.");

  if (role === "BARBER") {
    const diaString = diaBrasilDeData(transacao.date);
    const [ano, mes, dia] = diaString.split("-").map(Number);
    const dataChave = new Date(Date.UTC(ano, mes - 1, dia));
    const diaFechado = await prisma.dailyClosure.findUnique({ where: { data: dataChave } });
    if (diaFechado) {
      throw new Error("Esse dia já foi fechado pela barbearia. Não é possível excluir lançamentos dele.");
    }
  }

  await prisma.transaction.update({
    where: { id },
    data: { deletedAt: new Date(), deletedById: userId },
  });

  if (role === "BARBER") {
    const nomeUsuario = session.user?.name;
    const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    after(async () => {
      await enviarPushParaDonos({
        title: "Lançamento excluído",
        body: `${nomeUsuario} excluiu: ${transacao.category} — ${formatar(Number(transacao.amount))}`,
      }).catch((e) => console.error("[push] erro ao notificar:", e));
    });
  }

  revalidatePath("/caixa");
  revalidatePath("/home");
  revalidatePath("/perfil");
}

export async function fecharDiaAction(data: string) {
  const session = await auth();
  if (!session?.user) return { erro: "Não autenticado." };

  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  const podeFechar = await temPermissao(role, userId, "fecharBarbearia");
  if (!podeFechar) return { erro: "Você não tem permissão para fechar a barbearia." };

  const resultado = await fecharDiaInterno(data, userId);
  if (resultado.jaEstavaFechado) {
    return { erro: "Esse dia já foi fechado anteriormente." };
  }

  revalidatePath("/caixa");
  return { sucesso: true };
}
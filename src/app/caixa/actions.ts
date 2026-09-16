"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { enviarPushParaDonos, enviarPushParaTodosAprovados } from "@/lib/push";
import { diaBrasilDeData, limitesDoDiaEspecifico } from "@/lib/datasBrasil";

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
  if ((session.user as any).role !== "OWNER") return { erro: "Apenas o dono pode fechar a barbearia." };

  const userId = (session.user as any).id;
  const [ano, mes, dia] = data.split("-").map(Number);
  const dataChave = new Date(Date.UTC(ano, mes - 1, dia));

  const jaFechado = await prisma.dailyClosure.findUnique({ where: { data: dataChave } });
  if (jaFechado) {
    return { erro: "Esse dia já foi fechado anteriormente." };
  }

  await prisma.dailyClosure.create({ data: { data: dataChave, closedById: userId } });

  const { inicio, fim } = limitesDoDiaEspecifico(data);
  const [entradasAgg, saidasAgg] = await Promise.all([
    prisma.transaction.aggregate({ where: { type: "INCOME", deletedAt: null, date: { gte: inicio, lte: fim } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "EXPENSE", deletedAt: null, date: { gte: inicio, lte: fim } }, _sum: { amount: true } }),
  ]);

  const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const totalEntradas = Number(entradasAgg._sum.amount ?? 0);
  const totalSaidas = Number(saidasAgg._sum.amount ?? 0);

  await enviarPushParaTodosAprovados({
    title: "Barbearia fechada por hoje",
    body: `Entradas: ${formatar(totalEntradas)} | Saídas: ${formatar(totalSaidas)}`,
  }).catch((e) => console.error("[fechar-dia] push:", e));

  revalidatePath("/caixa");
  return { sucesso: true };
}
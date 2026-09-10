"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { limitesDoMesEspecifico } from "@/lib/datasBrasil";

export async function consultarTransacoesDoMes(ano: number, mesIndex0: number) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") throw new Error("Acesso negado.");

  const { inicio, fimExclusivo } = limitesDoMesEspecifico(ano, mesIndex0);

  const transacoes = await prisma.transaction.findMany({
    where: { deletedAt: null, date: { gte: inicio, lt: fimExclusivo } },
    orderBy: { date: "asc" },
    include: { barber: { select: { name: true } } },
  });

  return transacoes.map((t) => ({
    id: t.id,
    type: t.type,
    category: t.category,
    amount: Number(t.amount),
    barberNome: t.barber?.name ?? null,
  }));
}
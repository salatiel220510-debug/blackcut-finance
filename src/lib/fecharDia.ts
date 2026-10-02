import { prisma } from "@/lib/prisma";
import { enviarPushParaTodosAprovados } from "@/lib/push";
import { limitesDoDiaEspecifico } from "@/lib/datasBrasil";

export async function fecharDiaInterno(data: string, closedById: string) {
  const [ano, mes, dia] = data.split("-").map(Number);
  const dataChave = new Date(Date.UTC(ano, mes - 1, dia));

  const jaFechado = await prisma.dailyClosure.findUnique({ where: { data: dataChave } });
  if (jaFechado) return { jaEstavaFechado: true };

  await prisma.dailyClosure.create({ data: { data: dataChave, closedById } });

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

  return { jaEstavaFechado: false };
}
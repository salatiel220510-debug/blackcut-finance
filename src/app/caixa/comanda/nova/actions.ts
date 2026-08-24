"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { enviarPushParaDonos } from "@/lib/push";
import { comandaSchema } from "@/lib/schemas";

export async function registrarComanda(dadosBrutos: unknown) {
  const session = await auth();
  if (!session?.user) return { erro: "Você precisa estar logado." };

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  const validacao = comandaSchema.safeParse(dadosBrutos);
  if (!validacao.success) {
    return { erro: validacao.error.issues[0].message };
  }

  const { barberId: barberIdForm, paymentMethod, clienteNome, itens } = validacao.data;

  let barberId: string;
  if (role === "BARBER") {
    barberId = userId;
  } else {
    if (!barberIdForm) return { erro: "Selecione o barbeiro responsável." };
    barberId = barberIdForm;
  }

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const percentual = settings ? Number(settings.commissionPercentage) : 40;

  const comandaId = crypto.randomUUID();

  await prisma.transaction.createMany({
    data: itens.map((item) => ({
      type: "INCOME" as const,
      category: item.category,
      amount: item.amount,
      barberId,
      commissionPercentage: percentual,
      commissionAmount: Number((item.amount * (percentual / 100)).toFixed(2)),
      comandaId,
      paymentMethod,
      clienteNome: clienteNome || null,
      createdById: userId,
    })),
  });

  const total = itens.reduce((s, i) => s + i.amount, 0);

  if (role === "BARBER") {
    const nomeUsuario = session.user?.name;
    const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    after(async () => {
      await enviarPushParaDonos({
        title: "Nova comanda registrada",
        body: `${nomeUsuario} fechou uma comanda de ${itens.length} item(ns) — ${formatar(total)}`,
      }).catch((e) => console.error("[push] erro ao notificar:", e));
    });
  }

  revalidatePath("/caixa");
  revalidatePath("/admin/fechamento");
  return { sucesso: true };
}
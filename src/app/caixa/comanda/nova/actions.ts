"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { enviarPushParaDonos } from "@/lib/push";
import { verificarAlertaOrcamento } from "@/lib/alertasOrcamento";
import { comandaSchema } from "@/lib/schemas";
import { estaEmModoDemo } from "@/lib/demoGuard";

export async function registrarComanda(dadosBrutos: unknown) {
  const session = await auth();
  if (!session?.user) return { erro: "Você precisa estar logado." };

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  const validacao = comandaSchema.safeParse(dadosBrutos);
  if (!validacao.success) {
    return { erro: validacao.error.issues[0].message };
  }

  const { barberId: barberIdForm, paymentMethod, clienteNome, observacao, itens } = validacao.data;

  const temItemIncome = itens.some((i) => i.tipo === "INCOME");
  const temItemExpense = itens.some((i) => i.tipo === "EXPENSE");

  if (role === "BARBER" && temItemExpense) {
    return { erro: "Barbeiros só podem registrar serviços, não despesas." };
  }

  if (temItemIncome && !paymentMethod) {
    return { erro: "Selecione a forma de pagamento." };
  }

  let barberId: string | null = null;
  if (temItemIncome) {
    if (role === "BARBER") {
      barberId = userId;
    } else {
      if (!barberIdForm) return { erro: "Selecione o barbeiro responsável pelos serviços." };
      barberId = barberIdForm;
    }
  }

  if (await estaEmModoDemo()) {
    return { sucesso: true, demo: true };
  }

  const settings = temItemIncome ? await prisma.settings.findUnique({ where: { id: 1 } }) : null;
  const percentual = settings ? Number(settings.commissionPercentage) : 40;

  const comandaId = crypto.randomUUID();

  await prisma.transaction.createMany({
    data: itens.map((item) =>
      item.tipo === "INCOME"
        ? {
            type: "INCOME" as const,
            category: item.category,
            amount: item.amount,
            barberId,
            commissionPercentage: percentual,
            commissionAmount: Number((item.amount * (percentual / 100)).toFixed(2)),
            comandaId,
            paymentMethod,
            clienteNome: clienteNome || null,
            observacao: observacao || null,
            createdById: userId,
          }
        : {
            type: "EXPENSE" as const,
            category: item.category,
            description: item.descricao || null,
            amount: item.amount,
            expenseCategoryId: item.expenseCategoryId || null,
            comandaId,
            paymentMethod: paymentMethod || null,
            observacao: observacao || null,
            createdById: userId,
          }
    ),
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

  if (temItemExpense) {
    const categoriasAfetadas = [
      ...new Set(itens.filter((i) => i.tipo === "EXPENSE" && i.expenseCategoryId).map((i) => i.expenseCategoryId as string)),
    ];
    after(async () => {
      for (const catId of categoriasAfetadas) {
        await verificarAlertaOrcamento(catId).catch((e) => console.error("[alerta-orcamento] erro:", e));
      }
    });
  }

  revalidatePath("/caixa");
  revalidatePath("/admin/fechamento");
  return { sucesso: true };
}
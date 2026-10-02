"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { enviarPushParaDonos } from "@/lib/push";
import { verificarAlertaOrcamento } from "@/lib/alertasOrcamento";
import { comandaSchema } from "@/lib/schemas";
import { estaEmModoDemo } from "@/lib/demoGuard";
import { temPermissao } from "@/lib/permissoes";
import { sessaoAberta } from "@/lib/caixaSessao";

export async function registrarComanda(dadosBrutos: unknown) {
  const session = await auth();
  if (!session?.user) return { erro: "Você precisa estar logado." };

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

    const sessaoAtual = await sessaoAberta();
  if (!sessaoAtual) {
    return { erro: "O caixa precisa estar aberto para registrar um atendimento. Peça para abrir o caixa primeiro." };
  }

  const validacao = comandaSchema.safeParse(dadosBrutos);
  if (!validacao.success) {
    return { erro: validacao.error.issues[0].message };
  }

  const { barberId: barberIdForm, paymentMethod, clienteNome, observacao, itens } = validacao.data;

  const temItemIncome = itens.some((i) => i.tipo === "INCOME");
  const temItemExpense = itens.some((i) => i.tipo === "EXPENSE");
  const itensProduto = itens.filter((i) => i.productId);

  if (temItemExpense) {
    const podeDespesas = await temPermissao(role, userId, "criarDespesasComanda");
    if (!podeDespesas) {
      return { erro: "Você não tem permissão para registrar despesas na comanda." };
    }
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

  for (const item of itensProduto) {
    const produto = await prisma.product.findUnique({ where: { id: item.productId! } });
    if (!produto) return { erro: "Produto não encontrado." };
    const qtd = item.quantidadeProduto ?? 1;
    if (produto.quantidade < qtd) {
      return { erro: `Estoque insuficiente de "${produto.name}" (disponível: ${produto.quantidade}).` };
    }
  }

  if (await estaEmModoDemo()) {
    return { sucesso: true, demo: true };
  }

  const settings = temItemIncome ? await prisma.settings.findUnique({ where: { id: 1 } }) : null;
  const percentual = settings ? Number(settings.commissionPercentage) : 40;

  const comandaId = crypto.randomUUID();

  await prisma.$transaction(async (tx) => {
    for (const item of itens) {
      if (item.tipo === "INCOME") {
        const ehProduto = !!item.productId;

        if (ehProduto) {
          const qtd = item.quantidadeProduto ?? 1;
          const atualizado = await tx.product.updateMany({
            where: { id: item.productId!, quantidade: { gte: qtd } },
            data: { quantidade: { decrement: qtd }, vendidos: { increment: qtd } },
          });
          if (atualizado.count === 0) {
            throw new Error(`Estoque insuficiente para concluir a venda do produto.`);
          }
        }

        await tx.transaction.create({
          data: {
            type: "INCOME",
            category: item.category,
            amount: item.amount,
            barberId,
            commissionPercentage: ehProduto ? null : percentual,
            commissionAmount: ehProduto ? null : Number((item.amount * (percentual / 100)).toFixed(2)),
            comandaId,
            paymentMethod,
            clienteNome: clienteNome || null,
            observacao: observacao || null,
            productId: item.productId || null,
            createdById: userId,
          },
        });
      } else {
        await tx.transaction.create({
          data: {
            type: "EXPENSE",
            category: item.category,
            description: item.descricao || null,
            amount: item.amount,
            expenseCategoryId: item.expenseCategoryId || null,
            comandaId,
            paymentMethod: paymentMethod || null,
            observacao: observacao || null,
            createdById: userId,
          },
        });
      }
    }
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
  revalidatePath("/admin/produtos");
  return { sucesso: true };
}
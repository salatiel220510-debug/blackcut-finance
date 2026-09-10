"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  comissaoSchema,
  saldoBancarioSchema,
  servicoSchema,
  atualizarPrecoSchema,
  descontoSchema,
  envelopesSchema,
  metasSchema,
  categoriaDespesaSchema,
  atualizarBudgetSchema,
  taxasSchema,
} from "@/lib/schemas";
import { estaEmModoDemo } from "@/lib/demoGuard";

async function verificarDono() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    throw new Error("Acesso negado.");
  }
}

export async function atualizarComissao(formData: FormData) {
  await verificarDono();
  const validacao = comissaoSchema.safeParse(Object.fromEntries(formData));
  if (!validacao.success) return { erro: validacao.error.issues[0].message };
  if (await estaEmModoDemo()) return { sucesso: true, demo: true };

  await prisma.settings.update({ where: { id: 1 }, data: { commissionPercentage: validacao.data.commissionPercentage } });
  revalidatePath("/admin/configuracoes");
  return { sucesso: true };
}

export async function criarServico(formData: FormData) {
  await verificarDono();
  const validacao = servicoSchema.safeParse(Object.fromEntries(formData));
  if (!validacao.success) return { erro: validacao.error.issues[0].message };
  if (await estaEmModoDemo()) return { sucesso: true, demo: true };

  const { name, price } = validacao.data;
  const existente = await prisma.serviceType.findUnique({ where: { name } });
  if (existente) return { erro: "Já existe um serviço com esse nome." };

  await prisma.serviceType.create({ data: { name, price: price ?? null } });
  revalidatePath("/admin/configuracoes");
  return { sucesso: true };
}

export async function atualizarServico(id: string, formData: FormData) {
  await verificarDono();
  const validacao = atualizarPrecoSchema.safeParse(Object.fromEntries(formData));
  if (!validacao.success) return { erro: validacao.error.issues[0].message };
  if (await estaEmModoDemo()) return { sucesso: true, demo: true };

  await prisma.serviceType.update({ where: { id }, data: { price: validacao.data.price ?? null } });
  revalidatePath("/admin/configuracoes");
}

export async function desativarServico(id: string) {
  await verificarDono();
  if (await estaEmModoDemo()) return;
  await prisma.serviceType.update({ where: { id }, data: { active: false } });
  revalidatePath("/admin/configuracoes");
}

export async function definirDesconto(id: string, formData: FormData) {
  await verificarDono();
  const validacao = descontoSchema.safeParse(Object.fromEntries(formData));
  if (!validacao.success) return { erro: validacao.error.issues[0].message };
  if (await estaEmModoDemo()) return { sucesso: true, demo: true };

  const { discountPercentage, discountValidUntil } = validacao.data;
  await prisma.serviceType.update({
    where: { id },
    data: { discountPercentage, discountValidUntil: discountValidUntil ? new Date(discountValidUntil) : null },
  });
  revalidatePath("/admin/configuracoes");
  return { sucesso: true };
}

export async function removerDesconto(id: string) {
  await verificarDono();
  if (await estaEmModoDemo()) return;
  await prisma.serviceType.update({ where: { id }, data: { discountPercentage: null, discountValidUntil: null } });
  revalidatePath("/admin/configuracoes");
}

export async function atualizarSaldoBancario(formData: FormData) {
  await verificarDono();
  const validacao = saldoBancarioSchema.safeParse(Object.fromEntries(formData));
  if (!validacao.success) return { erro: validacao.error.issues[0].message };
  if (await estaEmModoDemo()) return { sucesso: true, demo: true };

  await prisma.settings.update({ where: { id: 1 }, data: { saldoBancario: validacao.data.saldoBancario } });
  revalidatePath("/admin/configuracoes");
  revalidatePath("/admin/fechamento");
  return { sucesso: true };
}

export async function atualizarEnvelopes(formData: FormData) {
  await verificarDono();
  const validacao = envelopesSchema.safeParse(Object.fromEntries(formData));
  if (!validacao.success) return { erro: validacao.error.issues[0].message };

  const { envelopeOperacionalPct, envelopeProLaborePct, envelopeReservaPct } = validacao.data;
  const soma = envelopeOperacionalPct + envelopeProLaborePct + envelopeReservaPct;
  if (Math.abs(soma - 100) > 0.01) {
    return { erro: `A soma dos três percentuais precisa ser exatamente 100% (está em ${soma.toFixed(2)}%).` };
  }
  if (await estaEmModoDemo()) return { sucesso: true, demo: true };

  await prisma.settings.update({ where: { id: 1 }, data: { envelopeOperacionalPct, envelopeProLaborePct, envelopeReservaPct } });
  revalidatePath("/admin/configuracoes");
  return { sucesso: true };
}

export async function atualizarMetas(formData: FormData) {
  await verificarDono();
  const validacao = metasSchema.safeParse(Object.fromEntries(formData));
  if (!validacao.success) return { erro: validacao.error.issues[0].message };
  if (await estaEmModoDemo()) return { sucesso: true, demo: true };

  await prisma.settings.update({
    where: { id: 1 },
    data: { proLaboreMeta: validacao.data.proLaboreMeta ?? null, reservaMeta: validacao.data.reservaMeta ?? null },
  });
  revalidatePath("/admin/configuracoes");
  return { sucesso: true };
}

export async function atualizarTaxas(formData: FormData) {
  await verificarDono();
  const validacao = taxasSchema.safeParse(Object.fromEntries(formData));
  if (!validacao.success) return { erro: validacao.error.issues[0].message };
  if (await estaEmModoDemo()) return { sucesso: true, demo: true };

  const { taxaPix, taxaDebito, taxaCredito } = validacao.data;
  await prisma.settings.update({ where: { id: 1 }, data: { taxaPix, taxaDebito, taxaCredito } });
  revalidatePath("/admin/configuracoes");
  return { sucesso: true };
}

export async function criarCategoriaDespesa(formData: FormData) {
  await verificarDono();
  const validacao = categoriaDespesaSchema.safeParse(Object.fromEntries(formData));
  if (!validacao.success) return { erro: validacao.error.issues[0].message };
  if (await estaEmModoDemo()) return { sucesso: true, demo: true };

  const { name, type, budgetLimit } = validacao.data;
  const existente = await prisma.expenseCategory.findUnique({ where: { name } });
  if (existente) return { erro: "Já existe uma categoria com esse nome." };

  await prisma.expenseCategory.create({ data: { name, type, budgetLimit: budgetLimit ?? null } });
  revalidatePath("/admin/configuracoes");
  return { sucesso: true };
}

export async function atualizarBudgetCategoria(id: string, formData: FormData) {
  await verificarDono();
  const validacao = atualizarBudgetSchema.safeParse(Object.fromEntries(formData));
  if (!validacao.success) return { erro: validacao.error.issues[0].message };
  if (await estaEmModoDemo()) return { sucesso: true, demo: true };

  await prisma.expenseCategory.update({ where: { id }, data: { budgetLimit: validacao.data.budgetLimit ?? null } });
  revalidatePath("/admin/configuracoes");
}

export async function desativarCategoriaDespesa(id: string) {
  await verificarDono();
  if (await estaEmModoDemo()) return;
  await prisma.expenseCategory.update({ where: { id }, data: { active: false } });
  revalidatePath("/admin/configuracoes");
}
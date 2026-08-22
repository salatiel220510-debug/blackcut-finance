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
} from "@/lib/schemas";

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

  await prisma.settings.update({
    where: { id: 1 },
    data: { commissionPercentage: validacao.data.commissionPercentage },
  });
  revalidatePath("/admin/configuracoes");
  return { sucesso: true };
}

export async function criarServico(formData: FormData) {
  await verificarDono();
  const validacao = servicoSchema.safeParse(Object.fromEntries(formData));
  if (!validacao.success) return { erro: validacao.error.issues[0].message };

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

  await prisma.serviceType.update({
    where: { id },
    data: { price: validacao.data.price ?? null },
  });
  revalidatePath("/admin/configuracoes");
}

export async function desativarServico(id: string) {
  await verificarDono();
  await prisma.serviceType.update({ where: { id }, data: { active: false } });
  revalidatePath("/admin/configuracoes");
}

export async function definirDesconto(id: string, formData: FormData) {
  await verificarDono();
  const validacao = descontoSchema.safeParse(Object.fromEntries(formData));
  if (!validacao.success) return { erro: validacao.error.issues[0].message };

  const { discountPercentage, discountValidUntil } = validacao.data;

  await prisma.serviceType.update({
    where: { id },
    data: {
      discountPercentage,
      discountValidUntil: discountValidUntil ? new Date(discountValidUntil) : null,
    },
  });
  revalidatePath("/admin/configuracoes");
  return { sucesso: true };
}

export async function removerDesconto(id: string) {
  await verificarDono();
  await prisma.serviceType.update({
    where: { id },
    data: { discountPercentage: null, discountValidUntil: null },
  });
  revalidatePath("/admin/configuracoes");
}

export async function atualizarSaldoBancario(formData: FormData) {
  await verificarDono();
  const validacao = saldoBancarioSchema.safeParse(Object.fromEntries(formData));
  if (!validacao.success) return { erro: validacao.error.issues[0].message };

  await prisma.settings.update({
    where: { id: 1 },
    data: { saldoBancario: validacao.data.saldoBancario },
  });
  revalidatePath("/admin/configuracoes");
  revalidatePath("/caixa");
  return { sucesso: true };
}
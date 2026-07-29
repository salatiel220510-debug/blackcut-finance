"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function verificarDono() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    throw new Error("Acesso negado.");
  }
}

export async function atualizarComissao(formData: FormData) {
  await verificarDono();
  const percentual = parseFloat(((formData.get("commissionPercentage") as string) || "").replace(",", "."));

  if (isNaN(percentual) || percentual < 0 || percentual > 100) {
    return { erro: "Informe um percentual válido entre 0 e 100." };
  }

  await prisma.settings.update({ where: { id: 1 }, data: { commissionPercentage: percentual } });
  revalidatePath("/admin/configuracoes");
  return { sucesso: true };
}

export async function criarServico(formData: FormData) {
  await verificarDono();
  const name = ((formData.get("name") as string) || "").trim();
  const priceRaw = formData.get("price") as string;
  const price = priceRaw ? parseFloat(priceRaw.replace(",", ".")) : null;

  if (!name) return { erro: "Informe o nome do serviço." };

  const existente = await prisma.serviceType.findUnique({ where: { name } });
  if (existente) return { erro: "Já existe um serviço com esse nome." };

  await prisma.serviceType.create({ data: { name, price } });
  revalidatePath("/admin/configuracoes");
  return { sucesso: true };
}

export async function atualizarServico(id: string, formData: FormData) {
  await verificarDono();
  const priceRaw = formData.get("price") as string;
  const price = priceRaw ? parseFloat(priceRaw.replace(",", ".")) : null;
  await prisma.serviceType.update({ where: { id }, data: { price } });
  revalidatePath("/admin/configuracoes");
}

export async function desativarServico(id: string) {
  await verificarDono();
  await prisma.serviceType.update({ where: { id }, data: { active: false } });
  revalidatePath("/admin/configuracoes");
}
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { verificarPermissao } from "@/lib/permissoes";
import { produtoSchema } from "@/lib/schemas";
import { estaEmModoDemo } from "@/lib/demoGuard";

export async function criarProduto(formData: FormData) {
  await verificarPermissao("gerenciarProdutos");
  const validacao = produtoSchema.safeParse(Object.fromEntries(formData));
  if (!validacao.success) return { erro: validacao.error.issues[0].message };
  if (await estaEmModoDemo()) return { sucesso: true, demo: true };

  const { name, barcode, price, quantidade } = validacao.data;

  if (barcode) {
    const existente = await prisma.product.findUnique({ where: { barcode } });
    if (existente) return { erro: "Já existe um produto cadastrado com esse código de barras." };
  }

  await prisma.product.create({ data: { name, barcode: barcode || null, price, quantidade } });
  revalidatePath("/admin/produtos");
  return { sucesso: true };
}

export async function excluirProduto(id: string) {
  await verificarPermissao("gerenciarProdutos");
  if (await estaEmModoDemo()) return;
  await prisma.product.update({ where: { id }, data: { active: false } });
  revalidatePath("/admin/produtos");
}

export async function listarVendasProduto(productId: string) {
  await verificarPermissao("gerenciarProdutos");
  const vendas = await prisma.transaction.findMany({
    where: { productId, deletedAt: null },
    orderBy: { date: "desc" },
    include: { barber: { select: { name: true } } },
  });
  return vendas.map((v) => ({
    id: v.id,
    data: v.date.toISOString(),
    amount: Number(v.amount),
    paymentMethod: v.paymentMethod,
    barberNome: v.barber?.name ?? null,
    clienteNome: v.clienteNome,
    category: v.category,
  }));
}

export async function buscarProdutoPorCodigoBarras(barcode: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  return prisma.product.findUnique({ where: { barcode, active: true } });
}

export async function listarProdutosAtivos() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  const produtos = await prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  return produtos.map((p) => ({ id: p.id, name: p.name, price: Number(p.price), quantidade: p.quantidade, barcode: p.barcode }));
}
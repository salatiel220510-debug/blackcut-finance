"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { estaEmModoDemo } from "@/lib/demoGuard";
import { ChavePermissao } from "@/lib/permissoesTipos";
import { senhaBarbeiroSchema } from "@/lib/schemas";

async function verificarDono() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    throw new Error("Acesso negado.");
  }
}

export async function excluirBarbeiro(barberId: string) {
  await verificarDono();
  if (await estaEmModoDemo()) return { sucesso: true, demo: true };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: barberId },
      data: { status: "REMOVED", sessionVersion: { increment: 1 } },
    }),
    prisma.pushSubscription.deleteMany({ where: { userId: barberId } }),
  ]);

  revalidatePath("/admin/barbeiros");
  return { sucesso: true };
}

export async function redefinirSenhaBarbeiro(barberId: string, formData: FormData) {
  await verificarDono();
  const validacao = senhaBarbeiroSchema.safeParse(Object.fromEntries(formData));
  if (!validacao.success) return { erro: validacao.error.issues[0].message };
  if (await estaEmModoDemo()) return { sucesso: true, demo: true };

  const novoHash = await bcrypt.hash(validacao.data.novaSenha, 10);

  await prisma.user.update({
    where: { id: barberId },
    data: { passwordHash: novoHash, needsAccessCode: true, sessionVersion: { increment: 1 } },
  });

  revalidatePath("/admin/barbeiros");
  return { sucesso: true };
}

export async function atualizarPermissoesBarbeiro(barberId: string, formData: FormData) {
  await verificarDono();
  if (await estaEmModoDemo()) return { sucesso: true, demo: true };

  const chaves: ChavePermissao[] = [
    "verFaturamentoCompleto", "fecharBarbearia", "verFidelidadeGestao", "verFechamentoMensal",
    "abrirFecharCaixa", "registrarSangriaSuprimento", "verRelatosEquipe", "verComissoesTodos", "verCupons",
    "criarDespesasComanda", "gerenciarProdutos",
  ];

  const novasPermissoes: Record<string, boolean> = {};
  for (const chave of chaves) {
    novasPermissoes[chave] = formData.get(chave) === "on";
  }

  await prisma.user.update({ where: { id: barberId }, data: { permissions: novasPermissoes } });
  revalidatePath("/admin/barbeiros");
  return { sucesso: true };
}
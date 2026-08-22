"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { senhaSchema } from "@/lib/schemas";

export async function alterarSenha(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { erro: "Não autenticado." };

  const userId = (session.user as any).id;

  const validacao = senhaSchema.safeParse(Object.fromEntries(formData));
  if (!validacao.success) {
    return { erro: validacao.error.issues[0].message };
  }

  const { senhaAtual, novaSenha } = validacao.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { erro: "Usuário não encontrado." };

  const senhaCorreta = await bcrypt.compare(senhaAtual, user.passwordHash);
  if (!senhaCorreta) return { erro: "Senha atual incorreta." };

  const novoHash = await bcrypt.hash(novaSenha, 10);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: novoHash,
      ...(user.role === "BARBER" ? { needsAccessCode: true } : {}),
    },
  });

  return { sucesso: true };
}

export async function gerarCodigoAcesso() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    throw new Error("Acesso negado.");
  }

  const codigo = Math.floor(100000 + Math.random() * 900000).toString();

  await prisma.settings.update({
    where: { id: 1 },
    data: { accessCode: codigo, accessCodeUpdatedAt: new Date() },
  });

  return { codigo };
}
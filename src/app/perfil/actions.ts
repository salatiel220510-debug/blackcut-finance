"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

export async function alterarSenha(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { erro: "Não autenticado." };

  const userId = (session.user as any).id;
  const senhaAtual = formData.get("senhaAtual") as string;
  const novaSenha = formData.get("novaSenha") as string;
  const confirmarSenha = formData.get("confirmarSenha") as string;

  if (!senhaAtual || !novaSenha || !confirmarSenha) {
    return { erro: "Preencha todos os campos." };
  }
  if (novaSenha.length < 6) {
    return { erro: "A nova senha precisa ter pelo menos 6 caracteres." };
  }
  if (novaSenha !== confirmarSenha) {
    return { erro: "A confirmação não corresponde à nova senha." };
  }

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
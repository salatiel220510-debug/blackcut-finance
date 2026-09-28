"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redefinirSenhaTokenSchema } from "@/lib/schemas";

export async function redefinirSenhaComToken(formData: FormData) {
  const validacao = redefinirSenhaTokenSchema.safeParse(Object.fromEntries(formData));
  if (!validacao.success) return { erro: validacao.error.issues[0].message };

  const { token, novaSenha } = validacao.data;

  const registro = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!registro || registro.usedAt || registro.expiresAt < new Date()) {
    return { erro: "Este link é inválido ou já expirou. Solicite um novo na tela de login." };
  }

  const user = await prisma.user.findUnique({ where: { id: registro.userId } });
  if (!user) return { erro: "Conta não encontrada." };

  const novoHash = await bcrypt.hash(novaSenha, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: novoHash,
        sessionVersion: { increment: 1 },
        ...(user.role === "BARBER" ? { needsAccessCode: true } : {}),
      },
    }),
    prisma.passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } }),
  ]);

  return { sucesso: true };
}
"use server";

import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { enviarEmail } from "@/lib/email";
import { solicitarResetSenhaSchema } from "@/lib/schemas";

const MENSAGEM_PADRAO = "Se esse e-mail estiver cadastrado, enviamos um link de redefinição.";

export async function solicitarRedefinicaoSenha(formData: FormData) {
  const validacao = solicitarResetSenhaSchema.safeParse(Object.fromEntries(formData));
  if (!validacao.success) return { erro: validacao.error.issues[0].message };

  const email = validacao.data.email;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return { mensagem: MENSAGEM_PADRAO };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt } });

  const link = `https://blackcut-finance.vercel.app/login/redefinir-senha?token=${token}`;

  await enviarEmail({
    to: user.email,
    subject: "Redefinição de senha — BlackCut Finance",
    html: `
      <h2>Redefinição de senha</h2>
      <p>Olá, ${user.name}!</p>
      <p>Recebemos um pedido para redefinir sua senha. O link abaixo é válido por 1 hora:</p>
      <p><a href="${link}">${link}</a></p>
      <p>Se você não pediu isso, pode ignorar este e-mail — sua senha continua a mesma.</p>
    `,
  }).catch((e) => console.error("[esqueci-senha] erro ao enviar e-mail:", e));

  if (user.role === "BARBER") {
    await prisma.report.create({
      data: {
        type: "OUTRO",
        title: "Solicitação de redefinição de senha",
        description: `${user.name} (${user.email}) solicitou a redefinição da própria senha.`,
        createdById: user.id,
      },
    }).catch((e) => console.error("[esqueci-senha] erro ao registrar relato:", e));
  }

  return { mensagem: MENSAGEM_PADRAO };
}
"use server";

import { prisma } from "@/lib/prisma";
import { enviarEmail } from "@/lib/email";
import { esqueciSenhaSchema } from "@/lib/schemas";
import { verificarBloqueio, registrarTentativa } from "@/lib/rateLimit";
import { headers } from "next/headers";
import crypto from "crypto";

export async function solicitarRedefinicaoSenha(formData: FormData) {
  const validacao = esqueciSenhaSchema.safeParse(Object.fromEntries(formData));
  if (!validacao.success) return { erro: validacao.error.issues[0].message };

  const email = validacao.data.email;
  const chave = `reset:${email}`;

  const bloqueio = await verificarBloqueio(chave);
  if (bloqueio.bloqueado) {
    return { erro: `Muitas solicitações. Tente novamente em ${bloqueio.minutosRestantes} minuto(s).` };
  }
  await registrarTentativa(chave, false);

  const mensagemPadrao = { sucesso: true, mensagem: "Se esse e-mail estiver cadastrado, enviamos um link de redefinição." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return mensagemPadrao;

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } });

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = host.includes("localhost") ? "http" : "https";
  const link = `${proto}://${host}/redefinir-senha?token=${token}`;

  await enviarEmail({
    to: user.email,
    subject: "Redefinição de senha — BlackCut Finance",
    html: `
      <h2>Redefinição de senha</h2>
      <p>Você pediu para redefinir sua senha. Clique no link abaixo (válido por 1 hora):</p>
      <p><a href="${link}">${link}</a></p>
      <p>Se você não pediu isso, pode ignorar este e-mail com segurança.</p>
    `,
  }).catch((e) => console.error("[esqueci-senha] erro ao enviar e-mail:", e));

  return mensagemPadrao;
}
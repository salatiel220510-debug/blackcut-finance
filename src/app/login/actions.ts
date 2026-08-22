"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { verificarBloqueio, registrarTentativa } from "@/lib/rateLimit";
import { loginSchema } from "@/lib/schemas";

export async function verificarLogin(email: string, password: string) {
  const validacao = loginSchema.safeParse({ email, password });
  if (!validacao.success) {
    return { status: "invalido" as const };
  }

  const emailNormalizado = validacao.data.email;
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "desconhecido";

  const bloqueioEmail = await verificarBloqueio(emailNormalizado);
  const bloqueioIp = await verificarBloqueio(`ip:${ip}`);

  if (bloqueioEmail.bloqueado || bloqueioIp.bloqueado) {
    const minutos = Math.max(bloqueioEmail.minutosRestantes, bloqueioIp.minutosRestantes);
    return { status: "bloqueado" as const, minutos };
  }

  const user = await prisma.user.findUnique({ where: { email: emailNormalizado } });

  if (!user) {
    await registrarTentativa(emailNormalizado, false);
    await registrarTentativa(`ip:${ip}`, false);
    return { status: "invalido" as const };
  }

  const senhaCorreta = await bcrypt.compare(validacao.data.password, user.passwordHash);
  if (!senhaCorreta) {
    await registrarTentativa(emailNormalizado, false);
    await registrarTentativa(`ip:${ip}`, false);
    return { status: "invalido" as const };
  }

  await registrarTentativa(emailNormalizado, true);
  await registrarTentativa(`ip:${ip}`, true);

  if (user.status !== "APPROVED") return { status: "pendente" as const };
  if (user.needsAccessCode) return { status: "precisa_codigo" as const };

  return { status: "ok" as const };
}
"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function verificarLogin(email: string, password: string) {
  const emailNormalizado = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: emailNormalizado } });

  if (!user) return { status: "invalido" as const };

  const senhaCorreta = await bcrypt.compare(password, user.passwordHash);
  if (!senhaCorreta) return { status: "invalido" as const };

  if (user.status !== "APPROVED") return { status: "pendente" as const };
  if (user.needsAccessCode) return { status: "precisa_codigo" as const };

  return { status: "ok" as const };
}
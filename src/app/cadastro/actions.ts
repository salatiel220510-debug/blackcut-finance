"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cadastroSchema } from "@/lib/schemas";

export async function registrarBarbeiro(formData: FormData) {
  const validacao = cadastroSchema.safeParse(Object.fromEntries(formData));

  if (!validacao.success) {
    return { erro: validacao.error.issues[0].message };
  }

  const { name, email, password } = validacao.data;

  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) {
    return { erro: "Já existe uma conta com esse e-mail." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { name, email, passwordHash, role: "BARBER", status: "PENDING" },
  });

  return { sucesso: true };
}
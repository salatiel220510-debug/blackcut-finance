"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function registrarBarbeiro(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { erro: "Preencha todos os campos." };
  }

  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) {
    return { erro: "Já existe uma conta com esse e-mail." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "BARBER",
      status: "PENDING",
    },
  });

  return { sucesso: true };
}
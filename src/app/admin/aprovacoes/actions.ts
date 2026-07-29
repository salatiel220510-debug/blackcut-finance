"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function verificarDono() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    throw new Error("Acesso negado.");
  }
}

export async function aprovarBarbeiro(userId: string) {
  await verificarDono();
  await prisma.user.update({ where: { id: userId }, data: { status: "APPROVED" } });
  revalidatePath("/admin/aprovacoes");
}

export async function rejeitarBarbeiro(userId: string) {
  await verificarDono();
  await prisma.user.update({ where: { id: userId }, data: { status: "REJECTED" } });
  revalidatePath("/admin/aprovacoes");
}
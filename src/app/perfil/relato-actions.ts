"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { relatoSchema } from "@/lib/schemas";
import { enviarPushParaDonos } from "@/lib/push";
import { estaEmModoDemo } from "@/lib/demoGuard";

export async function criarRelato(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { erro: "Não autenticado." };

  const validacao = relatoSchema.safeParse(Object.fromEntries(formData));
  if (!validacao.success) return { erro: validacao.error.issues[0].message };

  if (await estaEmModoDemo()) return { sucesso: true, demo: true };

  const { type, title, description } = validacao.data;
  const userId = (session.user as any).id;

  await prisma.report.create({ data: { type, title, description, createdById: userId } });

  await enviarPushParaDonos({
    title: "Novo relato recebido",
    body: `${session.user?.name}: ${title}`,
  }).catch((e) => console.error("[relato] push:", e));

  revalidatePath("/admin/relatos");
  return { sucesso: true };
}

export async function resolverRelato(id: string) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") throw new Error("Acesso negado.");
  if (await estaEmModoDemo()) return;

  await prisma.report.update({ where: { id }, data: { status: "RESOLVIDO", resolvedAt: new Date() } });
  revalidatePath("/admin/relatos");
}

export async function excluirRelato(id: string) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") throw new Error("Acesso negado.");
  if (await estaEmModoDemo()) return;

  await prisma.report.delete({ where: { id } });
  revalidatePath("/admin/relatos");
}
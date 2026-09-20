"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { relatoSchema } from "@/lib/schemas";
import { enviarPushParaDonos, enviarPushParaUsuario } from "@/lib/push";
import { estaEmModoDemo } from "@/lib/demoGuard";
import { verificarPermissao } from "@/lib/permissoes";

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

export async function alternarStatusRelato(id: string) {
  const session = await verificarPermissao("verRelatosEquipe");
  if (await estaEmModoDemo()) return;

  const relato = await prisma.report.findUnique({ where: { id } });
  if (!relato) throw new Error("Relato não encontrado.");

  const novoStatus = relato.status === "ABERTO" ? "RESOLVIDO" : "ABERTO";

  await prisma.report.update({
    where: { id },
    data: { status: novoStatus, resolvedAt: novoStatus === "RESOLVIDO" ? new Date() : null },
  });

  await enviarPushParaUsuario(relato.createdById, {
    title: novoStatus === "RESOLVIDO" ? "Seu relato foi resolvido" : "Seu relato foi reaberto",
    body: relato.title,
  }).catch((e) => console.error("[relato] push:", e));

  revalidatePath("/admin/relatos");
}

export async function excluirRelato(id: string) {
  await verificarPermissao("verRelatosEquipe");
  if (await estaEmModoDemo()) return;

  await prisma.report.delete({ where: { id } });
  revalidatePath("/admin/relatos");
}
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { enviarPushParaTodosAprovados } from "@/lib/push";
import { notificacaoSchema } from "@/lib/schemas";
import { estaEmModoDemo } from "@/lib/demoGuard";

export async function enviarNotificacao(formData: FormData) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    return { erro: "Acesso negado." };
  }

  const validacao = notificacaoSchema.safeParse(Object.fromEntries(formData));
  if (!validacao.success) {
    return { erro: validacao.error.issues[0].message };
  }

  const { title, body, linkUrl, linkLabel } = validacao.data;
  const userId = (session.user as any).id;

  if (await estaEmModoDemo()) {
    return { sucesso: true, demo: true };
  }

  await prisma.notification.create({
    data: {
      title,
      body,
      linkUrl: linkUrl || null,
      linkLabel: linkLabel || null,
      createdById: userId,
    },
  });

  await enviarPushParaTodosAprovados({ title, body }).catch((e) => console.error("[notificacao] push:", e));

  revalidatePath("/notificacoes");
  return { sucesso: true };
}

export async function excluirNotificacao(id: string) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    throw new Error("Acesso negado.");
  }

  if (await estaEmModoDemo()) return;

  await prisma.notification.delete({ where: { id } });
  revalidatePath("/notificacoes");
}
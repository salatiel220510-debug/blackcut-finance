"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { enviarPushParaTodosAprovados } from "@/lib/push";
import { notificacaoSchema } from "@/lib/schemas";

export async function enviarNotificacao(formData: FormData) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    return { erro: "Acesso negado." };
  }

  const validacao = notificacaoSchema.safeParse(Object.fromEntries(formData));
  if (!validacao.success) {
    return { erro: validacao.error.issues[0].message };
  }

  const { title, body } = validacao.data;
  const userId = (session.user as any).id;

  await prisma.notification.create({ data: { title, body, createdById: userId } });

  await enviarPushParaTodosAprovados({ title, body }).catch((e) => console.error("[notificacao] push:", e));

  revalidatePath("/notificacoes");
  return { sucesso: true };
}
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const DIAS_DE_RETENCAO = 90;

// Apaga registros da ATOMIC mais antigos que 90 dias (conversas, consultas e formulários).
// Somente o DONO pode executar. A ação não pode ser desfeita.
export async function limparRegistrosAntigos() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    return { erro: "Acesso negado." };
  }

  const corte = new Date(Date.now() - DIAS_DE_RETENCAO * 24 * 60 * 60 * 1000);

  // Apagar a conversa remove também as mensagens dela (cascata definida no banco).
  const [conversas, consultas, formularios] = await Promise.all([
    prisma.atomicChat.deleteMany({ where: { updatedAt: { lt: corte } } }),
    prisma.atomicToolLog.deleteMany({ where: { createdAt: { lt: corte } } }),
    prisma.atomicProposal.deleteMany({ where: { createdAt: { lt: corte } } }),
  ]);

  revalidatePath("/atomic/auditoria");
  return { conversas: conversas.count, consultas: consultas.count, formularios: formularios.count };
}
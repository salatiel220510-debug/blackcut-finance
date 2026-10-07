"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissoes";
import { executarTurno } from "@/lib/atomic/orquestrador";
import { ErroModelo, type Conteudo } from "@/lib/atomic/modelo";

const LIMITE_MENSAGENS_POR_HORA = 30;

const mensagemSchema = z.object({
  chatId: z.string().trim().min(1).nullish(),
  texto: z
    .string()
    .trim()
    .min(1, "Digite uma mensagem.")
    .max(1000, "Mensagem muito longa (máximo de 1000 caracteres)."),
});

// Porta de entrada única: exige login E a permissão "usarAtomic".
async function sessaoAtomic() {
  const session = await auth();
  if (!session?.user) return null;
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;
  if (!(await temPermissao(role, userId, "usarAtomic"))) return null;
  return { role, userId };
}

export async function enviarMensagem(dados: unknown): Promise<{ chatId?: string; resposta?: string; erro?: string }> {
  const sessao = await sessaoAtomic();
  if (!sessao) return { erro: "Acesso negado." };

  const validacao = mensagemSchema.safeParse(dados);
  if (!validacao.success) return { erro: validacao.error.issues[0].message };
  const { chatId, texto } = validacao.data;

  // Limite de uso por usuário (protege a cota gratuita e evita abuso).
  const desde = new Date(Date.now() - 60 * 60 * 1000);
  const usadas = await prisma.atomicMessage.count({
    where: { role: "USER", createdAt: { gte: desde }, chat: { userId: sessao.userId } },
  });
  if (usadas >= LIMITE_MENSAGENS_POR_HORA) {
    return { erro: "Limite de mensagens por hora atingido. Tente novamente mais tarde." };
  }

  // A conversa precisa pertencer ao usuário logado (evita acessar chat de outra pessoa).
  let chat = chatId ? await prisma.atomicChat.findFirst({ where: { id: chatId, userId: sessao.userId } }) : null;
  if (chatId && !chat) return { erro: "Conversa não encontrada." };
  if (!chat) chat = await prisma.atomicChat.create({ data: { userId: sessao.userId, title: texto.slice(0, 40) } });

  await prisma.atomicMessage.create({ data: { chatId: chat.id, role: "USER", content: texto } });

  const recentes = await prisma.atomicMessage.findMany({
    where: { chatId: chat.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const historico: Conteudo[] = recentes.reverse().map((m) => ({
    role: (m.role === "USER" ? "user" : "model") as "user" | "model",
    parts: [{ text: m.content }],
  }));

  try {
    const resposta = await executarTurno({ chatId: chat.id, ctx: sessao, historico });
    await prisma.$transaction([
      prisma.atomicMessage.create({ data: { chatId: chat.id, role: "MODEL", content: resposta } }),
      prisma.atomicChat.update({ where: { id: chat.id }, data: { updatedAt: new Date() } }),
    ]);
    return { chatId: chat.id, resposta };
  } catch (e) {
    console.error("[atomic] erro ao responder:", e);
    if (e instanceof ErroModelo && e.status === 429) {
      return { chatId: chat.id, erro: "A ATOMIC atingiu o limite de uso do plano gratuito. Aguarde alguns instantes e tente de novo." };
    }
    return { chatId: chat.id, erro: "A ATOMIC está indisponível no momento. Tente novamente em instantes." };
  }
}

export async function listarConversas() {
  const sessao = await sessaoAtomic();
  if (!sessao) return [];
  const chats = await prisma.atomicChat.findMany({
    where: { userId: sessao.userId },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: { id: true, title: true, updatedAt: true },
  });
  return chats.map((c) => ({ id: c.id, title: c.title, updatedAt: c.updatedAt.toISOString() }));
}

export async function carregarConversa(chatId: string) {
  const sessao = await sessaoAtomic();
  if (!sessao) return [];
  const chat = await prisma.atomicChat.findFirst({
    where: { id: chatId, userId: sessao.userId },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 200 } },
  });
  return (chat?.messages ?? []).map((m) => ({ role: m.role, content: m.content }));
}

export async function excluirConversa(chatId: string) {
  const sessao = await sessaoAtomic();
  if (!sessao) return { erro: "Acesso negado." };
  await prisma.atomicChat.deleteMany({ where: { id: chatId, userId: sessao.userId } });
  return { sucesso: true };
}
"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissoes";
import { executarTurno } from "@/lib/atomic/orquestrador";
import { ErroModelo, type Conteudo } from "@/lib/atomic/modelo";
import { executarProposta } from "@/lib/atomic/propostas";
import { atomicDesligada, decidirLimite, LIMITE_CONFIRMACOES_POR_HORA } from "@/lib/atomic/seguranca";
import {
  VALIDADE_PROPOSTA_MS,
  type PropostaRascunho,
  type PropostaView,
  type StatusProposta,
  type TipoProposta,
} from "@/lib/atomic/tipos";

const mensagemSchema = z.object({
  chatId: z.string().trim().min(1).nullish(),
  texto: z
    .string()
    .trim()
    .min(1, "Digite uma mensagem.")
    .max(1000, "Mensagem muito longa (máximo de 1000 caracteres)."),
});

// Valores editados pela pessoa no formulário (texto simples, com limite de tamanho).
const valoresSchema = z.record(z.string(), z.string().max(200));

// Porta de entrada única: exige login E a permissão "usarAtomic".
async function sessaoAtomic() {
  if (atomicDesligada()) return null; // interruptor de emergência (ATOMIC_DESLIGADA=true)
  const session = await auth();
  if (!session?.user) return null;
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;
  if (!(await temPermissao(role, userId, "usarAtomic"))) return null;
  return { role, userId };
}

// Traduz o erro técnico em uma mensagem útil. O diagnóstico técnico só é mostrado
// em desenvolvimento (npm run dev) ou ao DONO; barbeiros nunca recebem detalhes.
function mensagemDeErro(e: unknown, mostrarDetalhe: boolean): string {
  const dev = mostrarDetalhe;
  const generica = "A ATOMIC está indisponível no momento. Tente novamente em instantes.";

  if (e instanceof ErroModelo) {
    const detalhe = dev ? ` (diagnóstico: HTTP ${e.status} — ${e.message.slice(0, 300)})` : "";
    if (e.status === 429) return "A ATOMIC atingiu o limite de uso do plano gratuito. Aguarde alguns instantes e tente de novo." + detalhe;
    if (e.message.includes("GEMINI_API_KEY")) return "A chave da IA não está configurada no servidor." + detalhe;
    if (e.status === 401 || e.status === 403) return "O Google recusou o acesso desta chave ou deste modelo. Verifique a configuração." + detalhe;
    if (e.status === 400) return "O Google recusou a solicitação. Verifique a chave e o modelo configurados." + detalhe;
    if (e.status === 404) return "O modelo de IA configurado não está disponível para esta chave." + detalhe;
    if (e.status === 504) return "A resposta demorou demais. Tente uma pergunta mais específica." + detalhe;
    return generica + detalhe;
  }
  return generica + (dev && e instanceof Error ? ` (diagnóstico: ${e.message.slice(0, 300)})` : "");
}

// Converte registros do banco no formato que a tela usa.
type LinhaProposta = {
  id: string;
  type: TipoProposta;
  data: unknown;
  summary: string;
  status: StatusProposta;
  result: string | null;
  createdAt: Date;
};

async function montarViews(linhas: LinhaProposta[]): Promise<PropostaView[]> {
  if (linhas.length === 0) return [];
  const categorias = linhas.some((l) => l.type === "DESPESA")
    ? await prisma.expenseCategory.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } })
    : undefined;
  const agora = Date.now();

  return linhas.map((l) => ({
    id: l.id,
    tipo: l.type,
    dados: (l.data ?? {}) as Record<string, string>,
    resumo: l.summary,
    status: l.status,
    resultado: l.result,
    expirada: l.status === "PENDENTE" && l.type !== "FIDELIDADE" && agora - l.createdAt.getTime() > VALIDADE_PROPOSTA_MS,
    categorias: l.type === "DESPESA" ? categorias : undefined,
  }));
}

export async function enviarMensagem(
  dados: unknown
): Promise<{ chatId?: string; resposta?: string; propostas?: PropostaView[]; erro?: string }> {
  if (atomicDesligada()) return { erro: "A ATOMIC está temporariamente desativada." };
  const sessao = await sessaoAtomic();
  if (!sessao) return { erro: "Acesso negado." };

  const validacao = mensagemSchema.safeParse(dados);
  if (!validacao.success) return { erro: validacao.error.issues[0].message };
  const { chatId, texto } = validacao.data;

  // Limites de uso: por hora e por dia (por usuário) e por dia (toda a barbearia).
  // Protegem a cota gratuita do Google e evitam abuso.
  const umaHora = new Date(Date.now() - 60 * 60 * 1000);
  const umDia = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [usadasHora, usadasDia, usadasGlobal] = await Promise.all([
    prisma.atomicMessage.count({ where: { role: "USER", createdAt: { gte: umaHora }, chat: { userId: sessao.userId } } }),
    prisma.atomicMessage.count({ where: { role: "USER", createdAt: { gte: umDia }, chat: { userId: sessao.userId } } }),
    prisma.atomicMessage.count({ where: { role: "USER", createdAt: { gte: umDia } } }),
  ]);
  const bloqueio = decidirLimite({ usadasHora, usadasDia, usadasGlobal });
  if (bloqueio) return { erro: bloqueio };

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
    // Coletor: as ferramentas "propor_*" depositam aqui os formulários pedidos pela IA.
    const rascunhos: PropostaRascunho[] = [];
    const resposta = await executarTurno({
      chatId: chat.id,
      ctx: { ...sessao, propostas: rascunhos },
      historico,
    });

    const [mensagemModelo] = await prisma.$transaction([
      prisma.atomicMessage.create({ data: { chatId: chat.id, role: "MODEL", content: resposta } }),
      prisma.atomicChat.update({ where: { id: chat.id }, data: { updatedAt: new Date() } }),
    ]);

    // Só AGORA os formulários são guardados (ainda PENDENTES: nada foi gravado no negócio).
    const criadas = await Promise.all(
      rascunhos.map((r) =>
        prisma.atomicProposal.create({
          data: {
            chatId: chat.id,
            messageId: mensagemModelo.id,
            userId: sessao.userId,
            type: r.tipo,
            data: r.dados,
            summary: r.resumo,
          },
        })
      )
    );

    return { chatId: chat.id, resposta, propostas: await montarViews(criadas) };
  } catch (e) {
    console.error("[atomic] erro ao responder:", e);
    const verDetalhe = process.env.NODE_ENV !== "production" || sessao.role === "OWNER";
    return { chatId: chat.id, erro: mensagemDeErro(e, verDetalhe) };
  }
}

// ─────────────── Confirmação humana: o ÚNICO caminho que grava dados ───────────────

export async function confirmarProposta(id: string, valores: unknown): Promise<{ sucesso?: true; mensagem?: string; erro?: string }> {
  const sessao = await sessaoAtomic();
  if (!sessao) return { erro: "Acesso negado." };

  const v = valoresSchema.safeParse(valores);
  if (!v.success) return { erro: "Valores inválidos no formulário." };

  // O formulário precisa existir e pertencer a quem está confirmando.
  const proposta = await prisma.atomicProposal.findFirst({ where: { id, userId: sessao.userId } });
  if (!proposta) return { erro: "Formulário não encontrado." };
  if (proposta.type === "FIDELIDADE") return { erro: "Este painel não precisa de confirmação." };
  if (proposta.status !== "PENDENTE") return { erro: "Este formulário já foi decidido." };
  if (Date.now() - proposta.createdAt.getTime() > VALIDADE_PROPOSTA_MS) {
    return { erro: "Este formulário expirou. Peça novamente à ATOMIC." };
  }

  // Freio: muitas confirmações em pouco tempo indicam erro ou uso indevido.
  const confirmadasNaHora = await prisma.atomicProposal.count({
    where: { userId: sessao.userId, status: "CONFIRMADA", decidedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
  });
  if (confirmadasNaHora >= LIMITE_CONFIRMACOES_POR_HORA) {
    return { erro: "Muitas confirmações em pouco tempo. Aguarde alguns minutos." };
  }

  // Trava contra clique duplo: só UMA chamada consegue passar de PENDENTE para EXECUTANDO.
  const trava = await prisma.atomicProposal.updateMany({ where: { id, status: "PENDENTE" }, data: { status: "EXECUTANDO" } });
  if (trava.count !== 1) return { erro: "Este formulário já está sendo processado." };

  let resultado: { ok: boolean; mensagem: string } = { ok: false, mensagem: "Não foi possível concluir. Tente novamente." };
  try {
    resultado = await executarProposta(proposta.type, v.data);
  } finally {
    // Sucesso: encerra. Falha: volta a PENDENTE para a pessoa corrigir e tentar de novo.
    await prisma.atomicProposal.update({
      where: { id },
      data: resultado.ok
        ? { status: "CONFIRMADA", confirmed: v.data, result: resultado.mensagem, decidedAt: new Date() }
        : { status: "PENDENTE" },
    });
  }

  return resultado.ok ? { sucesso: true, mensagem: resultado.mensagem } : { erro: resultado.mensagem };
}

export async function cancelarProposta(id: string) {
  const sessao = await sessaoAtomic();
  if (!sessao) return { erro: "Acesso negado." };
  await prisma.atomicProposal.updateMany({
    where: { id, userId: sessao.userId, status: "PENDENTE" },
    data: { status: "CANCELADA", decidedAt: new Date() },
  });
  return { sucesso: true };
}

// ─────────────── Conversas ───────────────

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
  const mensagens = chat?.messages ?? [];

  const linhas = mensagens.length
    ? await prisma.atomicProposal.findMany({
        where: { userId: sessao.userId, messageId: { in: mensagens.map((m) => m.id) } },
        orderBy: { createdAt: "asc" },
      })
    : [];
  const views = await montarViews(linhas);

  return mensagens.map((m) => ({
    role: m.role,
    content: m.content,
    propostas: views.filter((_, i) => linhas[i].messageId === m.id),
  }));
}

export async function excluirConversa(chatId: string) {
  const sessao = await sessaoAtomic();
  if (!sessao) return { erro: "Acesso negado." };
  await prisma.atomicChat.deleteMany({ where: { id: chatId, userId: sessao.userId } });
  return { sucesso: true };
}
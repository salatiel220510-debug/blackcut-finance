"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { sessaoAberta } from "@/lib/caixaSessao";
import { estaEmModoDemo } from "@/lib/demoGuard";
import { abrirCaixaSchema, fecharCaixaSchema, movimentoCaixaSchema } from "@/lib/schemas";

export async function abrirCaixa(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { erro: "Não autenticado." };

  const jaAberta = await sessaoAberta();
  if (jaAberta) {
    return { erro: `O caixa já está aberto desde ${jaAberta.abertoEm.toLocaleString("pt-BR")}, por ${jaAberta.abertoPor.name}.` };
  }

  const validacao = abrirCaixaSchema.safeParse(Object.fromEntries(formData));
  if (!validacao.success) return { erro: validacao.error.issues[0].message };
  if (await estaEmModoDemo()) return { sucesso: true, demo: true };

  const userId = (session.user as any).id;
  await prisma.cashSession.create({ data: { abertoPorId: userId, fundoTroco: validacao.data.fundoTroco } });

  revalidatePath("/caixa");
  return { sucesso: true };
}

export async function fecharCaixa(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { erro: "Não autenticado." };

  const sessao = await sessaoAberta();
  if (!sessao) return { erro: "Não há caixa aberto no momento." };

  const validacao = fecharCaixaSchema.safeParse(Object.fromEntries(formData));
  if (!validacao.success) return { erro: validacao.error.issues[0].message };
  if (await estaEmModoDemo()) return { sucesso: true, demo: true };

  const userId = (session.user as any).id;
  await prisma.cashSession.update({
    where: { id: sessao.id },
    data: {
      status: "FECHADO",
      fechadoPorId: userId,
      fechadoEm: new Date(),
      contagemDinheiro: validacao.data.contagemDinheiro,
      contagemCartao: validacao.data.contagemCartao,
    },
  });

  revalidatePath("/caixa");
  return { sucesso: true, sessionId: sessao.id };
}

async function registrarMovimento(tipo: "SANGRIA" | "SUPRIMENTO", formData: FormData) {
  const session = await auth();
  if (!session?.user) return { erro: "Não autenticado." };

  const sessaoAtual = await sessaoAberta();
  if (!sessaoAtual) return { erro: "Não há caixa aberto no momento." };

  const validacao = movimentoCaixaSchema.safeParse(Object.fromEntries(formData));
  if (!validacao.success) return { erro: validacao.error.issues[0].message };
  if (await estaEmModoDemo()) return { sucesso: true, demo: true };

  const userId = (session.user as any).id;
  const movimento = await prisma.cashMovement.create({
    data: { sessionId: sessaoAtual.id, type: tipo, amount: validacao.data.amount, motivo: validacao.data.motivo || null, createdById: userId },
  });

  revalidatePath("/caixa");
  return { sucesso: true, movimentoId: movimento.id };
}

export async function registrarSangria(formData: FormData) {
  return registrarMovimento("SANGRIA", formData);
}

export async function registrarSuprimento(formData: FormData) {
  return registrarMovimento("SUPRIMENTO", formData);
}
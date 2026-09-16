"use server";

import { auth } from "@/auth";
import { calcularFechamentoSessao } from "@/lib/caixaSessao";

export async function consultarPreviaFechamento(sessionId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  return calcularFechamentoSessao(sessionId);
}
"use server";

import { buscarCartaoSomenteLeitura, marcarCartao } from "@/lib/fidelidade";
import { auth } from "@/auth";

export async function consultarCartaoAction(clienteNome: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  if (!clienteNome.trim()) return null;
  return buscarCartaoSomenteLeitura(clienteNome);
}

export async function marcarCartaoAction(clienteNome: string, codigoDigitado: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");

  if (codigoDigitado.trim().toLowerCase() !== "bc") {
    return { erro: "Código incorreto." };
  }

  const resultado = await marcarCartao(clienteNome);
  return { sucesso: true, ...resultado };
}
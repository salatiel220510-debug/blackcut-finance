"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { verificarPermissao } from "@/lib/permissoes";

async function verificarDono() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    throw new Error("Acesso negado.");
  }
}

export async function editarCartaoFidelidade(id: string, formData: FormData) {
  await verificarPermissao("verFidelidadeGestao");
  const marcasAtuais = parseInt(formData.get("marcasAtuais") as string, 10);
  const cartoesCompletos = parseInt(formData.get("cartoesCompletos") as string, 10);

  if (isNaN(marcasAtuais) || marcasAtuais < 0 || marcasAtuais > 9) {
    return { erro: "Marcas atuais deve ser um número entre 0 e 9." };
  }
  if (isNaN(cartoesCompletos) || cartoesCompletos < 0) {
    return { erro: "Cartões completos inválido." };
  }

  await prisma.loyaltyCard.update({ where: { id }, data: { marcasAtuais, cartoesCompletos } });
  revalidatePath("/admin/fidelidade");
  return { sucesso: true };
}

export async function excluirCartaoFidelidade(id: string) {
  await verificarDono();
  await prisma.loyaltyCard.delete({ where: { id } });
  revalidatePath("/admin/fidelidade");
}
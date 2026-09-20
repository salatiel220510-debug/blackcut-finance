"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { fecharMes } from "@/lib/fechamentoMensal";
import { verificarPermissao } from "@/lib/permissoes";

async function verificarDono() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    throw new Error("Acesso negado.");
  }
}

export async function fecharMesManual(formData: FormData) {
  await verificarPermissao("verFechamentoMensal");

  const mesString = formData.get("mes") as string;
  if (!mesString) return { erro: "Selecione um mês." };

  const [anoStr, mesStr] = mesString.split("-");
  const ano = parseInt(anoStr, 10);
  const mesIndex0 = parseInt(mesStr, 10) - 1;

  const agora = new Date();
  if (ano > agora.getUTCFullYear() || (ano === agora.getUTCFullYear() && mesIndex0 >= agora.getUTCMonth())) {
    return { erro: "Só é possível fechar meses já concluídos." };
  }

  try {
    await fecharMes(ano, mesIndex0);
  } catch (e: any) {
    return { erro: e.message || "Erro ao fechar o mês." };
  }

  revalidatePath("/admin/fechamento");
  return { sucesso: true };
}
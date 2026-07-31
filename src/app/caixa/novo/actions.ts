"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { enviarPushParaDonos } from "@/lib/push";

export async function registrarTransacao(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { erro: "Você precisa estar logado." };

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  const type = formData.get("type") as "INCOME" | "EXPENSE";
  const category = formData.get("category") as string;
  const description = (formData.get("description") as string) || null;
  const amountRaw = formData.get("amount") as string;
  const amount = parseFloat((amountRaw || "").replace(",", "."));

  if (!type || !category || !amountRaw || isNaN(amount) || amount <= 0) {
    return { erro: "Preencha todos os campos corretamente." };
  }

  if (role === "BARBER" && type !== "INCOME") {
    return { erro: "Barbeiros só podem lançar serviços realizados." };
  }

  let barberId: string | null = null;

  if (type === "INCOME") {
    if (role === "BARBER") {
      barberId = userId;
    } else if (role === "OWNER") {
      const barberIdForm = formData.get("barberId") as string;
      if (!barberIdForm) return { erro: "Selecione o barbeiro responsável pelo serviço." };
      barberId = barberIdForm;
    }
  }

  let commissionPercentage: number | null = null;
  let commissionAmount: number | null = null;

  if (type === "INCOME" && barberId) {
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    const percentual = settings ? Number(settings.commissionPercentage) : 40;
    commissionPercentage = percentual;
    commissionAmount = Number((amount * (percentual / 100)).toFixed(2));
  }

  await prisma.transaction.create({
    data: { type, category, description, amount, barberId, commissionPercentage, commissionAmount, createdById: userId },
  });

  if (role === "BARBER") {
    const nomeUsuario = session.user?.name;
    const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    after(async () => {
      await enviarPushParaDonos({
        title: "Novo lançamento no caixa",
        body: `${nomeUsuario} registrou ${category} — ${formatar(amount)}`,
      }).catch((e) => console.error("[push] erro ao notificar:", e));
    });
  }

  revalidatePath("/caixa");
  return { sucesso: true };
}
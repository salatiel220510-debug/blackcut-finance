import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { pushSubscribeSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const body = await req.json();
  const validacao = pushSubscribeSchema.safeParse(body);

  if (!validacao.success) {
    return NextResponse.json({ erro: "Dados de inscrição inválidos" }, { status: 400 });
  }

  const { endpoint, keys } = validacao.data;
  const userId = (session.user as any).id;

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId, p256dh: keys.p256dh, auth: keys.auth },
    create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
  });

  return NextResponse.json({ ok: true });
}
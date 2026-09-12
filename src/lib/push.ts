import webpush from "web-push";
import { prisma } from "@/lib/prisma";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

async function enviarParaSubscriptions(userIds: string[], payload: { title: string; body: string }) {
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId: { in: userIds } } });

  const resultados = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    )
  );

  for (let i = 0; i < resultados.length; i++) {
    const r = resultados[i];
    if (r.status === "rejected") {
      const codigo = (r.reason as any)?.statusCode;
      if (codigo === 404 || codigo === 410) {
        await prisma.pushSubscription.delete({ where: { id: subscriptions[i].id } }).catch(() => {});
      }
    }
  }
}

export async function enviarPushParaDonos(payload: { title: string; body: string }) {
  const donos = await prisma.user.findMany({ where: { role: "OWNER" } });
  await enviarParaSubscriptions(donos.map((d) => d.id), payload);
}

export async function enviarPushParaTodosAprovados(payload: { title: string; body: string }) {
  const usuarios = await prisma.user.findMany({ where: { status: "APPROVED" } });
  await enviarParaSubscriptions(usuarios.map((u) => u.id), payload);
}

export async function enviarPushParaUsuario(userId: string, payload: { title: string; body: string }) {
  await enviarParaSubscriptions([userId], payload);
}
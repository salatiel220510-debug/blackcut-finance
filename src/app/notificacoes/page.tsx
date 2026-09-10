import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import FormNotificacao from "./form";
import BotaoExcluirNotificacao from "@/components/BotaoExcluirNotificacao";

export default async function NotificacoesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role;

  const notificacoes = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { createdBy: { select: { name: true } } },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        <h1 className="font-display text-2xl text-gold mb-6">Avisos</h1>

        {role === "OWNER" && <FormNotificacao />}

        {notificacoes.length === 0 && <p className="text-gray-400 text-sm">Nenhum aviso ainda.</p>}
        <div className="flex flex-col gap-3">
          {notificacoes.map((n) => (
            <div key={n.id} className="border border-gold-dark/40 bg-black-soft rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <strong className="text-gold">{n.title}</strong>
                <span className="text-gray-500 text-xs">{new Date(n.createdAt).toLocaleString("pt-BR")}</span>
              </div>
              <p className="text-white text-sm mb-2">{n.body}</p>

              {n.linkUrl && (
                <a
                  href={n.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-gold/10 border border-gold text-gold text-sm font-semibold rounded-lg px-3 py-1.5 mb-2 hover:bg-gold/20 transition-colors"
                >
                  🔗 {n.linkLabel || "Abrir link"}
                </a>
              )}

              <div className="flex items-center justify-between">
                <p className="text-gray-500 text-xs">por {n.createdBy.name}</p>
                {role === "OWNER" && <BotaoExcluirNotificacao id={n.id} />}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer role={role} />
    </div>
  );
}
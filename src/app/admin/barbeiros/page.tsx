import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import { PERMISSOES_PADRAO, ChavePermissao } from "@/lib/permissoesTipos";
import CardBarbeiro from "./CardBarbeiro";

export default async function BarbeirosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as any).role !== "OWNER") redirect("/");

  const barbeiros = await prisma.user.findMany({
    where: { role: "BARBER", status: "APPROVED" },
    orderBy: { name: "asc" },
  });

  const dados = barbeiros.map((b) => ({
    id: b.id,
    name: b.name,
    email: b.email,
    permissoes: { ...PERMISSOES_PADRAO, ...((b.permissions as Record<string, boolean> | null) ?? {}) } as Record<ChavePermissao, boolean>,
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        <h1 className="font-display text-2xl text-gold mb-1">Barbeiros</h1>
        <p className="text-gray-400 text-sm mb-6">Toque em um card para ver permissões, redefinir senha ou remover o acesso.</p>

        {dados.length === 0 && <p className="text-gray-400 text-sm">Nenhum barbeiro aprovado ainda.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dados.map((b) => <CardBarbeiro key={b.id} barbeiro={b} />)}
        </div>
      </main>
      <Footer role="OWNER" />
    </div>
  );
}
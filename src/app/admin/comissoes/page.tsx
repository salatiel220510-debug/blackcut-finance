import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { comissaoPendenteBarbeiro } from "@/lib/comissoesPendentes";
import FormComissao from "./form";

export default async function ComissoesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as any).role !== "OWNER") redirect("/");

  const nome = session.user?.name ?? "";

  const barbeiros = await prisma.user.findMany({
    where: { role: "BARBER", status: "APPROVED" },
    orderBy: { name: "asc" },
  });

  const pendentes = await Promise.all(
    barbeiros.map(async (b) => ({ id: b.id, name: b.name, pendente: await comissaoPendenteBarbeiro(b.id) }))
  );

  const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="min-h-screen flex flex-row">
      <Navbar role="OWNER" nome={nome} />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
          <h1 className="font-display text-2xl text-gold mb-6">Comissões dos Barbeiros</h1>
          {pendentes.length === 0 && <p className="text-gray-400">Nenhum barbeiro aprovado ainda.</p>}
          <div className="flex flex-col gap-4">
            {pendentes.map((b) => (
              <div key={b.id} className="border border-gold-dark/40 bg-black-soft rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <strong className="text-white">{b.name}</strong>
                  <span className={`font-bold ${b.pendente > 0 ? "text-gold" : "text-gray-500"}`}>{formatar(b.pendente)}</span>
                </div>
                <FormComissao barberId={b.id} pendente={b.pendente} />
              </div>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
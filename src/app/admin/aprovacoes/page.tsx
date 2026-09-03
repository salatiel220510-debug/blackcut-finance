import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import { aprovarBarbeiro, rejeitarBarbeiro } from "./actions";

export default async function AprovacoesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as any).role !== "OWNER") redirect("/");

  const pendentes = await prisma.user.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        <h1 className="font-display text-2xl text-gold mb-6">Aprovações Pendentes</h1>
        {pendentes.length === 0 && <p className="text-gray-400">Nenhuma solicitação pendente.</p>}
        <div className="flex flex-col gap-3">
          {pendentes.map((barbeiro) => (
            <div key={barbeiro.id} className="border border-gold-dark/40 bg-black-soft rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-white font-semibold">{barbeiro.name}</p>
                <p className="text-gray-400 text-sm">{barbeiro.email}</p>
              </div>
              <div className="flex gap-2">
                <form action={aprovarBarbeiro.bind(null, barbeiro.id)}>
                  <button type="submit" className="bg-gold text-black-deep font-semibold rounded-full px-4 py-1.5 text-sm hover:bg-gold-light transition-colors">
                    Aprovar
                  </button>
                </form>
                <form action={rejeitarBarbeiro.bind(null, barbeiro.id)}>
                  <button type="submit" className="border border-red-400 text-red-400 font-semibold rounded-full px-4 py-1.5 text-sm hover:bg-red-400 hover:text-black-deep transition-colors">
                    Rejeitar
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer role="OWNER" />
    </div>
  );
}
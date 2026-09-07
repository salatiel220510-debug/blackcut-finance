import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import TabelaFidelidade from "./form";

export default async function FidelidadePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as any).role !== "OWNER") redirect("/");

  const cartoes = await prisma.loyaltyCard.findMany({ orderBy: { updatedAt: "desc" } });

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <h1 className="font-display text-2xl text-gold mb-6">Cartões Fidelidade</h1>
        {cartoes.length === 0 && <p className="text-gray-400">Nenhum cartão registrado ainda.</p>}
        <TabelaFidelidade
          cartoes={cartoes.map((c) => ({ id: c.id, clienteNome: c.clienteNome, marcasAtuais: c.marcasAtuais, cartoesCompletos: c.cartoesCompletos }))}
        />
      </main>
      <Footer role="OWNER" />
    </div>
  );
}
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ConfiguracoesForm from "./form";

export default async function ConfiguracoesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as any).role !== "OWNER") redirect("/");

  const nome = session.user?.name ?? "";
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const servicos = await prisma.serviceType.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar role="OWNER" nome={nome} />
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        <h1 className="font-display text-2xl text-gold mb-6">Configurações</h1>
        <ConfiguracoesForm
          comissaoAtual={settings ? Number(settings.commissionPercentage) : 40}
          saldoAtual={settings ? Number(settings.saldoBancario) : 0}
          servicos={servicos.map((s) => ({
            id: s.id,
            name: s.name,
            price: s.price ? Number(s.price) : null,
            active: s.active,
            discountPercentage: s.discountPercentage ? Number(s.discountPercentage) : null,
            discountValidUntil: s.discountValidUntil ? s.discountValidUntil.toISOString() : null,
          }))}
        />
        <Footer />
      </main>
    </div>
  );
}
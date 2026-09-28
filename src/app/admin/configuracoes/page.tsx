import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import ConfiguracoesForm from "./form";

export default async function ConfiguracoesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as any).role !== "OWNER") redirect("/");

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const servicos = await prisma.serviceType.findMany({ orderBy: { name: "asc" } });
  const categorias = await prisma.expenseCategory.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        <h1 className="font-display text-2xl text-gold mb-6">Configurações</h1>
        <ConfiguracoesForm
          comissaoAtual={settings ? Number(settings.commissionPercentage) : 40}
          saldoAtual={settings ? Number(settings.saldoBancario) : 0}
          envelopes={{
            operacional: settings ? Number(settings.envelopeOperacionalPct) : 60,
            proLabore: settings ? Number(settings.envelopeProLaborePct) : 30,
            reserva: settings ? Number(settings.envelopeReservaPct) : 10,
          }}
          metas={{
            proLabore: settings?.proLaboreMeta ? Number(settings.proLaboreMeta) : null,
            reserva: settings?.reservaMeta ? Number(settings.reservaMeta) : null,
          }}
          taxas={{
            pix: settings ? Number(settings.taxaPix) : 0,
            debito: settings ? Number(settings.taxaDebito) : 0,
            credito: settings ? Number(settings.taxaCredito) : 0,
          }}
          servicos={servicos.map((s) => ({
            id: s.id,
            name: s.name,
            price: s.price ? Number(s.price) : null,
            active: s.active,
            discountPercentage: s.discountPercentage ? Number(s.discountPercentage) : null,
            discountValidUntil: s.discountValidUntil ? s.discountValidUntil.toISOString() : null,
          }))}
          categorias={categorias.map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type,
            budgetLimit: c.budgetLimit ? Number(c.budgetLimit) : null,
            active: c.active,
          }))}
        />
      </main>
      <Footer role="OWNER" />
    </div>
  );
}
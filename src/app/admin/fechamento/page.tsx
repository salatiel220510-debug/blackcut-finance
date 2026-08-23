import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { calcularFechamento } from "@/lib/fechamentoMensal";
import FormFechamento from "./form";

export default async function FechamentoPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as any).role !== "OWNER") redirect("/");

  const nome = session.user?.name ?? "";
  const agora = new Date();
  const previa = await calcularFechamento(agora.getUTCFullYear(), agora.getUTCMonth());

  const historico = await prisma.monthlyClosure.findMany({
    orderBy: { mes: "desc" },
    take: 12,
  });

  const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="min-h-screen flex flex-row">
      <Navbar role="OWNER" nome={nome} />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
          <h1 className="font-display text-2xl text-gold mb-6">Fechamento Mensal</h1>

          <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-5 mb-8">
            <h2 className="font-display text-lg text-gold mb-1">
              Prévia do mês atual ({agora.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })})
            </h2>
            <p className="text-gray-400 text-xs mb-4">Calculado em tempo real — ainda não foi fechado.</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Item label="Faturamento bruto" valor={formatar(previa.faturamentoBruto)} />
              <Item label="Despesas totais" valor={formatar(previa.totalDespesas)} />
              <Item label="Comissões" valor={formatar(previa.totalComissoes)} />
              <Item label="Lucro líquido" valor={formatar(previa.lucroLiquido)} destaque />
              <Item label="Envelope Operacional" valor={formatar(previa.envelopeOperacional)} />
              <Item label="Envelope Pró-labore" valor={formatar(previa.envelopeProLabore)} />
              <Item label="Envelope Reserva" valor={formatar(previa.envelopeReserva)} />
            </div>
          </section>

          <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-5 mb-8">
            <h2 className="font-display text-lg text-gold mb-3">Fechar um mês concluído</h2>
            <FormFechamento />
          </section>

          <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-5">
            <h2 className="font-display text-lg text-gold mb-3">Histórico de Fechamentos</h2>
            {historico.length === 0 && <p className="text-gray-400 text-sm">Nenhum fechamento realizado ainda.</p>}
            <div className="flex flex-col gap-3">
              {historico.map((f) => (
                <div key={f.id} className="border border-gold-dark/20 rounded-lg p-3">
                  <p className="text-white font-semibold mb-1">
                    {new Date(f.mes).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                    <span>Faturamento: <span className="text-white">{formatar(Number(f.faturamentoBruto))}</span></span>
                    <span>Lucro líquido: <span className="text-gold">{formatar(Number(f.lucroLiquido))}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </div>
  );
}

function Item({ label, valor, destaque }: { label: string; valor: string; destaque?: boolean }) {
  return (
    <div className={`border rounded-lg p-3 ${destaque ? "border-gold bg-gold/10" : "border-gold-dark/20"}`}>
      <p className="text-gray-400 text-xs">{label}</p>
      <p className={`font-bold ${destaque ? "text-gold" : "text-white"}`}>{valor}</p>
    </div>
  );
}
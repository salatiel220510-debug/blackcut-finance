import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { calcularFechamento } from "@/lib/fechamentoMensal";
import {
  despesasPorCategoriaMes,
  evolucaoUltimosMeses,
  statusOrcamentoCategorias,
  envelopesAcumulados,
} from "@/lib/dashboardFinanceiro";
import GraficoPizzaDespesas from "@/components/GraficoPizzaDespesas";
import GraficoEvolucaoMensal from "@/components/GraficoEvolucaoMensal";
import BarraProgresso from "@/components/BarraProgresso";
import FormFechamento from "./form";

export default async function FechamentoPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as any).role !== "OWNER") redirect("/");

  const nome = session.user?.name ?? "";
  const agora = new Date();

  const [previa, despesasPorCategoria, evolucao, orcamentos, acumulados, settings, historico] = await Promise.all([
    calcularFechamento(agora.getUTCFullYear(), agora.getUTCMonth()),
    despesasPorCategoriaMes(agora.getUTCFullYear(), agora.getUTCMonth()),
    evolucaoUltimosMeses(6),
    statusOrcamentoCategorias(),
    envelopesAcumulados(),
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.monthlyClosure.findMany({ orderBy: { mes: "desc" }, take: 12 }),
  ]);

  const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const categoriasAlerta = orcamentos.filter((o) => o.status !== "ok");

  return (
    <div className="min-h-screen flex flex-row">
      <Navbar role="OWNER" nome={nome} />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
          <h1 className="font-display text-2xl text-gold mb-6">Fechamento Mensal</h1>

          {categoriasAlerta.length > 0 && (
            <div className="border border-red-400/50 bg-red-400/10 rounded-xl p-4 mb-6">
              <p className="text-red-300 font-semibold text-sm mb-2">⚠️ Alerta de orçamento</p>
              <div className="flex flex-col gap-1">
                {categoriasAlerta.map((c) => (
                  <p key={c.id} className="text-red-200 text-xs">
                    {c.nome}: {formatar(c.gasto)} de {formatar(c.limite)} ({c.percentual.toFixed(0)}%) — {c.status === "estourado" ? "orçamento estourado" : "próximo do limite"}
                  </p>
                ))}
              </div>
            </div>
          )}

          <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display text-lg text-gold">
                Prévia — {agora.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
              </h2>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${previa.lucroLiquido >= 0 ? "bg-green-400/20 text-green-400" : "bg-red-400/20 text-red-400"}`}>
                {previa.lucroLiquido >= 0 ? "Lucro" : "Prejuízo"}
              </span>
            </div>
            <p className="text-gray-400 text-xs mb-4">Calculado em tempo real — ainda não foi fechado.</p>

            <div className="mb-4">
              <p className="text-gray-400 text-xs uppercase tracking-wide">Faturamento Bruto</p>
              <p className="text-3xl font-bold text-gold">{formatar(previa.faturamentoBruto)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <Item label="Despesas totais" valor={formatar(previa.totalDespesas)} />
              <Item label="Comissões" valor={formatar(previa.totalComissoes)} />
              <Item label="Lucro líquido" valor={formatar(previa.lucroLiquido)} destaque />
              <Item label="Envelope Operacional" valor={formatar(previa.envelopeOperacional)} />
              <Item label="Envelope Pró-labore" valor={formatar(previa.envelopeProLabore)} />
              <Item label="Envelope Reserva" valor={formatar(previa.envelopeReserva)} />
            </div>
          </section>

          <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-5 mb-6">
            <h2 className="font-display text-lg text-gold mb-3">Despesas por Categoria (mês atual)</h2>
            <GraficoPizzaDespesas dados={despesasPorCategoria} />
          </section>

          <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-5 mb-6">
            <h2 className="font-display text-lg text-gold mb-3">Evolução — Últimos 6 Meses</h2>
            <GraficoEvolucaoMensal dados={evolucao} />
          </section>

          <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-5 mb-6">
            <h2 className="font-display text-lg text-gold mb-4">Progresso das Metas (acumulado)</h2>
            <div className="flex flex-col gap-4">
              <BarraProgresso label="Pró-labore" valor={acumulados.proLabore} meta={settings?.proLaboreMeta ? Number(settings.proLaboreMeta) : null} />
              <BarraProgresso label="Reserva" valor={acumulados.reserva} meta={settings?.reservaMeta ? Number(settings.reservaMeta) : null} />
            </div>
          </section>

          <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-5 mb-6">
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
        <Footer role="OWNER" />
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
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
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
import ItemFechamentoHistorico from "./ItemFechamentoHistorico";

export default async function FechamentoPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as any).role !== "OWNER") redirect("/");

  const agora = new Date();

  const [previa, despesasPorCategoria, evolucao, orcamentos, acumulados, settings, historico, entradasTotalAgg, saidasTotalAgg, comissoesAgg] = await Promise.all([
    calcularFechamento(agora.getUTCFullYear(), agora.getUTCMonth()),
    despesasPorCategoriaMes(agora.getUTCFullYear(), agora.getUTCMonth()),
    evolucaoUltimosMeses(6),
    statusOrcamentoCategorias(),
    envelopesAcumulados(),
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.monthlyClosure.findMany({ orderBy: { mes: "desc" }, take: 12 }),
    prisma.transaction.aggregate({ where: { type: "INCOME", deletedAt: null }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "EXPENSE", deletedAt: null }, _sum: { amount: true } }),
    prisma.transaction.aggregate({
      where: { type: "INCOME", deletedAt: null, commissionAmount: { not: null }, commissionSettled: false },
      _sum: { commissionAmount: true },
    }),
  ]);

  const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const categoriasAlerta = orcamentos.filter((o) => o.status !== "ok");

  const fundosAcumulados = Number(entradasTotalAgg._sum.amount ?? 0) - Number(saidasTotalAgg._sum.amount ?? 0) - Number(comissoesAgg._sum.commissionAmount ?? 0);
  const saldoBancario = settings ? Number(settings.saldoBancario) : 0;
  const diferenca = fundosAcumulados - saldoBancario;

  return (
    <div className="min-h-screen flex flex-col">
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
          <h2 className="font-display text-lg text-gold mb-3">Fundos da Barbearia</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gold-dark/20">
                <td className="py-2 text-gray-400">Fundos acumulados (calculado)</td>
                <td className="py-2 text-right font-bold text-gold">{formatar(fundosAcumulados)}</td>
              </tr>
              <tr className="border-b border-gold-dark/20">
                <td className="py-2 text-gray-400">Saldo bancário informado</td>
                <td className="py-2 text-right font-bold text-white">{formatar(saldoBancario)}</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-400">Diferença</td>
                <td className={`py-2 text-right font-bold ${Math.abs(diferenca) < 0.01 ? "text-green-400" : "text-red-400"}`}>
                  {formatar(diferenca)}
                </td>
              </tr>
            </tbody>
          </table>
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
          <p className="text-gray-500 text-xs mb-3">Toque em um mês para ver os lançamentos detalhados.</p>
          {historico.length === 0 && <p className="text-gray-400 text-sm">Nenhum fechamento realizado ainda.</p>}
          <div className="flex flex-col gap-3">
            {historico.map((f) => (
              <ItemFechamentoHistorico
                key={f.id}
                mesLabel={new Date(f.mes).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })}
                ano={new Date(f.mes).getUTCFullYear()}
                mesIndex0={new Date(f.mes).getUTCMonth()}
                faturamentoBruto={Number(f.faturamentoBruto)}
                lucroLiquido={Number(f.lucroLiquido)}
              />
            ))}
          </div>
        </section>
      </main>
      <Footer role="OWNER" />
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
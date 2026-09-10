import SplashHome from "@/components/SplashHome";
import Footer from "@/components/Footer";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import GraficoLinhaCaixa from "@/components/GraficoLinhaCaixa";
import GraficoComparacaoGastosServicos from "@/components/GraficoComparacaoGastosServicos";
import IconeSino from "@/components/IconeSino";
import { serieUltimosDias } from "@/lib/dashboardData";
import { evolucaoUltimosMeses } from "@/lib/dashboardFinanceiro";
import { calcularFechamento } from "@/lib/fechamentoMensal";
import { limitesDoMesEspecifico } from "@/lib/datasBrasil";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  const nome = session.user?.name ?? "";

  const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (role === "BARBER") {
    const agora = new Date();
    const { inicio, fimExclusivo } = limitesDoMesEspecifico(agora.getUTCFullYear(), agora.getUTCMonth());

    const agg = await prisma.transaction.aggregate({
      where: { barberId: userId, type: "INCOME", deletedAt: null, date: { gte: inicio, lt: fimExclusivo } },
      _sum: { commissionAmount: true, amount: true },
      _count: true,
    });

    const totalComissao = Number(agg._sum.commissionAmount ?? 0);
    const totalGerado = Number(agg._sum.amount ?? 0);
    const serie = await serieUltimosDias(14, { barberId: userId });

    return (
      <div className="min-h-screen flex flex-col">
        <SplashHome />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-1">
            <h1 className="font-display text-2xl text-gold">Bem-vindo, {nome}</h1>
            <Link href="/notificacoes" title="Avisos" className="text-gold-dark hover:text-gold">
              <IconeSino size={26} />
            </Link>
          </div>
          <p className="text-gray-400 mb-8">Resumo do seu desempenho na BlackCut — mês atual.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <Card titulo="Comissão do mês" valor={formatar(totalComissao)} destaque />
            <Card titulo="Total gerado (mês)" valor={formatar(totalGerado)} />
            <Card titulo="Serviços (mês)" valor={String(agg._count)} />
          </div>

          <div className="border border-gold-dark/40 bg-black-soft rounded-xl p-4 mb-10">
            <h2 className="font-display text-lg text-gold mb-3">Últimos 14 dias</h2>
            <GraficoLinhaCaixa dados={serie} mostrarComissao />
          </div>

          <div className="flex flex-wrap gap-3">
            <BotaoGrande href="/caixa/comanda/nova" label="Registrar Serviço" />
            <BotaoGrande href="/caixa" label="Ver Fluxo de Caixa" />
          </div>
        </main>
        <Footer role={role} />
      </div>
    );
  }

  const agora = new Date();

  const [previaMes, entradasTotalAgg, saidasTotalAgg, comissoesAgg, settings, pendentesCount, serie, evolucaoMeses] = await Promise.all([
    calcularFechamento(agora.getUTCFullYear(), agora.getUTCMonth()),
    prisma.transaction.aggregate({ where: { type: "INCOME", deletedAt: null }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "EXPENSE", deletedAt: null }, _sum: { amount: true } }),
    prisma.transaction.aggregate({
      where: { type: "INCOME", deletedAt: null, commissionAmount: { not: null }, commissionSettled: false },
      _sum: { commissionAmount: true },
    }),
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.user.count({ where: { status: "PENDING" } }),
    serieUltimosDias(14),
    evolucaoUltimosMeses(6),
  ]);

  const entradasMes = previaMes.faturamentoBruto;
  const saidasMes = previaMes.totalDespesas;
  const totalComissoesPendentes = Number(comissoesAgg._sum.commissionAmount ?? 0);

  const totalEntradasGeral = Number(entradasTotalAgg._sum.amount ?? 0);
  const totalSaidasGeral = Number(saidasTotalAgg._sum.amount ?? 0);
  const fundosAcumulados = totalEntradasGeral - totalSaidasGeral - totalComissoesPendentes;
  const saldoBancario = settings ? Number(settings.saldoBancario) : 0;
  const diferenca = fundosAcumulados - saldoBancario;

  return (
    <div className="min-h-screen flex flex-col">
      <SplashHome />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display text-2xl text-gold">Bem-vindo, {nome}</h1>
          <Link href="/notificacoes" title="Avisos" className="text-gold-dark hover:text-gold">
            <IconeSino size={26} />
          </Link>
        </div>
        <p className="text-gray-400 mb-8">Visão geral do negócio — mês atual.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card titulo="Entradas (mês)" valor={formatar(entradasMes)} />
          <Card titulo="Saídas (mês)" valor={formatar(saidasMes)} />
          <Card titulo="Comissões pendentes" valor={formatar(totalComissoesPendentes)} />
          <Card titulo="Serviços Registrados Mensalmente" valor={formatar(entradasMes - saidasMes)} destaque />
        </div>

        <div className="border border-gold-dark/40 bg-black-soft rounded-xl p-4 mb-8">
          <h2 className="font-display text-lg text-gold mb-3">Fundos x Saldo Bancário</h2>
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
        </div>

        {pendentesCount > 0 && (
          <Link
            href="/admin/aprovacoes"
            className="block mb-8 border border-gold rounded-lg px-4 py-3 text-gold bg-gold/10 hover:bg-gold/20 transition-colors"
          >
            {pendentesCount} conta{pendentesCount > 1 ? "s" : ""} de barbeiro aguardando aprovação →
          </Link>
        )}

        <div className="border border-gold-dark/40 bg-black-soft rounded-xl p-4 mb-6">
          <h2 className="font-display text-lg text-gold mb-3">Últimos 14 dias</h2>
          <GraficoLinhaCaixa dados={serie} />
        </div>

        <div className="border border-gold-dark/40 bg-black-soft rounded-xl p-4 mb-10">
          <h2 className="font-display text-lg text-gold mb-3">Serviços x Gastos (últimos 6 meses)</h2>
          <GraficoComparacaoGastosServicos
            dados={evolucaoMeses.map((e) => ({ mes: e.mes, servicos: e.faturamento, gastos: e.despesas }))}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <BotaoGrande href="/caixa/comanda/nova" label="Novo Lançamento" />
          <BotaoGrande href="/caixa" label="Ver Fluxo de Caixa" />
          <BotaoGrande href="/admin/configuracoes" label="Preços & Comissão" />
        </div>
      </main>
      <Footer role={role} />
    </div>
  );
}

function Card({ titulo, valor, destaque }: { titulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className={`border rounded-xl p-4 ${destaque ? "border-gold bg-gold/10" : "border-gold-dark/40 bg-black-soft"}`}>
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{titulo}</p>
      <p className={`text-xl font-bold ${destaque ? "text-gold" : "text-white"}`}>{valor}</p>
    </div>
  );
}

function BotaoGrande({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex-1 min-w-[140px] text-center bg-black-soft border border-gold-dark hover:border-gold hover:bg-gold hover:text-black-deep transition-colors rounded-lg py-4 px-4 font-semibold text-gold"
    >
      {label}
    </Link>
  );
}
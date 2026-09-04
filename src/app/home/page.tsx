import SplashHome from "@/components/SplashHome";
import Footer from "@/components/Footer";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import GraficoLinhaCaixa from "@/components/GraficoLinhaCaixa";
import GraficoComparacaoGastosServicos from "@/components/GraficoComparacaoGastosServicos";
import { serieUltimosDias } from "@/lib/dashboardData";
import { evolucaoUltimosMeses } from "@/lib/dashboardFinanceiro";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  const nome = session.user?.name ?? "";

  const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (role === "BARBER") {
    const agg = await prisma.transaction.aggregate({
      where: { barberId: userId, type: "INCOME", deletedAt: null },
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
          <h1 className="font-display text-2xl text-gold mb-1">Bem-vindo, {nome}</h1>
          <p className="text-gray-400 mb-8">Resumo do seu desempenho na BlackCut.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <Card titulo="Comissão acumulada" valor={formatar(totalComissao)} destaque />
            <Card titulo="Total gerado" valor={formatar(totalGerado)} />
            <Card titulo="Serviços realizados" valor={String(agg._count)} />
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

  const [entradasAgg, saidasAgg, comissoesAgg, pendentesCount, serie, evolucaoMeses] = await Promise.all([
    prisma.transaction.aggregate({ where: { type: "INCOME", deletedAt: null }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "EXPENSE", deletedAt: null }, _sum: { amount: true } }),
    prisma.transaction.aggregate({
      where: { type: "INCOME", deletedAt: null, commissionAmount: { not: null }, commissionSettled: false },
      _sum: { commissionAmount: true },
    }),
    prisma.user.count({ where: { status: "PENDING" } }),
    serieUltimosDias(14),
    evolucaoUltimosMeses(6),
  ]);

  const totalEntradas = Number(entradasAgg._sum.amount ?? 0);
  const totalSaidas = Number(saidasAgg._sum.amount ?? 0);
  const totalComissoes = Number(comissoesAgg._sum.commissionAmount ?? 0);
  const lucro = totalEntradas - totalSaidas - totalComissoes;

  return (
    <div className="min-h-screen flex flex-col">
      <SplashHome />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <h1 className="font-display text-2xl text-gold mb-1">Bem-vindo, {nome}</h1>
        <p className="text-gray-400 mb-8">Visão geral do negócio.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <Card titulo="Entradas" valor={formatar(totalEntradas)} />
          <Card titulo="Saídas" valor={formatar(totalSaidas)} />
          <Card titulo="Comissões pendentes" valor={formatar(totalComissoes)} />
          <Card titulo="Fundos da Barbearia" valor={formatar(lucro)} destaque />
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
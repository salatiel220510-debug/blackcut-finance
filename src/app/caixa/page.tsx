import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeletorData from "@/components/SeletorData";
import ListaTransacoesDia, { TransacaoView } from "@/components/ListaTransacoesDia";
import { limitesDoDiaEspecifico, hojeBrasilString } from "@/lib/datasBrasil";

export default async function CaixaPage({ searchParams }: { searchParams: Promise<{ data?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  const nome = session.user?.name ?? "";

  const params = await searchParams;
  const dataSelecionada = params.data || hojeBrasilString();
  const { inicio, fim } = limitesDoDiaEspecifico(dataSelecionada);

  const [entradasAgg, saidasAgg, comissoesAgg, settings, transacoesDoDia] = await Promise.all([
    prisma.transaction.aggregate({ where: { type: "INCOME", deletedAt: null }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "EXPENSE", deletedAt: null }, _sum: { amount: true } }),
   prisma.transaction.aggregate({
  where: { type: "INCOME", deletedAt: null, commissionAmount: { not: null }, commissionSettled: false },
  _sum: { commissionAmount: true },
})
  ,
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.transaction.findMany({
      where: { deletedAt: null, date: { gte: inicio, lte: fim } },
      orderBy: { date: "desc" },
      include: { barber: { select: { name: true } }, createdBy: { select: { name: true } } },
    }),
  ]);

  const totalEntradas = Number(entradasAgg._sum.amount ?? 0);
  const totalSaidas = Number(saidasAgg._sum.amount ?? 0);
  const totalComissoes = Number(comissoesAgg._sum.commissionAmount ?? 0);
  const saldo = totalEntradas - totalSaidas;
  const fundosAcumulados = totalEntradas - totalSaidas - totalComissoes;
  const saldoBancario = settings ? Number(settings.saldoBancario) : 0;

  const paraView = (t: (typeof transacoesDoDia)[number]): TransacaoView => ({
    id: t.id,
    type: t.type,
    category: t.category,
    description: t.description,
    amount: Number(t.amount),
    date: t.date.toISOString(),
    barberNome: t.barber?.name ?? null,
    commissionAmount: t.commissionAmount ? Number(t.commissionAmount) : null,
    paymentMethod: t.paymentMethod,
    clienteNome: t.clienteNome,
    comandaId: t.comandaId,
    criadoPorNome: t.createdBy.name,
    podeExcluir: role === "OWNER" || t.createdById === userId,
  });

  const transacoesView = transacoesDoDia.map(paraView);
  const servicosDoDia = transacoesView.filter((t) => t.type === "INCOME");
  const gastosDoDia = transacoesView.filter((t) => t.type === "EXPENSE");

  const comandaIds = [...new Set(transacoesView.filter((t) => t.comandaId).map((t) => t.comandaId as string))];
  const itensComandas = comandaIds.length
    ? await prisma.transaction.findMany({
        where: { comandaId: { in: comandaIds }, deletedAt: null },
        include: { barber: { select: { name: true } }, createdBy: { select: { name: true } } },
      })
    : [];

  const itensPorComanda: Record<string, TransacaoView[]> = {};
  for (const item of itensComandas.map(paraView)) {
    if (!item.comandaId) continue;
    if (!itensPorComanda[item.comandaId]) itensPorComanda[item.comandaId] = [];
    itensPorComanda[item.comandaId].push(item);
  }

  const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="min-h-screen flex flex-row">
      <Navbar role={role} nome={nome} />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
          <h1 className="font-display text-2xl text-gold mb-6">Fluxo de Caixa</h1>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <Card titulo="Entradas (total)" valor={formatar(totalEntradas)} />
            <Card titulo="Saídas (total)" valor={formatar(totalSaidas)} />
            <Card titulo="Saldo" valor={formatar(saldo)} destaque={saldo >= 0} negativo={saldo < 0} />
            <Card titulo="Comissões" valor={formatar(totalComissoes)} />
          </div>

          <div className="border border-gold-dark/40 bg-black-soft rounded-xl p-4 mb-8">
            <h2 className="font-display text-lg text-gold mb-3">Fundos da Barbearia</h2>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-gold-dark/20">
                  <td className="py-2 text-gray-400">Fundos acumulados (calculado)</td>
                  <td className="py-2 text-right font-bold text-gold">{formatar(fundosAcumulados)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-400">Saldo bancário informado</td>
                  <td className="py-2 text-right font-bold text-white">{formatar(saldoBancario)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="font-display text-lg text-gold">Lançamentos do dia</h2>
            <SeletorData dataAtual={dataSelecionada} />
          </div>

          <ListaTransacoesDia servicos={servicosDoDia} gastos={gastosDoDia} itensPorComanda={itensPorComanda} />
        </main>
        <Footer />
      </div>
    </div>
  );
}

function Card({ titulo, valor, destaque, negativo }: { titulo: string; valor: string; destaque?: boolean; negativo?: boolean }) {
  return (
    <div className={`border rounded-xl p-4 ${destaque ? "border-gold bg-gold/10" : negativo ? "border-red-400 bg-red-400/10" : "border-gold-dark/40 bg-black-soft"}`}>
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{titulo}</p>
      <p className={`text-lg font-bold ${destaque ? "text-gold" : negativo ? "text-red-400" : "text-white"}`}>{valor}</p>
    </div>
  );
}
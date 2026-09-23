import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import SeletorData from "@/components/SeletorData";
import ListaTransacoesDia, { TransacaoView } from "@/components/ListaTransacoesDia";
import BotaoFecharBarbearia from "@/components/BotaoFecharBarbearia";
import StatusCaixa from "@/components/StatusCaixa";
import { agruparPorComanda } from "@/lib/agruparTransacoes";
import { limitesDoDiaEspecifico, hojeBrasilString } from "@/lib/datasBrasil";
import { calcularFechamento } from "@/lib/fechamentoMensal";
import { sessaoAberta } from "@/lib/caixaSessao";
import { temPermissao } from "@/lib/permissoes";

export default async function CaixaPage({ searchParams }: { searchParams: Promise<{ data?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  const params = await searchParams;
  const dataSelecionada = params.data || hojeBrasilString();
  const { inicio, fim } = limitesDoDiaEspecifico(dataSelecionada);

  const [anoSel, mesSel, diaSel] = dataSelecionada.split("-").map(Number);
  const dataChaveFechamento = new Date(Date.UTC(anoSel, mesSel - 1, diaSel));

  const agora = new Date();

  const [podeFechar, podeAbrirFecharCaixa, podeSangriaSuprimento, previaMes, entradasTotalAgg, saidasTotalAgg, comissoesAgg, settings, transacoesDoDia, fechamentoDoDia, sessaoAtual] = await Promise.all([
    temPermissao(role, "fecharBarbearia"),
    temPermissao(role, "abrirFecharCaixa"),
    temPermissao(role, "registrarSangriaSuprimento"),
    calcularFechamento(agora.getUTCFullYear(), agora.getUTCMonth()),
    prisma.transaction.aggregate({ where: { type: "INCOME", deletedAt: null }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "EXPENSE", deletedAt: null }, _sum: { amount: true } }),
    prisma.transaction.aggregate({
      where: { type: "INCOME", deletedAt: null, commissionAmount: { not: null }, commissionSettled: false },
      _sum: { commissionAmount: true },
    }),
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.transaction.findMany({
      where: { deletedAt: null, date: { gte: inicio, lte: fim } },
      orderBy: { date: "desc" },
      include: { barber: { select: { name: true } }, createdBy: { select: { name: true } } },
    }),
    prisma.dailyClosure.findUnique({ where: { data: dataChaveFechamento } }),
    sessaoAberta(),
  ]);

  const diaFechado = !!fechamentoDoDia;

  const entradasMes = previaMes.faturamentoBruto;
  const saidasMes = previaMes.totalDespesas;

  const totalComissoes = Number(comissoesAgg._sum.commissionAmount ?? 0);

  const taxas = {
    pix: settings ? Number(settings.taxaPix) : 0,
    debito: settings ? Number(settings.taxaDebito) : 0,
    credito: settings ? Number(settings.taxaCredito) : 0,
  };

  const sessaoInfo = sessaoAtual
    ? {
        id: sessaoAtual.id,
        abertoPorNome: sessaoAtual.abertoPor.name,
        abertoEm: sessaoAtual.abertoEm.toISOString(),
        fundoTroco: Number(sessaoAtual.fundoTroco),
      }
    : null;

  const paraView = (t: (typeof transacoesDoDia)[number]): TransacaoView => ({
    id: t.id,
    type: t.type,
    category: t.category,
    description: t.description,
    observacao: t.observacao,
    amount: Number(t.amount),
    date: t.date.toISOString(),
    barberNome: t.barber?.name ?? null,
    commissionAmount: t.commissionAmount ? Number(t.commissionAmount) : null,
    paymentMethod: t.paymentMethod,
    clienteNome: t.clienteNome,
    comandaId: t.comandaId,
    criadoPorNome: t.createdBy.name,
    podeExcluir: (role === "OWNER" || t.createdById === userId) && !(role === "BARBER" && diaFechado),
  });

  const transacoesView = transacoesDoDia.map(paraView);
  const servicosDoDiaRaw = transacoesView.filter((t) => t.type === "INCOME");
  const gastosDoDiaRaw = transacoesView.filter((t) => t.type === "EXPENSE");

  const servicosAgrupados = agruparPorComanda(servicosDoDiaRaw);
  const gastosAgrupados = agruparPorComanda(gastosDoDiaRaw);

  const totalEntradasDia = servicosDoDiaRaw.reduce((s, t) => s + t.amount, 0);
  const totalSaidasDia = gastosDoDiaRaw.reduce((s, t) => s + t.amount, 0);
  const totalComissoesDia = servicosDoDiaRaw.reduce((s, t) => s + (t.commissionAmount ?? 0), 0);

  const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <h1 className="font-display text-2xl text-gold mb-6">Fluxo de Caixa</h1>

        <StatusCaixa sessao={sessaoInfo} podeAbrirFechar={podeAbrirFecharCaixa} podeSangriaSuprimento={podeSangriaSuprimento} />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card titulo="Entradas (mês)" valor={formatar(entradasMes)} />
          <Card titulo="Saídas (mês)" valor={formatar(saidasMes)} />
          <Card titulo="Serviços Registrados Mensalmente" valor={formatar(entradasMes - saidasMes)} destaque />
          <Card titulo="Comissões pendentes" valor={formatar(totalComissoes)} />
        </div>

        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-display text-lg text-gold">Lançamentos do dia</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <SeletorData dataAtual={dataSelecionada} />
            <BotaoFecharBarbearia
              data={dataSelecionada}
              podeFechar={podeFechar}
              totalEntradas={totalEntradasDia}
              totalSaidas={totalSaidasDia}
              totalComissoes={totalComissoesDia}
              servicos={servicosDoDiaRaw.map((s) => ({ category: s.category, amount: s.amount, barberNome: s.barberNome }))}
              gastos={gastosDoDiaRaw.map((g) => ({ category: g.category, amount: g.amount }))}
              jaFechado={diaFechado}
            />
          </div>
        </div>

        {diaFechado && (
          <p className="text-gold text-xs mb-3 text-center">🔒 Este dia já foi fechado — barbeiros não podem mais excluir lançamentos.</p>
        )}

        <ListaTransacoesDia servicos={servicosAgrupados} gastos={gastosAgrupados} taxas={taxas} />
      </main>
      <Footer role={role} />
    </div>
  );
}

function Card({ titulo, valor, destaque }: { titulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className={`border rounded-xl p-4 ${destaque ? "border-gold bg-gold/10" : "border-gold-dark/40 bg-black-soft"}`}>
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{titulo}</p>
      <p className={`text-lg font-bold ${destaque ? "text-gold" : "text-white"}`}>{valor}</p>
    </div>
  );
}
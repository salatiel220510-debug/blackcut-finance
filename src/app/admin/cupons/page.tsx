import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import { temPermissao } from "@/lib/permissoes";
import { limitesDoMesEspecifico } from "@/lib/datasBrasil";
import { agruparPorComanda } from "@/lib/agruparTransacoes";
import { calcularFechamentoSessao } from "@/lib/caixaSessao";
import ListaCupons from "./ListaCupons";

export default async function CuponsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user as any).role;
  if (!(await temPermissao(role, "verCupons"))) redirect("/");

  const agora = new Date();
  const { inicio, fimExclusivo } = limitesDoMesEspecifico(agora.getUTCFullYear(), agora.getUTCMonth());

  const [sessoesFechadas, transacoesIncome] = await Promise.all([
    prisma.cashSession.findMany({
      where: { abertoEm: { gte: inicio, lt: fimExclusivo }, status: "FECHADO" },
      include: { abertoPor: { select: { name: true } } },
      orderBy: { abertoEm: "desc" },
    }),
    prisma.transaction.findMany({
      where: { type: "INCOME", deletedAt: null, date: { gte: inicio, lt: fimExclusivo } },
      orderBy: { date: "desc" },
      include: { barber: { select: { name: true } } },
    }),
  ]);

  const sessoesComPrevia = await Promise.all(
    sessoesFechadas.map(async (s) => ({
      id: s.id,
      abertoPorNome: s.abertoPor.name,
      abertoEmISO: s.abertoEm.toISOString(),
      fechadoEmISO: s.fechadoEm!.toISOString(),
      contagemDinheiro: Number(s.contagemDinheiro ?? 0),
      contagemCartao: Number(s.contagemCartao ?? 0),
      previa: await calcularFechamentoSessao(s.id),
    }))
  );

  const totalMs = sessoesComPrevia.reduce(
    (acc, s) => acc + (new Date(s.fechadoEmISO).getTime() - new Date(s.abertoEmISO).getTime()),
    0
  );
  const totalHoras = Math.floor(totalMs / 3600000);
  const totalMinutos = Math.floor((totalMs % 3600000) / 60000);

  const horasTabela = sessoesComPrevia.map((s) => ({
    data: new Date(s.abertoEmISO).toLocaleDateString("pt-BR"),
    abertura: new Date(s.abertoEmISO).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    fechamento: new Date(s.fechadoEmISO).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    duracao: s.previa.duracao,
    abertoPor: s.abertoPorNome,
  }));

  const comandasAgrupadas = agruparPorComanda(
    transacoesIncome.map((t) => ({
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
      criadoPorNome: "",
      podeExcluir: false,
    }))
  );

  const cupons = [
    ...sessoesComPrevia.map((s) => ({
      tipo: "fechamento" as const,
      id: s.id,
      data: s.fechadoEmISO,
      previa: s.previa,
      contagemDinheiro: s.contagemDinheiro,
      contagemCartao: s.contagemCartao,
    })),
    ...comandasAgrupadas.map((c) => ({
      tipo: "venda" as const,
      id: c.chave,
      data: c.date,
      itens: c.itens.map((i) => ({ category: i.category, amount: i.amount })),
      total: c.amount,
      paymentMethod: c.itens[0]?.paymentMethod ?? null,
      clienteNome: c.itens[0]?.clienteNome ?? null,
      barberNome: c.barberNome,
    })),
  ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <h1 className="font-display text-2xl text-gold mb-6">Cupons e Horas do Mês</h1>

        <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-5 mb-6">
          <h2 className="font-display text-lg text-gold mb-3">Horas Trabalhadas</h2>
          <p className="text-gray-400 text-sm mb-3">
            Total no mês: <span className="text-white font-bold">{totalHoras}h{totalMinutos}min</span>
          </p>
          {horasTabela.length === 0 && <p className="text-gray-500 text-sm">Nenhuma sessão de caixa fechada este mês.</p>}
          {horasTabela.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gold border-b border-gold-dark/30">
                    <th className="p-2">Data</th><th className="p-2">Abertura</th><th className="p-2">Fechamento</th><th className="p-2">Duração</th><th className="p-2">Aberto por</th>
                  </tr>
                </thead>
                <tbody>
                  {horasTabela.map((h, i) => (
                    <tr key={i} className="border-b border-gold-dark/10">
                      <td className="p-2 text-gray-300">{h.data}</td>
                      <td className="p-2 text-gray-300">{h.abertura}</td>
                      <td className="p-2 text-gray-300">{h.fechamento}</td>
                      <td className="p-2 text-white font-semibold">{h.duracao}</td>
                      <td className="p-2 text-gray-300">{h.abertoPor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-5">
          <h2 className="font-display text-lg text-gold mb-3">Cupons do Mês ({cupons.length})</h2>
          <ListaCupons cupons={cupons} />
        </section>
      </main>
      <Footer role={role} />
    </div>
  );
}
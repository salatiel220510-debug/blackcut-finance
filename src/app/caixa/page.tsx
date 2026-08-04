import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BotaoExcluirTransacao from "@/components/BotaoExcluirTransacao";

export default async function CaixaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  const nome = session.user?.name ?? "";

  const [entradasAgg, saidasAgg, comissoesAgg, transacoes, settings] = await Promise.all([
    prisma.transaction.aggregate({ where: { type: "INCOME", deletedAt: null }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "EXPENSE", deletedAt: null }, _sum: { amount: true } }),
    prisma.transaction.aggregate({
      where: { type: "INCOME", deletedAt: null, commissionAmount: { not: null } },
      _sum: { commissionAmount: true },
    }),
    prisma.transaction.findMany({
      where: { deletedAt: null },
      orderBy: { date: "desc" },
      take: 50,
      include: { barber: { select: { name: true } } },
    }),
    prisma.settings.findUnique({ where: { id: 1 } }),
  ]);

  const totalEntradas = Number(entradasAgg._sum.amount ?? 0);
  const totalSaidas = Number(saidasAgg._sum.amount ?? 0);
  const totalComissoes = Number(comissoesAgg._sum.commissionAmount ?? 0);
  const saldo = totalEntradas - totalSaidas;
  const fundosAcumulados = totalEntradas - totalSaidas - totalComissoes;
  const saldoBancario = settings ? Number(settings.saldoBancario) : 0;

  const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="min-h-screen flex flex-row">
      <Navbar role={role} nome={nome} />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
          <h1 className="font-display text-2xl text-gold mb-6">Fluxo de Caixa</h1>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <Card titulo="Entradas" valor={formatar(totalEntradas)} />
            <Card titulo="Saídas" valor={formatar(totalSaidas)} />
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
            <p className="text-xs text-gray-500 mt-2">
              O saldo bancário é atualizado manualmente pelo dono em Configurações — útil para conferir se bate com o calculado.
            </p>
          </div>

          <p className="text-sm text-gray-400 mb-3">Exibindo os últimos {transacoes.length} lançamentos.</p>

          <div className="overflow-x-auto border border-gold-dark/30 rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gold border-b border-gold-dark/30 bg-black-soft">
                  <th className="p-3">Data</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">Barbeiro</th>
                  <th className="p-3">Valor</th>
                  <th className="p-3">Comissão</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {transacoes.map((t) => {
                  const podeExcluir = role === "OWNER" || t.createdById === userId;
                  return (
                    <tr key={t.id} className="border-b border-gold-dark/10">
                      <td className="p-3">{new Date(t.date).toLocaleDateString("pt-BR")}</td>
                      <td className="p-3">{t.type === "INCOME" ? "Entrada" : "Saída"}</td>
                      <td className="p-3">{t.category}</td>
                      <td className="p-3">{t.barber?.name ?? "—"}</td>
                      <td className="p-3">{formatar(Number(t.amount))}</td>
                      <td className="p-3">{t.commissionAmount ? formatar(Number(t.commissionAmount)) : "—"}</td>
                      <td className="p-3">{podeExcluir && <BotaoExcluirTransacao id={t.id} />}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
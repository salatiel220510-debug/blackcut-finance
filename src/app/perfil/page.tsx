import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import FormSenha from "./form-senha";
import { calcularNivel } from "@/lib/niveis";
import { comissaoPendenteBarbeiro, totalRecebidoMesBarbeiro } from "@/lib/comissoesPendentes";
import { faturamentoMensalBarbeiro } from "@/lib/faturamentoBarbeiro";
import { fundosMensais } from "@/lib/dashboardFinanceiro";
import GraficoBarraMensalSimples from "@/components/GraficoBarraMensalSimples";
import PushNotificationSetup from "@/components/PushNotificationSetup";
import GerarCodigoAcesso from "@/components/GerarCodigoAcesso";

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");

  const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const membroDesde = new Date(user.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const comissaoPercentual = settings ? Number(settings.commissionPercentage) : 40;

  if (role === "BARBER") {
    const [agg, faturamentoMensal, comissaoSaldo, comissaoRecebidaMes] = await Promise.all([
      prisma.transaction.aggregate({
        where: { barberId: userId, type: "INCOME", deletedAt: null },
        _sum: { amount: true },
      }),
      faturamentoMensalBarbeiro(userId, 6),
      comissaoPendenteBarbeiro(userId),
      totalRecebidoMesBarbeiro(userId),
    ]);

    const faturamentoTotal = Number(agg._sum.amount ?? 0);
    const nivel = calcularNivel(faturamentoTotal);

    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
          <h1 className="font-display text-2xl text-gold mb-1">Meu Perfil</h1>
          <p className="text-gray-400 mb-8">Membro desde {membroDesde}</p>

          <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-5 mb-6">
            <InfoLinha label="Nome" valor={user.name} />
            <InfoLinha label="Email" valor={user.email} />
            <InfoLinha label="Cargo" valor="Barbeiro" />
            <InfoLinha label="Nível de Experiência" valor={nivel} destaque />
          </section>

          <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-5 mb-6">
            <h2 className="font-display text-lg text-gold mb-3">Faturamento Gerado</h2>
            <p className="text-2xl font-bold text-gold mb-3">{formatar(faturamentoTotal)}</p>
            <GraficoBarraMensalSimples dados={faturamentoMensal} chaveValor="faturamento" nomeSerie="Faturamento" />
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <Card titulo="Comissão a receber" valor={formatar(comissaoSaldo)} destaque />
            <Card titulo="Já recebido (mês)" valor={formatar(comissaoRecebidaMes)} />
          </section>

          <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-5 mb-6">
            <h2 className="font-display text-lg text-gold mb-3">Notificações</h2>
            <p className="text-gray-400 text-sm mb-3">Receba avisos importantes da barbearia no seu celular.</p>
            <PushNotificationSetup />
          </section>

          <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-5">
            <h2 className="font-display text-lg text-gold mb-4">Alterar Senha</h2>
            <FormSenha />
          </section>
        </main>
        <Footer role={role} />
      </div>
    );
  }

  const [fundosMensaisData, entradasTotalAgg, saidasTotalAgg, comissoesAgg, barbeiros] = await Promise.all([
    fundosMensais(6),
    prisma.transaction.aggregate({ where: { type: "INCOME", deletedAt: null }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "EXPENSE", deletedAt: null }, _sum: { amount: true } }),
    prisma.transaction.aggregate({
      where: { type: "INCOME", deletedAt: null, commissionAmount: { not: null }, commissionSettled: false },
      _sum: { commissionAmount: true },
    }),
    prisma.user.findMany({ where: { role: "BARBER", status: "APPROVED" }, orderBy: { name: "asc" } }),
  ]);

  const totalEntradasGeral = Number(entradasTotalAgg._sum.amount ?? 0);
  const totalSaidasGeral = Number(saidasTotalAgg._sum.amount ?? 0);
  const totalComissoesPendentes = Number(comissoesAgg._sum.commissionAmount ?? 0);
  const fundosAtuais = totalEntradasGeral - totalSaidasGeral - totalComissoesPendentes;
  const saldoBancario = settings ? Number(settings.saldoBancario) : 0;
  const diferenca = fundosAtuais - saldoBancario;

  const comissoesPorBarbeiro = await Promise.all(
    barbeiros.map(async (b) => ({ nome: b.name, pendente: await comissaoPendenteBarbeiro(b.id) }))
  );

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        <h1 className="font-display text-2xl text-gold mb-1">Meu Perfil</h1>
        <p className="text-gray-400 mb-8">Membro desde {membroDesde}</p>

        <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-5 mb-6">
          <InfoLinha label="Nome" valor={user.name} />
          <InfoLinha label="Email" valor={user.email} />
          <InfoLinha label="Cargo" valor="Dono" />
        </section>

        <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-5 mb-6">
          <h2 className="font-display text-lg text-gold mb-3">Fundos da Barbearia</h2>
          <p className="text-2xl font-bold text-gold mb-3">{formatar(fundosAtuais)}</p>
          <GraficoBarraMensalSimples dados={fundosMensaisData} chaveValor="fundos" nomeSerie="Fundos" />
          <table className="w-full text-sm mt-4">
            <tbody>
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg text-gold">Comissão a Pagar</h2>
            <span className="text-gray-400 text-xs">Configurada: {comissaoPercentual}%</span>
          </div>
          {comissoesPorBarbeiro.length === 0 && <p className="text-gray-400 text-sm">Nenhum barbeiro aprovado ainda.</p>}
          <div className="flex flex-col gap-2">
            {comissoesPorBarbeiro.map((b, i) => (
              <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gold-dark/10 last:border-0">
                <span className="text-gray-200">{b.nome}</span>
                <span className={b.pendente > 0 ? "text-gold font-semibold" : "text-gray-500"}>{formatar(b.pendente)}</span>
              </div>
            ))}
          </div>
          <a href="/admin/comissoes" className="text-gold text-xs underline mt-3 inline-block">Ir para pagamentos →</a>
        </section>

        <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-5 mb-6">
          <h2 className="font-display text-lg text-gold mb-3">Código de Acesso para Barbeiros</h2>
          <p className="text-gray-400 text-sm mb-3">
            Necessário no primeiro login de um barbeiro recém-aprovado, ou sempre que ele trocar a própria senha.
          </p>
          <GerarCodigoAcesso />
        </section>

        <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-5 mb-6">
          <h2 className="font-display text-lg text-gold mb-3">Notificações</h2>
          <p className="text-gray-400 text-sm mb-3">
            Receba um aviso no celular sempre que um barbeiro registrar ou excluir um lançamento.
          </p>
          <PushNotificationSetup />
        </section>

        <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-5">
          <h2 className="font-display text-lg text-gold mb-4">Alterar Senha</h2>
          <FormSenha />
        </section>
      </main>
      <Footer role={role} />
    </div>
  );
}

function InfoLinha({ label, valor, destaque }: { label: string; valor: string; destaque?: boolean }) {
  return (
    <div className="flex justify-between py-2 border-b border-gold-dark/20 last:border-0">
      <span className="text-gray-400">{label}</span>
      <span className={destaque ? "text-gold font-semibold" : "text-white"}>{valor}</span>
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
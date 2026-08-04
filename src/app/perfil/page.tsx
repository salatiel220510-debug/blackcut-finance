import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FormSenha from "./form-senha";
import { calcularNivel } from "@/lib/niveis";
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

  let nivel = null;
  let faturamentoTotal = 0;
  let comissaoAcumulada = 0;

  if (role === "BARBER") {
    const agg = await prisma.transaction.aggregate({
      where: { barberId: userId, type: "INCOME", deletedAt: null },
      _sum: { amount: true, commissionAmount: true },
    });
    faturamentoTotal = Number(agg._sum.amount ?? 0);
    comissaoAcumulada = Number(agg._sum.commissionAmount ?? 0);
    nivel = calcularNivel(faturamentoTotal);
  }

  let lucroLiquido = 0;
  if (role === "OWNER") {
    const [entradasAgg, saidasAgg, comissoesAgg] = await Promise.all([
      prisma.transaction.aggregate({ where: { type: "INCOME", deletedAt: null }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { type: "EXPENSE", deletedAt: null }, _sum: { amount: true } }),
      prisma.transaction.aggregate({
        where: { type: "INCOME", deletedAt: null, commissionAmount: { not: null } },
        _sum: { commissionAmount: true },
      }),
    ]);
    lucroLiquido =
      Number(entradasAgg._sum.amount ?? 0) -
      Number(saidasAgg._sum.amount ?? 0) -
      Number(comissoesAgg._sum.commissionAmount ?? 0);
  }

  return (
    <div className="min-h-screen flex flex-row">
      <Navbar role={role} nome={user.name} />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
          <h1 className="font-display text-2xl text-gold mb-1">Meu Perfil</h1>
          <p className="text-gray-400 mb-8">Membro desde {membroDesde}</p>

          <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-5 mb-6">
            <InfoLinha label="Nome" valor={user.name} />
            <InfoLinha label="Email" valor={user.email} />
            <InfoLinha label="Cargo" valor={role === "OWNER" ? "Dono" : "Barbeiro"} />
            {role === "BARBER" && <InfoLinha label="Nível" valor={nivel ?? ""} destaque />}
          </section>

          {role === "BARBER" && (
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <Card titulo="Faturamento gerado" valor={formatar(faturamentoTotal)} />
              <Card titulo="Comissão acumulada" valor={formatar(comissaoAcumulada)} destaque />
              <Card titulo="Percentual atual" valor={`${comissaoPercentual}%`} />
            </section>
          )}

          {role === "OWNER" && (
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <Card titulo="Fundos da Barbearia" valor={formatar(lucroLiquido)} destaque />
              <Card titulo="Comissão configurada" valor={`${comissaoPercentual}%`} />
            </section>
          )}

          {role === "OWNER" && (
            <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-5 mb-6">
              <h2 className="font-display text-lg text-gold mb-3">Notificações</h2>
              <p className="text-gray-400 text-sm mb-3">
                Receba um aviso no celular sempre que um barbeiro registrar ou excluir um lançamento.
              </p>
              <PushNotificationSetup />
            </section>
          )}

          {role === "OWNER" && (
            <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-5 mb-6">
              <h2 className="font-display text-lg text-gold mb-3">Código de Acesso para Barbeiros</h2>
              <p className="text-gray-400 text-sm mb-3">
                Necessário no primeiro login de um barbeiro recém-aprovado, ou sempre que ele trocar a própria senha.
              </p>
              <GerarCodigoAcesso />
            </section>
          )}

          <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-5">
            <h2 className="font-display text-lg text-gold mb-4">Alterar Senha</h2>
            <FormSenha />
          </section>
        </main>
        <Footer />
      </div>
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
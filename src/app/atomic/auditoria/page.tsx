import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";
import BotaoLimpar from "./limpar";

const STATUS_ROTULO: Record<string, string> = {
  PENDENTE: "Pendente",
  EXECUTANDO: "Executando",
  CONFIRMADA: "Confirmada",
  CANCELADA: "Cancelada",
};
const TIPO_ROTULO: Record<string, string> = {
  SERVICO: "Serviço",
  PRODUTO: "Produto",
  DESPESA: "Despesa",
  FIDELIDADE: "Fidelidade",
};

const quando = (d: Date) => d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });

export default async function AuditoriaAtomicPage({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  // Somente o dono vê a auditoria.
  if ((session.user as any).role !== "OWNER") redirect("/");

  const params = await searchParams;
  const dias = params.dias === "30" ? 30 : params.dias === "1" ? 1 : 7;
  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

  const [mensagens, consultas, falhas, porStatus, chamadas, formularios] = await Promise.all([
    prisma.atomicMessage.count({ where: { role: "USER", createdAt: { gte: desde } } }),
    prisma.atomicToolLog.count({ where: { createdAt: { gte: desde } } }),
    prisma.atomicToolLog.count({ where: { createdAt: { gte: desde }, ok: false } }),
    prisma.atomicProposal.groupBy({
      by: ["status"],
      where: { createdAt: { gte: desde }, type: { not: "FIDELIDADE" } },
      _count: { _all: true },
    }),
    prisma.atomicToolLog.findMany({ where: { createdAt: { gte: desde } }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.atomicProposal.findMany({ where: { createdAt: { gte: desde } }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  const ids = [...new Set([...chamadas.map((c) => c.userId), ...formularios.map((f) => f.userId)])];
  const usuarios = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
  const nomes = new Map(usuarios.map((u) => [u.id, u.name]));
  const nome = (id: string) => nomes.get(id) ?? "Usuário removido";
  const contagem = (status: string) => porStatus.find((g) => g.status === status)?._count._all ?? 0;

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
          <h1 className="font-display text-2xl text-gold">Auditoria da ATOMIC</h1>
          <Link href="/atomic" className="text-gold text-sm underline">← Voltar ao chat</Link>
        </div>
        <p className="text-gray-400 text-sm mb-4">Tudo o que a IA consultou e propôs. Visível somente para o dono.</p>

        <div className="flex gap-2 mb-6 text-sm">
          {[1, 7, 30].map((d) => (
            <Link
              key={d}
              href={`/atomic/auditoria?dias=${d}`}
              className={`rounded-full px-3 py-1 border ${dias === d ? "bg-gold text-black-deep border-gold font-semibold" : "border-gold-dark/40 text-gray-300"}`}
            >
              {d === 1 ? "24 horas" : `${d} dias`}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <Card titulo="Mensagens enviadas" valor={mensagens} />
          <Card titulo="Consultas da IA" valor={consultas} />
          <Card titulo="Consultas com falha" valor={falhas} alerta={falhas > 0} />
          <Card titulo="Formulários confirmados" valor={contagem("CONFIRMADA")} />
          <Card titulo="Formulários cancelados" valor={contagem("CANCELADA")} />
          <Card titulo="Formulários pendentes" valor={contagem("PENDENTE")} />
        </div>

        <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-4 mb-6">
          <h2 className="font-display text-lg text-gold mb-3">Formulários (cadastros propostos pela IA)</h2>
          {formularios.length === 0 && <p className="text-gray-500 text-sm">Nenhum formulário no período.</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gold border-b border-gold-dark/30">
                  <th className="p-2">Quando</th><th className="p-2">Usuário</th><th className="p-2">Tipo</th>
                  <th className="p-2">Situação</th><th className="p-2">Resumo</th><th className="p-2">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {formularios.map((f) => (
                  <tr key={f.id} className="border-b border-gold-dark/10 align-top">
                    <td className="p-2 text-gray-300 whitespace-nowrap">{quando(f.createdAt)}</td>
                    <td className="p-2 text-gray-300">{nome(f.userId)}</td>
                    <td className="p-2 text-gray-300">{TIPO_ROTULO[f.type] ?? f.type}</td>
                    <td className={`p-2 ${f.status === "CONFIRMADA" ? "text-green-400" : "text-gray-400"}`}>{STATUS_ROTULO[f.status] ?? f.status}</td>
                    <td className="p-2 text-white">{f.summary}</td>
                    <td className="p-2 text-gray-400">{f.result ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-4 mb-6">
          <h2 className="font-display text-lg text-gold mb-3">Consultas feitas pela IA (últimas 100)</h2>
          {chamadas.length === 0 && <p className="text-gray-500 text-sm">Nenhuma consulta no período.</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gold border-b border-gold-dark/30">
                  <th className="p-2">Quando</th><th className="p-2">Usuário</th><th className="p-2">Ferramenta</th>
                  <th className="p-2">Resultado</th><th className="p-2">Parâmetros</th>
                </tr>
              </thead>
              <tbody>
                {chamadas.map((c) => (
                  <tr key={c.id} className="border-b border-gold-dark/10 align-top">
                    <td className="p-2 text-gray-300 whitespace-nowrap">{quando(c.createdAt)}</td>
                    <td className="p-2 text-gray-300">{nome(c.userId)}</td>
                    <td className="p-2 text-white font-mono">{c.tool}</td>
                    <td className={`p-2 ${c.ok ? "text-green-400" : "text-red-400"}`}>{c.ok ? "ok" : "falhou"}</td>
                    <td className="p-2 text-gray-500 font-mono break-all">{JSON.stringify(c.args).slice(0, 140)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-4">
          <h2 className="font-display text-lg text-gold mb-2">Retenção de dados</h2>
          <p className="text-gray-400 text-xs mb-3">
            Conversas podem conter informações digitadas pelos usuários. Apague periodicamente o que já não é necessário.
          </p>
          <BotaoLimpar />
        </section>
      </main>
      <Footer role="OWNER" />
    </div>
  );
}

function Card({ titulo, valor, alerta }: { titulo: string; valor: number; alerta?: boolean }) {
  return (
    <div className={`border rounded-xl p-3 ${alerta ? "border-red-400/60 bg-red-400/10" : "border-gold-dark/40 bg-black-soft"}`}>
      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{titulo}</p>
      <p className={`text-xl font-bold ${alerta ? "text-red-300" : "text-white"}`}>{valor}</p>
    </div>
  );
}
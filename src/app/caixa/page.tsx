import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CaixaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role;

  const [entradasAgg, saidasAgg, comissoesAgg, transacoes] = await Promise.all([
    prisma.transaction.aggregate({ where: { type: "INCOME" }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "EXPENSE" }, _sum: { amount: true } }),
    prisma.transaction.aggregate({
      where: { type: "INCOME", commissionAmount: { not: null } },
      _sum: { commissionAmount: true },
    }),
    prisma.transaction.findMany({
      orderBy: { date: "desc" },
      take: 50,
      include: { barber: { select: { name: true } } },
    }),
  ]);

  const totalEntradas = Number(entradasAgg._sum.amount ?? 0);
  const totalSaidas = Number(saidasAgg._sum.amount ?? 0);
  const totalComissoes = Number(comissoesAgg._sum.commissionAmount ?? 0);
  const saldo = totalEntradas - totalSaidas;

  const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div style={{ padding: 24 }}>
      <h1>Caixa — BlackCut Finance</h1>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "16px 0" }}>
        <ResumoCard titulo="Entradas (total)" valor={formatar(totalEntradas)} cor="green" />
        <ResumoCard titulo="Saídas (total)" valor={formatar(totalSaidas)} cor="crimson" />
        <ResumoCard titulo="Saldo" valor={formatar(saldo)} cor={saldo >= 0 ? "green" : "crimson"} />
        <ResumoCard titulo="Comissões (total)" valor={formatar(totalComissoes)} cor="steelblue" />
      </div>

      <div style={{ marginBottom: 16 }}>
        <Link href="/caixa/novo">+ Novo Lançamento</Link>
        {role === "OWNER" && (
          <>
            {" | "}<Link href="/admin/aprovacoes">Aprovações</Link>
            {" | "}<Link href="/admin/configuracoes">Configurações</Link>
          </>
        )}
      </div>

      <p style={{ fontSize: 13, color: "#666" }}>Exibindo os últimos {transacoes.length} lançamentos.</p>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
            <th>Data</th>
            <th>Tipo</th>
            <th>Categoria</th>
            <th>Barbeiro</th>
            <th>Valor</th>
            <th>Comissão</th>
          </tr>
        </thead>
        <tbody>
          {transacoes.map((t) => (
            <tr key={t.id} style={{ borderBottom: "1px solid #eee" }}>
              <td>{new Date(t.date).toLocaleDateString("pt-BR")}</td>
              <td>{t.type === "INCOME" ? "Entrada" : "Saída"}</td>
              <td>{t.category}</td>
              <td>{t.barber?.name ?? "—"}</td>
              <td>{formatar(Number(t.amount))}</td>
              <td>{t.commissionAmount ? formatar(Number(t.commissionAmount)) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResumoCard({ titulo, valor, cor }: { titulo: string; valor: string; cor: string }) {
  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, minWidth: 150 }}>
      <p style={{ margin: 0, fontSize: 13, color: "#666" }}>{titulo}</p>
      <p style={{ margin: 0, fontSize: 20, fontWeight: "bold", color: cor }}>{valor}</p>
    </div>
  );
}
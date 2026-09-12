import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import LinhaRelato from "./form";

const TIPO_LABEL: Record<string, string> = { PROBLEMA: "Problema", MELHORIA: "Melhoria", OUTRO: "Outro" };

export default async function RelatosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as any).role !== "OWNER") redirect("/");

  const relatos = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true } } },
  });

  const abertos = relatos.filter((r) => r.status === "ABERTO");
  const resolvidos = relatos.filter((r) => r.status === "RESOLVIDO");

  function paraView(r: (typeof relatos)[number]) {
    return {
      id: r.id,
      type: TIPO_LABEL[r.type] ?? r.type,
      title: r.title,
      description: r.description,
      status: r.status,
      autor: r.createdBy.name,
      createdAt: r.createdAt.toISOString(),
    };
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        <h1 className="font-display text-2xl text-gold mb-6">Relatos da Equipe</h1>

        <section className="mb-8">
          <h2 className="font-display text-lg text-gold mb-3">A Resolver ({abertos.length})</h2>
          {abertos.length === 0 && <p className="text-gray-400 text-sm">Nenhum relato pendente.</p>}
          <div className="flex flex-col gap-3">
            {abertos.map((r) => <LinhaRelato key={r.id} relato={paraView(r)} />)}
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg text-gold mb-3">Resolvidos ({resolvidos.length})</h2>
          {resolvidos.length === 0 && <p className="text-gray-400 text-sm">Nenhum relato resolvido ainda.</p>}
          <div className="flex flex-col gap-3">
            {resolvidos.map((r) => <LinhaRelato key={r.id} relato={paraView(r)} />)}
          </div>
        </section>
      </main>
      <Footer role="OWNER" />
    </div>
  );
}
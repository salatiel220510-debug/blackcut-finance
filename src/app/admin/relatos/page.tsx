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
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { createdBy: { select: { name: true } } },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        <h1 className="font-display text-2xl text-gold mb-6">Relatos da Equipe</h1>
        {relatos.length === 0 && <p className="text-gray-400 text-sm">Nenhum relato ainda.</p>}
        <div className="flex flex-col gap-3">
          {relatos.map((r) => (
            <LinhaRelato
              key={r.id}
              relato={{
                id: r.id,
                type: TIPO_LABEL[r.type] ?? r.type,
                title: r.title,
                description: r.description,
                status: r.status,
                autor: r.createdBy.name,
                createdAt: r.createdAt.toISOString(),
              }}
            />
          ))}
        </div>
      </main>
      <Footer role="OWNER" />
    </div>
  );
}
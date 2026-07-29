import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ConfiguracoesForm from "./form";

export default async function ConfiguracoesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as any).role !== "OWNER") redirect("/");

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const servicos = await prisma.serviceType.findMany({ orderBy: { name: "asc" } });

  return (
    <div style={{ padding: 24 }}>
      <h1>Configurações</h1>
      <ConfiguracoesForm
        comissaoAtual={settings ? Number(settings.commissionPercentage) : 40}
        servicos={servicos.map((s) => ({
          id: s.id,
          name: s.name,
          price: s.price ? Number(s.price) : null,
          active: s.active,
        }))}
      />
    </div>
  );
}
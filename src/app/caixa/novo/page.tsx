import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import NovaTransacaoForm from "./form";

export default async function NovaTransacaoPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role;

  const barbeiros = role === "OWNER"
    ? await prisma.user.findMany({
        where: { role: "BARBER", status: "APPROVED" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  const servicos = await prisma.serviceType.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return (
    <div style={{ padding: 24 }}>
      <h1>Novo Lançamento</h1>
      <NovaTransacaoForm
        role={role}
        barbeiros={barbeiros}
        servicos={servicos.map((s) => ({ name: s.name, price: s.price ? Number(s.price) : null }))}
      />
    </div>
  );
}
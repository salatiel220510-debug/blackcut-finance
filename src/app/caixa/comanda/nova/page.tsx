import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import FormComanda from "./form";
import { temPermissao } from "@/lib/permissoes";

export default async function NovaComandaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role;
  const podeDespesas = await temPermissao(role, "criarDespesasComanda");

  const barbeiros = role === "OWNER"
    ? await prisma.user.findMany({
        where: { role: "BARBER", status: "APPROVED" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  const servicosRaw = await prisma.serviceType.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  const categoriasDespesa = podeDespesas
    ? await prisma.expenseCategory.findMany({ where: { active: true }, orderBy: { name: "asc" } })
    : [];

  const agora = new Date();
  const servicos = servicosRaw.map((s) => {
    const precoOriginal = s.price ? Number(s.price) : null;
    const descontoValido =
      s.discountPercentage != null &&
      (!s.discountValidUntil || s.discountValidUntil >= agora);
    const precoComDesconto =
      descontoValido && precoOriginal != null
        ? Number((precoOriginal * (1 - Number(s.discountPercentage) / 100)).toFixed(2))
        : null;

    return {
      name: s.name,
      price: precoOriginal,
      discountedPrice: precoComDesconto,
      discountPercentage: descontoValido ? Number(s.discountPercentage) : null,
    };
  });

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-8">
        <h1 className="font-display text-2xl text-gold mb-6">Nova Comanda</h1>
        <FormComanda
          role={role}
          podeDespesas={podeDespesas}
          barbeiros={barbeiros}
          servicos={servicos}
          categoriasDespesa={categoriasDespesa.map((c) => ({ id: c.id, name: c.name }))}
        />
      </main>
      <Footer role={role} />
    </div>
  );
}
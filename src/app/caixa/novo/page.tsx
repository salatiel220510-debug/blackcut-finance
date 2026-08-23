import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NovaTransacaoForm from "./form";

export default async function NovaTransacaoPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role;
  const nome = session.user?.name ?? "";

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

  const categoriasDespesa = await prisma.expenseCategory.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  const agora = new Date();
  const servicosComDesconto = servicos.map((s) => {
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
    <div className="min-h-screen flex flex-row">
      <Navbar role={role} nome={nome} />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 max-w-md w-full mx-auto px-4 py-8">
          <h1 className="font-display text-2xl text-gold mb-6">Novo Lançamento</h1>
          <NovaTransacaoForm
            role={role}
            barbeiros={barbeiros}
            servicos={servicosComDesconto}
            categoriasDespesa={categoriasDespesa.map((c) => ({ id: c.id, name: c.name }))}
          />
        </main>
        <Footer />
      </div>
    </div>
  );
}
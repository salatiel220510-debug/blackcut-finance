import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import { temPermissao } from "@/lib/permissoes";
import FormProdutos from "./form";

export default async function ProdutosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  if (!(await temPermissao(role, userId, "gerenciarProdutos"))) redirect("/");

  const produtos = await prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } });

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        <h1 className="font-display text-2xl text-gold mb-6">Produtos</h1>
        <FormProdutos
          produtos={produtos.map((p) => ({
            id: p.id,
            name: p.name,
            barcode: p.barcode,
            price: Number(p.price),
            quantidade: p.quantidade,
            vendidos: p.vendidos,
          }))}
        />
      </main>
      <Footer role={role} />
    </div>
  );
}
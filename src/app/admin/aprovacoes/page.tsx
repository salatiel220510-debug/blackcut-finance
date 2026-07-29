import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { aprovarBarbeiro, rejeitarBarbeiro } from "./actions";

export default async function AprovacoesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as any).role !== "OWNER") redirect("/");

  const pendentes = await prisma.user.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div style={{ padding: 24 }}>
      <h1>Aprovações Pendentes</h1>
      {pendentes.length === 0 && <p>Nenhuma solicitação pendente.</p>}
      <ul>
        {pendentes.map((barbeiro) => (
          <li key={barbeiro.id} style={{ marginBottom: 12 }}>
            <strong>{barbeiro.name}</strong> — {barbeiro.email}
            <form action={aprovarBarbeiro.bind(null, barbeiro.id)} style={{ display: "inline", marginLeft: 8 }}>
              <button type="submit">Aprovar</button>
            </form>
            <form action={rejeitarBarbeiro.bind(null, barbeiro.id)} style={{ display: "inline", marginLeft: 8 }}>
              <button type="submit">Rejeitar</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
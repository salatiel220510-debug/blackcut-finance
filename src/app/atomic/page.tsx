import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import { temPermissao } from "@/lib/permissoes";
import ChatAtomic from "./chat";
import { listarConversas } from "./actions";

// Tempo máximo (em segundos) da resposta. Confira o limite do seu plano na Vercel.
export const maxDuration = 60;

export default async function AtomicPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  if (!(await temPermissao(role, userId, "usarAtomic"))) redirect("/");

  const conversas = await listarConversas();

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        <ChatAtomic conversasIniciais={conversas} />
      </main>
      <Footer role={role} />
    </div>
  );
}
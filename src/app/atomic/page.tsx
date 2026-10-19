import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import { temPermissao } from "@/lib/permissoes";
import ChatAtomic from "./chat";
import { listarConversas } from "./actions";
import { atomicDesligada } from "@/lib/atomic/seguranca";

// Tempo máximo (em segundos) da resposta. Confira o limite do seu plano na Vercel.
export const maxDuration = 60;

export default async function AtomicPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  if (!(await temPermissao(role, userId, "usarAtomic"))) redirect("/");

  if (atomicDesligada()) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-12 text-center">
          <h1 className="font-display text-2xl text-gold mb-2">ATOMIC</h1>
          <p className="text-gray-400 text-sm">A ATOMIC está temporariamente desativada. Fale com o dono.</p>
        </main>
        <Footer role={role} />
      </div>
    );
  }

  const conversas = await listarConversas();

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        <ChatAtomic conversasIniciais={conversas} ehDono={role === "OWNER"} />
      </main>
      <Footer role={role} />
    </div>
  );
}
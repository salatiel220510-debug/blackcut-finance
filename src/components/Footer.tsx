import { auth } from "@/auth";
import { APP_VERSION } from "@/lib/version";
import { buscarPermissoesUsuario } from "@/lib/permissoes";
import FooterNav from "./FooterNav";

export default async function Footer({ role: _roleIgnoradoLegado }: { role?: string }) {
  const session = await auth();
  const role = (session?.user as any)?.role as string | undefined;
  const userId = (session?.user as any)?.id as string | undefined;

  const permissoes = role === "BARBER" && userId ? await buscarPermissoesUsuario(userId) : null;

  return (
    <footer className="border-t border-gold-dark/30 bg-black-soft mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-5">
        {role && <FooterNav role={role} permissoes={permissoes} />}
        <div className="flex flex-col items-center gap-1 pt-3 border-t border-gold-dark/10">
          <p className="text-xs text-gray-500">BlackCut Finance — Versão {APP_VERSION}</p>
          <p className="text-xs text-gray-500">
            Powered by <span className="text-gold-dark">Alpha Órbita Labs</span>. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
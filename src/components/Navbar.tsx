import Link from "next/link";
import { signOut } from "@/auth";

const LINKS_COMUNS = [
  { href: "/home", label: "Início" },
  { href: "/caixa", label: "Caixa" },
  { href: "/caixa/novo", label: "Novo Lançamento" },
  { href: "/perfil", label: "Meu Perfil" },
];

const LINKS_DONO = [
  { href: "/admin/configuracoes", label: "Preços & Comissão" },
  { href: "/admin/aprovacoes", label: "Aprovações" },
];

export default function Navbar({ role, nome }: { role: string; nome: string }) {
  const links = role === "OWNER" ? [...LINKS_COMUNS, ...LINKS_DONO] : LINKS_COMUNS;

  return (
    <header className="border-b border-gold-dark/40 bg-black-soft">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <span className="font-display text-xl text-gold tracking-wide">BlackCut Finance</span>
          <span className="text-sm text-gold-dark hidden sm:inline">Olá, {nome}</span>
        </div>
        <nav className="flex flex-wrap gap-2 items-center">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-gold border border-gold-dark rounded-full px-4 py-1.5 hover:bg-gold hover:text-black-deep transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-sm font-semibold text-red-400 border border-red-400/50 rounded-full px-4 py-1.5 hover:bg-red-400 hover:text-black-deep transition-colors"
            >
              Sair
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
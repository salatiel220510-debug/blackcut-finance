import Link from "next/link";
import { APP_VERSION } from "@/lib/version";
import Relogio from "./Relogio";

const LINKS_COMUNS = [
  { href: "/home", label: "Início" },
  { href: "/caixa", label: "Caixa" },
  { href: "/caixa/novo", label: "Novo" },
  { href: "/caixa/comanda/nova", label: "Comanda" },
  { href: "/perfil", label: "Perfil" },
];

const LINKS_DONO = [
  { href: "/admin/comissoes", label: "Comissões" },
  { href: "/admin/configuracoes", label: "Config." },
  { href: "/admin/fechamento", label: "Fechamento" },
  { href: "/admin/aprovacoes", label: "Aprovações" },
];

export default function Footer({ role }: { role?: string }) {
  const links = role === "OWNER" ? [...LINKS_COMUNS, ...LINKS_DONO] : LINKS_COMUNS;

  return (
    <footer className="border-t border-gold-dark/30 bg-black-soft mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-4">
        {role && (
          <nav className="flex flex-wrap gap-x-4 gap-y-2 justify-center mb-3">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-xs text-gold hover:underline">
                {link.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="flex flex-col items-center gap-1">
          <Relogio />
          <p className="text-xs text-gray-500">BlackCut Finance — Versão {APP_VERSION}</p>
          <p className="text-xs text-gray-500">
            Powered by <span className="text-gold-dark">Alpha Órbita Labs</span>. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
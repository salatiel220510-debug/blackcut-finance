"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import IconeSino from "./IconeSino";

type ItemMenu = { href: string; label: string; icone: React.ReactNode };

function IconeHome() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={22} height={22}><path d="M3 12l9-9 9 9" /><path d="M5 10v10h14V10" /></svg>;
}
function IconeCaixa() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={22} height={22}><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2" /></svg>;
}
function IconeComanda() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={22} height={22}><path d="M6 2h9l3 3v17H6z" /><line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="12" y2="17" /></svg>;
}
function IconePerfil() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={22} height={22}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>;
}
function IconeConfig() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={22} height={22}><line x1="4" y1="6" x2="20" y2="6" /><circle cx="14" cy="6" r="2" /><line x1="4" y1="12" x2="20" y2="12" /><circle cx="8" cy="12" r="2" /><line x1="4" y1="18" x2="20" y2="18" /><circle cx="16" cy="18" r="2" /></svg>;
}
function IconeAprovacoes() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={22} height={22}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>;
}
function IconeComissao() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={22} height={22}><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9 10a3 3 0 013-3h1a2 2 0 010 4h-2a2 2 0 000 4h1a3 3 0 003-3" /></svg>;
}
function IconeFechamento() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={22} height={22}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
}
function IconeFidelidade() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={22} height={22}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" /></svg>;
}
function IconeRelato() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={22} height={22}><path d="M4 21V5a2 2 0 012-2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2z" /><path d="M14 3v5h5" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" /></svg>;
}
function IconeCupom() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={22} height={22}><path d="M6 2h12v18l-3-2-3 2-3-2-3 2z" /><line x1="9" y1="7" x2="15" y2="7" /><line x1="9" y1="11" x2="15" y2="11" /></svg>;
}
function IconeSair() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={22} height={22}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>;
}

const LINKS_COMUNS: ItemMenu[] = [
  { href: "/home", label: "Início", icone: <IconeHome /> },
  { href: "/caixa", label: "Caixa", icone: <IconeCaixa /> },
  { href: "/caixa/comanda/nova", label: "Comanda", icone: <IconeComanda /> },
  { href: "/notificacoes", label: "Avisos", icone: <IconeSino /> },
  { href: "/perfil", label: "Perfil", icone: <IconePerfil /> },
];

const LINKS_DONO: ItemMenu[] = [
  { href: "/admin/comissoes", label: "Comissões", icone: <IconeComissao /> },
  { href: "/admin/configuracoes", label: "Config.", icone: <IconeConfig /> },
  { href: "/admin/fechamento", label: "Fechamento", icone: <IconeFechamento /> },
  { href: "/admin/fidelidade", label: "Fidelidade", icone: <IconeFidelidade /> },
  { href: "/admin/relatos", label: "Relatos", icone: <IconeRelato /> },
  { href: "/admin/cupons", label: "Cupons", icone: <IconeCupom /> },
  { href: "/admin/aprovacoes", label: "Aprovações", icone: <IconeAprovacoes /> },
];

const LINKS_EXTRAS_BARBEIRO: { chave: string; item: ItemMenu }[] = [
  { chave: "verFidelidadeGestao", item: { href: "/admin/fidelidade", label: "Fidelidade", icone: <IconeFidelidade /> } },
  { chave: "verFechamentoMensal", item: { href: "/admin/fechamento", label: "Fechamento", icone: <IconeFechamento /> } },
  { chave: "verRelatosEquipe", item: { href: "/admin/relatos", label: "Relatos", icone: <IconeRelato /> } },
  { chave: "verComissoesTodos", item: { href: "/admin/comissoes", label: "Comissões", icone: <IconeComissao /> } },
  { chave: "verCupons", item: { href: "/admin/cupons", label: "Cupons", icone: <IconeCupom /> } },
];

export default function FooterNav({ role, permissoes }: { role: string; permissoes: Record<string, boolean> | null }) {
  const pathname = usePathname();

  const links: ItemMenu[] =
    role === "OWNER"
      ? [...LINKS_COMUNS, ...LINKS_DONO]
      : [...LINKS_COMUNS, ...LINKS_EXTRAS_BARBEIRO.filter((e) => permissoes?.[e.chave]).map((e) => e.item)];

  return (
    <nav className="flex flex-wrap justify-center gap-3 mb-4">
      {links.map((item) => {
        const ativo = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} title={item.label} className="group flex flex-col items-center gap-1">
            <span
              className={`flex items-center justify-center w-12 h-12 rounded-full border transition-all ${
                ativo ? "border-gold bg-gold/15 text-gold" : "border-gold-dark/40 text-gold-dark group-hover:text-gold group-hover:border-gold"
              }`}
              style={{ filter: ativo ? "drop-shadow(0 0 6px rgba(196,30,58,0.8))" : "drop-shadow(0 0 2px rgba(196,30,58,0.3))" }}
            >
              {item.icone}
            </span>
            <span className={`text-[10px] ${ativo ? "text-gold" : "text-gray-500"}`}>{item.label}</span>
          </Link>
        );
      })}

      <button onClick={() => signOut({ callbackUrl: "/login" })} title="Sair" className="group flex flex-col items-center gap-1">
        <span
          className="flex items-center justify-center w-12 h-12 rounded-full border border-red-900/50 text-red-500 group-hover:border-red-500 transition-all"
          style={{ filter: "drop-shadow(0 0 3px rgba(239,68,68,0.4))" }}
        >
          <IconeSair />
        </span>
        <span className="text-[10px] text-gray-500">Sair</span>
      </button>
    </nav>
  );
}
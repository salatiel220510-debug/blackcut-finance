"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type ItemMenu = { href: string; label: string; icone: React.ReactNode };

function IconeHome() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}><path d="M3 12l9-9 9 9" /><path d="M5 10v10h14V10" /></svg>;
}
function IconeCaixa() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2" /></svg>;
}
function IconeNovo() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}><circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" /></svg>;
}
function IconeComissao() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9 10a3 3 0 013-3h1a2 2 0 010 4h-2a2 2 0 000 4h1a3 3 0 003-3" /></svg>;
}
function IconeFechamento() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
}
function IconePerfil() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>;
}
function IconeConfig() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}><line x1="4" y1="6" x2="20" y2="6" /><circle cx="14" cy="6" r="2" /><line x1="4" y1="12" x2="20" y2="12" /><circle cx="8" cy="12" r="2" /><line x1="4" y1="18" x2="20" y2="18" /><circle cx="16" cy="18" r="2" /></svg>;
}
function IconeAprovacoes() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>;
}
function IconeSair() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>;
}
function IconeMenu() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></svg>;
}
function IconeComanda() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}><path d="M6 2h9l3 3v17H6z" /><line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="12" y2="17" /></svg>;
}

const LINKS_COMUNS: ItemMenu[] = [
  { href: "/home", label: "Início", icone: <IconeHome /> },
  { href: "/caixa", label: "Caixa", icone: <IconeCaixa /> },
  { href: "/caixa/novo", label: "Novo", icone: <IconeNovo /> },
  { href: "/caixa/comanda/nova", label: "Comanda", icone: <IconeComanda /> },
  { href: "/perfil", label: "Perfil", icone: <IconePerfil /> },
];

const LINKS_DONO: ItemMenu[] = [
  { href: "/admin/comissoes", label: "Comissões", icone: <IconeComissao /> },
  { href: "/admin/configuracoes", label: "Config.", icone: <IconeConfig /> },
  { href: "/admin/fechamento", label: "Fechamento", icone: <IconeFechamento /> },
  { href: "/admin/aprovacoes", label: "Aprovações", icone: <IconeAprovacoes /> },
];

export default function Navbar({ role }: { role: string; nome?: string }) {
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname();
  const links = role === "OWNER" ? [...LINKS_COMUNS, ...LINKS_DONO] : LINKS_COMUNS;

  return (
    <>
      {/* reserva espaço fixo no layout para a barra recolhida, mesmo com ela flutuando por cima */}
      <div className="w-16 shrink-0" aria-hidden />

      <nav
        className={`fixed left-3 top-1/2 -translate-y-1/2 z-40 backdrop-blur-xl bg-black-soft/70 border border-gold/20 shadow-2xl shadow-black/50 flex flex-col items-stretch gap-1 py-3 transition-all duration-300 ${
          aberto ? "w-52 rounded-3xl px-3" : "w-14 rounded-full px-2"
        }`}
      >
        <button
          onClick={() => setAberto(!aberto)}
          className="flex items-center gap-3 text-gold p-2.5 rounded-xl hover:bg-gold/10 transition-colors mb-1"
        >
          <IconeMenu />
          {aberto && <span className="text-sm font-semibold">Menu</span>}
        </button>

        {links.map((item) => {
          const ativo = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                ativo ? "bg-gold text-black-deep font-semibold" : "text-gold hover:bg-gold/10"
              }`}
            >
              {item.icone}
              {aberto && <span className="text-sm whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 text-red-400 p-2.5 rounded-xl hover:bg-red-400/10 transition-colors mt-1"
        >
          <IconeSair />
          {aberto && <span className="text-sm font-semibold">Sair</span>}
        </button>
      </nav>
    </>
  );
}
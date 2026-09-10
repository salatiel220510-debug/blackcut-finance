"use client";
import { desativarModoDemo } from "@/app/admin/configuracoes/demo-actions";

export default function BotaoSairDemo() {
  return (
    <button
      onClick={async () => { await desativarModoDemo(); window.location.reload(); }}
      className="underline text-black-deep"
    >
      Sair do demo
    </button>
  );
}
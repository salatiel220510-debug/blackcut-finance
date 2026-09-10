"use client";
import { useState } from "react";
import { excluirNotificacao } from "@/app/notificacoes/actions";

export default function BotaoExcluirNotificacao({ id }: { id: string }) {
  const [carregando, setCarregando] = useState(false);

  async function handleExcluir() {
    if (!confirm("Excluir esta notificação? Essa ação não pode ser desfeita.")) return;
    setCarregando(true);
    try {
      await excluirNotificacao(id);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <button onClick={handleExcluir} disabled={carregando} className="text-red-400 text-xs underline disabled:opacity-50">
      {carregando ? "Excluindo..." : "Excluir"}
    </button>
  );
}
"use client";
import { useState } from "react";
import { alternarStatusRelato, excluirRelato } from "@/app/perfil/relato-actions";

type Relato = { id: string; type: string; title: string; description: string; status: string; autor: string; createdAt: string };

export default function LinhaRelato({ relato }: { relato: Relato }) {
  const [carregando, setCarregando] = useState(false);
  const resolvido = relato.status === "RESOLVIDO";

  async function handleAlternar() {
    setCarregando(true);
    try {
      await alternarStatusRelato(relato.id);
      window.location.reload();
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className={`border rounded-xl p-4 ${resolvido ? "border-gold-dark/20 bg-black-soft opacity-70" : "border-gold-dark/40 bg-black-soft"}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full">{relato.type}</span>
        <span className="text-gray-500 text-xs">{new Date(relato.createdAt).toLocaleString("pt-BR")}</span>
      </div>
      <strong className="text-white block mb-1">{relato.title}</strong>
      <p className="text-gray-300 text-sm mb-2">{relato.description}</p>
      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-xs">por {relato.autor}</p>
        <div className="flex gap-2">
          <button onClick={handleAlternar} disabled={carregando} className={`text-xs underline disabled:opacity-50 ${resolvido ? "text-gray-400" : "text-green-400"}`}>
            {carregando ? "..." : resolvido ? "Reabrir" : "Marcar resolvido"}
          </button>
          <button
            onClick={async () => { if (confirm("Excluir este relato?")) { await excluirRelato(relato.id); window.location.reload(); } }}
            className="text-red-400 text-xs underline"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
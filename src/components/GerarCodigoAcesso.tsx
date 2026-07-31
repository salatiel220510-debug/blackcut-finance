"use client";
import { useState } from "react";
import { gerarCodigoAcesso } from "@/app/perfil/actions";

export default function GerarCodigoAcesso() {
  const [codigo, setCodigo] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function gerar() {
    setCarregando(true);
    try {
      const resultado = await gerarCodigoAcesso();
      setCodigo(resultado.codigo);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div>
      <button
        onClick={gerar}
        disabled={carregando}
        className="bg-gold text-black-deep font-semibold rounded-lg px-4 py-2 hover:bg-gold-light transition-colors disabled:opacity-50"
      >
        {carregando ? "Gerando..." : "Gerar Código de Acesso"}
      </button>
      {codigo && (
        <div className="mt-3 bg-gold/10 border border-gold rounded-lg px-4 py-3">
          <p className="text-gray-400 text-xs mb-1">Informe este código pessoalmente ao barbeiro:</p>
          <p className="text-2xl font-bold tracking-widest text-gold text-center">{codigo}</p>
        </div>
      )}
    </div>
  );
}
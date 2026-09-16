"use client";
import { useState } from "react";
import { abrirCaixa } from "@/app/caixa/sessao/actions";

export default function ModalAbrirCaixa({ onFechar }: { onFechar: () => void }) {
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);
    const resultado = await abrirCaixa(new FormData(e.currentTarget));
    setCarregando(false);

    if (resultado?.erro) setMensagem(resultado.erro);
    else window.location.reload();
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4" onClick={onFechar}>
      <div className="bg-black-soft border border-gold rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl text-gold text-center mb-4">Abrir Caixa</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-sm text-gray-300 block mb-1">Fundo de troco inicial (R$)</label>
            <input name="fundoTroco" type="number" step="0.01" min="0" defaultValue="0" required
              className="bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white w-full" />
          </div>
          <button type="submit" disabled={carregando} className="bg-gold text-black-deep font-semibold rounded-lg py-2.5 hover:bg-gold-light transition-colors disabled:opacity-50">
            {carregando ? "Abrindo..." : "Abrir Caixa"}
          </button>
          {mensagem && <p className="text-red-400 text-sm text-center">{mensagem}</p>}
        </form>
        <button onClick={onFechar} className="w-full border border-gold-dark rounded-lg py-2 text-gold text-sm mt-2">Cancelar</button>
      </div>
    </div>
  );
}
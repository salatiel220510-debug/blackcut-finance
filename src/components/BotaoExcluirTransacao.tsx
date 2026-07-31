"use client";
import { useState } from "react";
import { excluirTransacao } from "@/app/caixa/actions";

export default function BotaoExcluirTransacao({ id }: { id: string }) {
  const [aberto, setAberto] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [digitado, setDigitado] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  function abrirModal() {
    setCodigo(Math.floor(100000 + Math.random() * 900000).toString());
    setDigitado("");
    setErro("");
    setAberto(true);
  }

  async function confirmar() {
    if (digitado !== codigo) {
      setErro("Código incorreto. Confira e tente novamente.");
      return;
    }
    setCarregando(true);
    try {
      await excluirTransacao(id);
      setAberto(false);
    } catch (e: any) {
      setErro(e.message || "Erro ao excluir.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <button onClick={abrirModal} className="text-red-400 text-xs border border-red-400/50 rounded-full px-3 py-1 hover:bg-red-400 hover:text-black-deep transition-colors">
        Excluir
      </button>

      {aberto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-black-soft border border-gold-dark rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-display text-lg text-gold mb-2">Confirmar exclusão</h3>
            <p className="text-gray-300 text-sm mb-4">Esta ação não pode ser desfeita. Digite o código abaixo para confirmar:</p>
            <p className="text-2xl tracking-widest text-gold font-bold text-center mb-4 select-none">{codigo}</p>
            <input
              value={digitado}
              onChange={(e) => setDigitado(e.target.value)}
              placeholder="Digite o código"
              inputMode="numeric"
              className="w-full bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white mb-3"
            />
            {erro && <p className="text-red-400 text-sm mb-3">{erro}</p>}
            <div className="flex gap-2">
              <button onClick={() => setAberto(false)} className="flex-1 border border-gold-dark rounded-lg py-2 text-gold">
                Cancelar
              </button>
              <button onClick={confirmar} disabled={carregando} className="flex-1 bg-red-500 hover:bg-red-600 rounded-lg py-2 text-white font-semibold disabled:opacity-50">
                {carregando ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
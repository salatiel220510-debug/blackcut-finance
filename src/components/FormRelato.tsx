"use client";
import { useState } from "react";
import { criarRelato } from "@/app/perfil/relato-actions";

export default function FormRelato() {
  const [aberto, setAberto] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);
    const resultado = await criarRelato(new FormData(e.currentTarget));
    setCarregando(false);

    if (resultado?.erro) {
      setMensagem(resultado.erro);
    } else {
      setMensagem(resultado?.demo ? "Simulado (Modo Demo)!" : "Relato enviado ao dono!");
      (e.target as HTMLFormElement).reset();
      setTimeout(() => { setAberto(false); setMensagem(""); }, 1200);
    }
  }

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)} className="w-full border border-gold-dark rounded-lg py-2 text-gold text-sm font-semibold hover:border-gold transition-colors">
        Relatar problema, melhoria ou algo sobre a barbearia
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 border border-gold-dark/40 rounded-lg p-3">
      <select name="type" required className="bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white text-sm">
        <option value="PROBLEMA">Problema</option>
        <option value="MELHORIA">Melhoria</option>
        <option value="OUTRO">Outro</option>
      </select>
      <input name="title" placeholder="Título curto" required maxLength={150} className="bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white text-sm" />
      <textarea name="description" placeholder="Descreva com detalhes" required rows={3} maxLength={1000} className="bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white text-sm" />
      <div className="flex gap-2">
        <button type="button" onClick={() => setAberto(false)} className="flex-1 border border-gold-dark rounded-lg py-1.5 text-gray-300 text-sm">Cancelar</button>
        <button type="submit" disabled={carregando} className="flex-1 bg-gold text-black-deep font-semibold rounded-lg py-1.5 text-sm disabled:opacity-50">
          {carregando ? "Enviando..." : "Enviar"}
        </button>
      </div>
      {mensagem && <p className="text-gray-300 text-xs">{mensagem}</p>}
    </form>
  );
}
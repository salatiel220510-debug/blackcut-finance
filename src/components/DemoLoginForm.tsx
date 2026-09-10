"use client";
import { useState } from "react";
import { ativarModoDemo } from "@/app/admin/configuracoes/demo-actions";

export default function DemoLoginForm() {
  const [aberto, setAberto] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);
    const resultado = await ativarModoDemo(new FormData(e.currentTarget));
    setCarregando(false);

    if (resultado?.erro) {
      setMensagem(resultado.erro);
    } else {
      window.location.reload();
    }
  }

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)} className="bg-gold-dark text-black-deep font-semibold rounded-lg px-4 py-2 hover:bg-gold transition-colors">
        Ativar Modo Demo
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 border border-gold-dark/40 rounded-lg p-3 max-w-xs">
      <input name="usuario" placeholder="Usuário do demo" required className="bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white text-sm" />
      <input name="senha" type="password" placeholder="Senha do demo" required className="bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white text-sm" />
      <div className="flex gap-2">
        <button type="button" onClick={() => setAberto(false)} className="flex-1 border border-gold-dark rounded-lg py-1.5 text-gray-300 text-sm">Cancelar</button>
        <button type="submit" disabled={carregando} className="flex-1 bg-gold text-black-deep font-semibold rounded-lg py-1.5 text-sm disabled:opacity-50">
          {carregando ? "..." : "Entrar"}
        </button>
      </div>
      {mensagem && <p className="text-red-400 text-xs">{mensagem}</p>}
    </form>
  );
}
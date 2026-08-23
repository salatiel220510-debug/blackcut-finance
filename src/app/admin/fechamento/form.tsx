"use client";
import { useState } from "react";
import { fecharMesManual } from "./actions";

export default function FormFechamento() {
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);
    const resultado = await fecharMesManual(new FormData(e.currentTarget));
    setCarregando(false);

    if (resultado?.erro) {
      setMensagem(resultado.erro);
    } else {
      setMensagem("Mês fechado com sucesso! E-mail e notificação enviados.");
      setTimeout(() => window.location.reload(), 1200);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-center">
      <input name="mes" type="month" required className="bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white" />
      <button type="submit" disabled={carregando} className="bg-gold text-black-deep font-semibold rounded-lg px-4 py-2 hover:bg-gold-light transition-colors disabled:opacity-50 whitespace-nowrap">
        {carregando ? "Fechando..." : "Fechar Mês"}
      </button>
      {mensagem && <p className="text-sm text-gray-300 w-full">{mensagem}</p>}
    </form>
  );
}
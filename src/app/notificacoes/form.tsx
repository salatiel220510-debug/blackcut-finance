"use client";
import { useState } from "react";
import { enviarNotificacao } from "./actions";

export default function FormNotificacao() {
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);
    const resultado = await enviarNotificacao(new FormData(e.currentTarget));
    setCarregando(false);

    if (resultado?.erro) {
      setMensagem(resultado.erro);
    } else {
      setMensagem("Notificação enviada a todos!");
      (e.target as HTMLFormElement).reset();
      setTimeout(() => window.location.reload(), 1000);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 border border-gold-dark/40 bg-black-soft rounded-xl p-5 mb-6">
      <h2 className="font-display text-lg text-gold">Nova Notificação</h2>
      <input name="title" placeholder="Título" required maxLength={100}
        className="bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white" />
      <textarea name="body" placeholder="Mensagem" required maxLength={500} rows={3}
        className="bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white" />
      <button type="submit" disabled={carregando}
        className="bg-gold text-black-deep font-semibold rounded-lg py-2 hover:bg-gold-light transition-colors disabled:opacity-50">
        {carregando ? "Enviando..." : "Enviar para todos"}
      </button>
      {mensagem && <p className="text-gray-300 text-sm">{mensagem}</p>}
    </form>
  );
}
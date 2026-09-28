"use client";
import { useState } from "react";
import Link from "next/link";
import { redefinirSenhaComToken } from "./actions";

export default function FormRedefinirSenha({ token }: { token: string }) {
  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);
    const formData = new FormData(e.currentTarget);
    formData.set("token", token);
    const resultado = await redefinirSenhaComToken(formData);
    setCarregando(false);

    if (resultado?.erro) {
      setMensagem(resultado.erro);
    } else {
      setSucesso(true);
      setMensagem("Senha redefinida com sucesso!");
    }
  }

  if (sucesso) {
    return (
      <div className="flex flex-col gap-4 items-center">
        <p className="text-green-400 text-sm text-center">{mensagem}</p>
        <Link href="/login" className="text-gold text-sm underline">Ir para o login</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-sm text-gray-300 block mb-1.5">Nova senha</label>
        <input name="novaSenha" type="password" required className="w-full bg-white/5 border border-gold/30 rounded-xl px-4 py-3 text-white focus:border-gold focus:outline-none transition-colors" />
      </div>
      <div>
        <label className="text-sm text-gray-300 block mb-1.5">Confirme a nova senha</label>
        <input name="confirmarSenha" type="password" required className="w-full bg-white/5 border border-gold/30 rounded-xl px-4 py-3 text-white focus:border-gold focus:outline-none transition-colors" />
      </div>
      <button type="submit" disabled={carregando} className="w-full bg-gradient-to-red from-gold-dark via-gold to-gold-light text-black-deep font-bold py-3.5 rounded-xl shadow-lg shadow-gold/20 hover:shadow-gold/40 transition-shadow disabled:opacity-50">
        {carregando ? "Salvando..." : "Redefinir Senha"}
      </button>
      {mensagem && <p className="text-red-400 text-sm text-center">{mensagem}</p>}
    </form>
  );
}
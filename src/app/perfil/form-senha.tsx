"use client";
import { useState } from "react";
import { alterarSenha } from "./actions";

export default function FormSenha() {
  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const resultado = await alterarSenha(formData);

    if (resultado?.erro) {
      setMensagem(resultado.erro);
      setSucesso(false);
    } else {
      setSucesso(true);
      setMensagem("Senha alterada com sucesso!");
      (e.target as HTMLFormElement).reset();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input name="senhaAtual" type="password" placeholder="Senha atual" required
        className="bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white" />
      <input name="novaSenha" type="password" placeholder="Nova senha" required minLength={6}
        className="bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white" />
      <input name="confirmarSenha" type="password" placeholder="Confirmar nova senha" required minLength={6}
        className="bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white" />
      <button type="submit" className="bg-gold text-black-deep font-semibold rounded-lg py-2 hover:bg-gold-light transition-colors">
        Alterar Senha
      </button>
      {mensagem && <p className={sucesso ? "text-green-400" : "text-red-400"}>{mensagem}</p>}
    </form>
  );
}
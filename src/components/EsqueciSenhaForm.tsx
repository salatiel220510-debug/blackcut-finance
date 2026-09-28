"use client";
import { useState } from "react";
import { solicitarRedefinicaoSenha } from "@/app/login/esqueci-senha-actions";

export default function EsqueciSenhaForm() {
  const [aberto, setAberto] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);
    const resultado = await solicitarRedefinicaoSenha(new FormData(e.currentTarget));
    setCarregando(false);

    if (!resultado) {
      setMensagem("Não foi possível processar a solicitação.");
      return;
    }

    if ("erro" in resultado) {
      setMensagem(resultado.erro);
    } else {
      setEnviado(true);
      setMensagem(resultado?.mensagem ?? "Se esse e-mail estiver cadastrado, enviamos um link de redefinição.");
    }
  }

  if (!aberto) {
    return (
      <button type="button" onClick={() => setAberto(true)} className="text-gold text-sm hover:underline block text-center w-full mt-1">
        Esqueci minha senha
      </button>
    );
  }

  return (
    <div className="border-t border-gold/10 pt-4 mt-1">
      {enviado ? (
        <p className="text-gray-300 text-sm text-center">{mensagem}</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <label className="text-sm text-gray-300">Informe seu e-mail cadastrado</label>
          <input
            name="email" type="email" required
            className="w-full bg-white/5 border border-gold/30 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-gold focus:outline-none transition-colors"
          />
          <div className="flex gap-2 mt-1">
            <button type="button" onClick={() => setAberto(false)} className="flex-1 border border-gold-dark rounded-xl py-2 text-gold text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={carregando} className="flex-1 bg-gold text-black-deep font-semibold rounded-xl py-2 text-sm disabled:opacity-50">
              {carregando ? "Enviando..." : "Enviar link"}
            </button>
          </div>
          {mensagem && <p className="text-red-400 text-xs text-center">{mensagem}</p>}
        </form>
      )}
    </div>
  );
}
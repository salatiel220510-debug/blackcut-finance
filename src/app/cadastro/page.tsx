"use client";
import { useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { registrarBarbeiro } from "./actions";

export default function CadastroPage() {
  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);
    const formData = new FormData(e.currentTarget);
    const resultado = await registrarBarbeiro(formData);
    setCarregando(false);

    if (resultado.erro) {
      setMensagem(resultado.erro);
      setSucesso(false);
    } else {
      setSucesso(true);
      setMensagem("Cadastro enviado! Aguarde a aprovação do dono para poder entrar.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl text-gold text-center mb-1">BlackCut Finance</h1>
          <p className="text-gray-400 text-center mb-8">Cadastro de Barbeiro</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 border border-gold-dark/40 bg-black-soft rounded-xl p-6">
            <input name="name" placeholder="Nome completo" required
              className="bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white" />
            <input name="email" type="email" placeholder="Email" required autoCapitalize="none" autoCorrect="off"
              className="bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white" />
            <input name="password" type="password" placeholder="Senha" required minLength={6}
              className="bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white" />
            <button type="submit" disabled={carregando}
              className="bg-gold text-black-deep font-semibold rounded-lg py-2 hover:bg-gold-light transition-colors disabled:opacity-50">
              {carregando ? "Enviando..." : "Cadastrar"}
            </button>
            {mensagem && <p className={sucesso ? "text-green-400 text-sm" : "text-red-400 text-sm"}>{mensagem}</p>}
          </form>

          <p className="text-center text-gray-400 text-sm mt-4">
            Já tem conta? <Link href="/login" className="text-gold hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
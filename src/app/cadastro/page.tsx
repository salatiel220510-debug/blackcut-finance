"use client";
import { useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import FundoAbstrato from "@/components/FundoAbstrato";
import TesouraAnimada from "@/components/TesouraAnimada";
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
    <div className="min-h-screen flex flex-col relative">
      <FundoAbstrato />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="backdrop-blur-xl bg-white/[0.04] border border-gold/20 rounded-3xl shadow-2xl shadow-black/60 px-7 py-9">
            <div className="flex flex-col items-center mb-2">
              <TesouraAnimada size={48} />
              <h1 className="font-display text-2xl text-gold tracking-widest mt-3">BLACKCUT</h1>
            </div>
            <p className="text-center text-gray-300 text-lg mb-8">Criar conta de barbeiro</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="text-sm text-gray-300 block mb-1.5">Nome completo</label>
                <input name="name" required
                  className="w-full bg-white/5 border border-gold/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-gold focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="text-sm text-gray-300 block mb-1.5">Email</label>
                <input name="email" type="email" required autoCapitalize="none" autoCorrect="off"
                  className="w-full bg-white/5 border border-gold/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-gold focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="text-sm text-gray-300 block mb-1.5">Senha</label>
                <input name="password" type="password" required minLength={6}
                  className="w-full bg-white/5 border border-gold/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-gold focus:outline-none transition-colors" />
              </div>

              <button type="submit" disabled={carregando}
                className="w-full bg-gradient-to-r from-gold-dark via-gold to-gold-light text-black-deep font-bold py-3.5 rounded-xl shadow-lg shadow-gold/20 hover:shadow-gold/40 transition-shadow disabled:opacity-50 mt-2">
                {carregando ? "Enviando..." : "Cadastrar"}
              </button>
              {mensagem && (
                <p className={`text-sm text-center ${sucesso ? "text-green-400" : "text-red-400"}`}>{mensagem}</p>
              )}
            </form>

            <p className="text-center text-gray-400 text-sm mt-7">
              Já tem conta? <Link href="/login" className="text-gold font-semibold hover:underline">Entrar</Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
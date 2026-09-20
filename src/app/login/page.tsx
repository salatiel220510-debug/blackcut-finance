"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import FooterEstatico from "@/components/FooterEstatico";
import FundoAbstrato from "@/components/FundoAbstrato";
import TesouraAnimada from "@/components/TesouraAnimada";
import { verificarLogin } from "./actions";
import FormRelato from "@/components/FormRelato";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [precisaCodigo, setPrecisaCodigo] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);
    setErro("");

    if (!precisaCodigo) {
      const verificacao = await verificarLogin(email, password);

      if (verificacao.status === "bloqueado") {
        setErro(`Muitas tentativas incorretas. Tente novamente em ${verificacao.minutos} minuto(s).`);
        setCarregando(false);
        return;
      }
      if (verificacao.status === "invalido") {
        setErro("Email ou senha incorretos.");
        setCarregando(false);
        return;
      }
      if (verificacao.status === "pendente") {
        setErro("Sua conta ainda está pendente de aprovação pelo dono.");
        setCarregando(false);
        return;
      }
      if (verificacao.status === "precisa_codigo") {
        setPrecisaCodigo(true);
        setErro("Primeiro acesso após aprovação (ou após trocar de senha). Peça o código de acesso ao dono.");
        setCarregando(false);
        return;
      }
    }

    const res = await signIn("credentials", {
      email,
      password,
      accessCode: precisaCodigo ? accessCode : undefined,
      redirect: false,
    });

    setCarregando(false);

    if (res?.error) {
      setErro(precisaCodigo ? "Código de acesso inválido." : "Email ou senha incorretos.");
      return;
    }

    window.location.href = "/home";
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
            <p className="text-center text-gray-300 text-lg mb-8">Bem-vindo de volta</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="text-sm text-gray-300 block mb-1.5">Email</label>
                <input
                  type="email" required autoCapitalize="none" autoCorrect="off"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-gold/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-gold focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 block mb-1.5">Senha</label>
                <input
                  type="password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-gold/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-gold focus:outline-none transition-colors"
                />
              </div>
              {precisaCodigo && (
                <div>
                  <label className="text-sm text-gold block mb-1.5">Código de acesso</label>
                  <input
                    type="text" required
                    value={accessCode} onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="Peça ao dono"
                    className="w-full bg-white/5 border border-gold rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none"
                  />
                </div>
              )}

              <button type="submit" disabled={carregando}
                className="w-full bg-gradient-to-r from-gold-dark via-gold to-gold-light text-black-deep font-bold py-3.5 rounded-xl shadow-lg shadow-gold/20 hover:shadow-gold/40 transition-shadow disabled:opacity-50 mt-2">
                {carregando ? "Entrando..." : "Login"}
              </button>
              {erro && <p className="text-red-400 text-sm text-center">{erro}</p>}
            </form>

            <p className="text-center text-gray-400 text-sm mt-7">
              Ainda não é membro? <Link href="/cadastro" className="text-gold font-semibold hover:underline">Cadastre-se</Link>
            </p>
          </div>
        </div>
      </div>
      <FooterEstatico />
    </div>
  );
}
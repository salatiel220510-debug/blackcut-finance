"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { verificarLogin } from "./actions";

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
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl text-gold text-center mb-1">BlackCut Finance</h1>
          <p className="text-gray-400 text-center mb-8">Acesse sua conta</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 border border-gold-dark/40 bg-black-soft rounded-xl p-6">
            <input
              type="email" placeholder="Email" required autoCapitalize="none" autoCorrect="off"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white"
            />
            <input
              type="password" placeholder="Senha" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white"
            />
            {precisaCodigo && (
              <input
                type="text" placeholder="Código de acesso (peça ao dono)" required
                value={accessCode} onChange={(e) => setAccessCode(e.target.value)}
                className="bg-black-deep border border-gold rounded-lg px-3 py-2 text-white"
              />
            )}
            <button type="submit" disabled={carregando}
              className="bg-gold text-black-deep font-semibold rounded-lg py-2 hover:bg-gold-light transition-colors disabled:opacity-50">
              {carregando ? "Entrando..." : "Entrar"}
            </button>
            {erro && <p className="text-red-400 text-sm">{erro}</p>}
          </form>

          <p className="text-center text-gray-400 text-sm mt-4">
            Ainda não tem conta? <Link href="/cadastro" className="text-gold hover:underline">Cadastre-se</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
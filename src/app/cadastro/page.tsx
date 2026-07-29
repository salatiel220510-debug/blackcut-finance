"use client";
import { useState } from "react";
import { registrarBarbeiro } from "./actions";

export default function CadastroPage() {
  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const resultado = await registrarBarbeiro(formData);

    if (resultado.erro) {
      setMensagem(resultado.erro);
      setSucesso(false);
    } else {
      setSucesso(true);
      setMensagem("Cadastro enviado! Aguarde a aprovação do dono para poder entrar.");
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: 24 }}>
      <h1>BlackCut Finance — Cadastro de Barbeiro</h1>
      <input name="name" placeholder="Nome completo" required />
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Senha" required minLength={6} />
      <button type="submit">Cadastrar</button>
      {mensagem && <p style={{ color: sucesso ? "green" : "red" }}>{mensagem}</p>}
    </form>
  );
}
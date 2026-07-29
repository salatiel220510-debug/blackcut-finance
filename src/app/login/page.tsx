"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
    if (res?.error) setErro("Email ou senha incorretos, ou conta pendente.");
    else window.location.href = "/";
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: 24 }}>
      <h1>BlackCut Finance — Login</h1>
      <input name="email" type="email" placeholder="Email" required autoCapitalize="none" autoCorrect="off" />
      <input name="password" type="password" placeholder="Senha" required />
      <button type="submit">Entrar</button>
      {erro && <p style={{ color: "red" }}>{erro}</p>}
    </form>
  );
}
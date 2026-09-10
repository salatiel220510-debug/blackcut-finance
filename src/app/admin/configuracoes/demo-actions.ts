"use server";

import { cookies } from "next/headers";
import { auth } from "@/auth";

export async function ativarModoDemo(formData: FormData) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "OWNER") {
    return { erro: "Acesso negado." };
  }

  const usuario = formData.get("usuario") as string;
  const senha = formData.get("senha") as string;

  if (usuario !== process.env.DEMO_USERNAME || senha !== process.env.DEMO_PASSWORD) {
    return { erro: "Usuário ou senha do modo demo incorretos." };
  }

  const cookieStore = await cookies();
  cookieStore.set("blackcut_demo", "ativo", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 4,
    path: "/",
  });

  return { sucesso: true };
}

export async function desativarModoDemo() {
  const cookieStore = await cookies();
  cookieStore.delete("blackcut_demo");
  return { sucesso: true };
}
import { cookies } from "next/headers";

export async function estaEmModoDemo(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("blackcut_demo")?.value === "ativo";
}
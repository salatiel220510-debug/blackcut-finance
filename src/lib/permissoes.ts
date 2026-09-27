import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { PERMISSOES_PADRAO } from "./permissoesTipos";
import type { ChavePermissao } from "./permissoesTipos";

export type { ChavePermissao } from "./permissoesTipos";
export { PERMISSOES_LABEL } from "./permissoesTipos";

export async function buscarPermissoesUsuario(userId: string): Promise<Record<ChavePermissao, boolean>> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const salvas = (user?.permissions as Record<string, boolean> | null) ?? {};
  return { ...PERMISSOES_PADRAO, ...salvas } as Record<ChavePermissao, boolean>;
}

export async function temPermissao(role: string, userId: string, chave: ChavePermissao): Promise<boolean> {
  if (role === "OWNER") return true;
  const permissoes = await buscarPermissoesUsuario(userId);
  return !!permissoes[chave];
}

export async function verificarPermissao(chave: ChavePermissao) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  const permitido = await temPermissao(role, userId, chave);
  if (!permitido) throw new Error("Você não tem permissão para essa ação.");
  return session;
}
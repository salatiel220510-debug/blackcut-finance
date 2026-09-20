import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import type { ChavePermissao } from "./permissoesTipos";

export type { ChavePermissao } from "./permissoesTipos";
export { PERMISSOES_LABEL } from "./permissoesTipos";

const PERMISSOES_PADRAO: Record<ChavePermissao, boolean> = {
  verFaturamentoCompleto: false,
  fecharBarbearia: false,
  verFidelidadeGestao: false,
  verFechamentoMensal: false,
  abrirFecharCaixa: false,
  registrarSangriaSuprimento: false,
  verRelatosEquipe: false,
  verComissoesTodos: false,
  verCupons: false,
};

export async function buscarPermissoesBarbeiro(): Promise<Record<ChavePermissao, boolean>> {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const salvas = (settings?.barberPermissions as Record<string, boolean> | null) ?? {};
  return { ...PERMISSOES_PADRAO, ...salvas } as Record<ChavePermissao, boolean>;
}

export async function temPermissao(role: string, chave: ChavePermissao): Promise<boolean> {
  if (role === "OWNER") return true;
  const permissoes = await buscarPermissoesBarbeiro();
  return !!permissoes[chave];
}

export async function verificarPermissao(chave: ChavePermissao) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  const role = (session.user as any).role;
  const permitido = await temPermissao(role, chave);
  if (!permitido) throw new Error("Você não tem permissão para essa ação.");
  return session;
}
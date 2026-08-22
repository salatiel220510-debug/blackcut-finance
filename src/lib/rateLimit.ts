import { prisma } from "@/lib/prisma";

const JANELA_MINUTOS = 15;
const MAX_TENTATIVAS = 5;
const JANELA_MS = JANELA_MINUTOS * 60 * 1000;

export async function verificarBloqueio(identificador: string) {
  const agora = new Date();
  const desde = new Date(agora.getTime() - JANELA_MS);

  const tentativasFalhas = await prisma.loginAttempt.count({
    where: { identifier: identificador, success: false, createdAt: { gte: desde } },
  });

  console.log(`[DEBUG rateLimit] identificador="${identificador}" tentativasFalhas=${tentativasFalhas}`);

  if (tentativasFalhas < MAX_TENTATIVAS) {
    return { bloqueado: false, minutosRestantes: 0 };
  }

  const primeiraTentativa = await prisma.loginAttempt.findFirst({
    where: { identifier: identificador, success: false, createdAt: { gte: desde } },
    orderBy: { createdAt: "asc" },
  });

  const minutosRestantes = primeiraTentativa
    ? Math.max(1, Math.ceil((primeiraTentativa.createdAt.getTime() + JANELA_MS - agora.getTime()) / 60000))
    : 1;

  return { bloqueado: true, minutosRestantes };
}

export async function registrarTentativa(identificador: string, success: boolean) {
  await prisma.loginAttempt.create({ data: { identifier: identificador, success } });
}
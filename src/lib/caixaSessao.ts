import { prisma } from "@/lib/prisma";

export async function sessaoAberta() {
  return prisma.cashSession.findFirst({
    where: { status: "ABERTO" },
    include: { abertoPor: { select: { name: true } } },
  });
}

export async function calcularFechamentoSessao(sessionId: string) {
  const sessao = await prisma.cashSession.findUnique({ where: { id: sessionId } });
  if (!sessao) throw new Error("Sessão não encontrada.");

  const fimJanela = sessao.fechadoEm ?? new Date();

  const [entradasDinheiro, entradasDigitais, saidasDinheiro, sangrias, suprimentos, itensDoPeriodo] = await Promise.all([
    prisma.transaction.aggregate({
      where: { type: "INCOME", deletedAt: null, paymentMethod: "DINHEIRO", date: { gte: sessao.abertoEm, lte: fimJanela } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: "INCOME", deletedAt: null, paymentMethod: { in: ["PIX", "CARTAO_DEBITO", "CARTAO_CREDITO"] }, date: { gte: sessao.abertoEm, lte: fimJanela } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: "EXPENSE", deletedAt: null, paymentMethod: "DINHEIRO", date: { gte: sessao.abertoEm, lte: fimJanela } },
      _sum: { amount: true },
    }),
    prisma.cashMovement.aggregate({ where: { sessionId, type: "SANGRIA" }, _sum: { amount: true } }),
    prisma.cashMovement.aggregate({ where: { sessionId, type: "SUPRIMENTO" }, _sum: { amount: true } }),
    prisma.transaction.findMany({
      where: { type: "INCOME", deletedAt: null, date: { gte: sessao.abertoEm, lte: fimJanela } },
      select: { comandaId: true, id: true },
    }),
  ]);

  const totalDinheiro = Number(entradasDinheiro._sum.amount ?? 0);
  const totalDigital = Number(entradasDigitais._sum.amount ?? 0);
  const totalSaidasDinheiro = Number(saidasDinheiro._sum.amount ?? 0);
  const totalSangrias = Number(sangrias._sum.amount ?? 0);
  const totalSuprimentos = Number(suprimentos._sum.amount ?? 0);

  const dinheiroEsperado =
    Number(sessao.fundoTroco) + totalDinheiro - totalSaidasDinheiro - totalSangrias + totalSuprimentos;

  const chaves = new Set(itensDoPeriodo.map((t) => t.comandaId ?? t.id));
  const clientesAtendidos = chaves.size;

  const duracaoMs = fimJanela.getTime() - sessao.abertoEm.getTime();
  const horas = Math.floor(duracaoMs / 3600000);
  const minutos = Math.floor((duracaoMs % 3600000) / 60000);

  const contagemDinheiro = sessao.contagemDinheiro != null ? Number(sessao.contagemDinheiro) : null;
  const contagemCartao = sessao.contagemCartao != null ? Number(sessao.contagemCartao) : null;

  return {
    fundoTroco: Number(sessao.fundoTroco),
    totalDinheiro,
    totalDigital,
    totalSaidasDinheiro,
    totalSangrias,
    totalSuprimentos,
    dinheiroEsperado,
    cartaoEsperado: totalDigital,
    diferencaDinheiro: contagemDinheiro != null ? contagemDinheiro - dinheiroEsperado : null,
    diferencaCartao: contagemCartao != null ? contagemCartao - totalDigital : null,
    clientesAtendidos,
    duracao: `${horas}h${minutos}min`,
  };
}
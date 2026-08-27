import { prisma } from "@/lib/prisma";
import { calcularFechamento } from "@/lib/fechamentoMensal";

function limitesDoMesUTC(ano: number, mesIndex0: number) {
  const OFFSET = 3 * 60 * 60 * 1000;
  const inicioBrasil = Date.UTC(ano, mesIndex0, 1, 0, 0, 0, 0);
  const fimBrasil = Date.UTC(ano, mesIndex0 + 1, 1, 0, 0, 0, 0);
  return { inicio: new Date(inicioBrasil + OFFSET), fimExclusivo: new Date(fimBrasil + OFFSET) };
}

export async function despesasPorCategoriaMes(ano: number, mesIndex0: number) {
  const { inicio, fimExclusivo } = limitesDoMesUTC(ano, mesIndex0);

  const despesas = await prisma.transaction.findMany({
    where: { type: "EXPENSE", deletedAt: null, date: { gte: inicio, lt: fimExclusivo } },
    include: { expenseCategory: true },
  });

  const porCategoria: Record<string, number> = {};
  for (const d of despesas) {
    const nome = d.expenseCategory?.name ?? "Sem categoria";
    porCategoria[nome] = (porCategoria[nome] ?? 0) + Number(d.amount);
  }

  return Object.entries(porCategoria).map(([nome, valor]) => ({ nome, valor }));
}

export async function evolucaoUltimosMeses(quantidade: number) {
  const agora = new Date();
  const resultado: { mes: string; faturamento: number; despesas: number; lucro: number }[] = [];

  for (let i = quantidade - 1; i >= 0; i--) {
    const data = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() - i, 1));
    const ehMesAtual = i === 0;

    let faturamento = 0, despesas = 0, lucro = 0;

    if (!ehMesAtual) {
      const fechamento = await prisma.monthlyClosure.findUnique({ where: { mes: data } });
      if (fechamento) {
        faturamento = Number(fechamento.faturamentoBruto);
        despesas = Number(fechamento.totalDespesas);
        lucro = Number(fechamento.lucroLiquido);
      } else {
        const calc = await calcularFechamento(data.getUTCFullYear(), data.getUTCMonth());
        faturamento = calc.faturamentoBruto;
        despesas = calc.totalDespesas;
        lucro = calc.lucroLiquido;
      }
    } else {
      const calc = await calcularFechamento(data.getUTCFullYear(), data.getUTCMonth());
      faturamento = calc.faturamentoBruto;
      despesas = calc.totalDespesas;
      lucro = calc.lucroLiquido;
    }

    resultado.push({
      mes: data.toLocaleDateString("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" }),
      faturamento,
      despesas,
      lucro,
    });
  }

  return resultado;
}

export async function statusOrcamentoCategorias() {
  const agora = new Date();
  const categorias = await prisma.expenseCategory.findMany({
    where: { active: true, budgetLimit: { not: null } },
  });

  const gastos = await despesasPorCategoriaMes(agora.getUTCFullYear(), agora.getUTCMonth());
  const mapaGastos = Object.fromEntries(gastos.map((g) => [g.nome, g.valor]));

  return categorias.map((c) => {
    const gasto = mapaGastos[c.name] ?? 0;
    const limite = Number(c.budgetLimit);
    const percentual = limite > 0 ? (gasto / limite) * 100 : 0;
    let status: "ok" | "atencao" | "estourado" = "ok";
    if (percentual >= 100) status = "estourado";
    else if (percentual >= 80) status = "atencao";

    return { id: c.id, nome: c.name, gasto, limite, percentual, status };
  });
}

export async function envelopesAcumulados() {
  const agg = await prisma.monthlyClosure.aggregate({
    _sum: { envelopeProLabore: true, envelopeReserva: true },
  });
  return {
    proLabore: Number(agg._sum.envelopeProLabore ?? 0),
    reserva: Number(agg._sum.envelopeReserva ?? 0),
  };
}
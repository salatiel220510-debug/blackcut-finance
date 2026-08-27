import { prisma } from "@/lib/prisma";
import { enviarPushParaDonos } from "@/lib/push";
import { despesasPorCategoriaMes } from "@/lib/dashboardFinanceiro";

function primeiroDiaDoMesUTC(data = new Date()) {
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), 1));
}

export async function verificarAlertaOrcamento(expenseCategoryId: string) {
  const categoria = await prisma.expenseCategory.findUnique({ where: { id: expenseCategoryId } });
  if (!categoria || !categoria.budgetLimit) return;
  const categoriaValida = categoria;

  const limite = Number(categoria.budgetLimit);
  if (limite <= 0) return;

  const agora = new Date();
  const gastosPorCategoria = await despesasPorCategoriaMes(agora.getUTCFullYear(), agora.getUTCMonth());
  const gasto = gastosPorCategoria.find((g) => g.nome === categoriaValida.name)?.valor ?? 0;
  const percentual = (gasto / limite) * 100;

  const mesReferencia = primeiroDiaDoMesUTC(agora);
  const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  async function dispararSeNecessario(nivel: "ATENCAO" | "ESTOURADO", limiarPct: number) {
    if (percentual < limiarPct) return;

    const jaEnviado = await prisma.budgetAlert.findUnique({
      where: { expenseCategoryId_mes_level: { expenseCategoryId, mes: mesReferencia, level: nivel } },
    });
    if (jaEnviado) return;

    const titulo = nivel === "ESTOURADO" ? `Orçamento estourado: ${categoriaValida.name}` : `Atenção ao orçamento: ${categoriaValida.name}`;
    const corpo = `${categoriaValida.name}: ${formatar(gasto)} de ${formatar(limite)} (${percentual.toFixed(0)}%)`;

    await enviarPushParaDonos({ title: titulo, body: corpo }).catch((e) => console.error("[alerta-orcamento] push:", e));
    

    await prisma.budgetAlert.create({ data: { expenseCategoryId, mes: mesReferencia, level: nivel } });
  }

  await dispararSeNecessario("ATENCAO", 80);
  await dispararSeNecessario("ESTOURADO", 100);
}
import { prisma } from "@/lib/prisma";
import { enviarEmail } from "@/lib/email";

function limitesDoDiaBrasil(referencia = new Date()) {
  const OFFSET_BRASIL_HORAS = 3; // Brasília = UTC-3 (sem horário de verão desde 2019)
  const brasilMs = referencia.getTime() - OFFSET_BRASIL_HORAS * 60 * 60 * 1000;
  const brasil = new Date(brasilMs);

  const ano = brasil.getUTCFullYear();
  const mes = brasil.getUTCMonth();
  const dia = brasil.getUTCDate();

  const inicioBrasil = Date.UTC(ano, mes, dia, 0, 0, 0, 0);
  const fimBrasil = Date.UTC(ano, mes, dia, 23, 59, 59, 999);

  return {
    inicio: new Date(inicioBrasil + OFFSET_BRASIL_HORAS * 60 * 60 * 1000),
    fim: new Date(fimBrasil + OFFSET_BRASIL_HORAS * 60 * 60 * 1000),
  };
}

export async function enviarResumoDiario() {
  const { inicio, fim } = limitesDoDiaBrasil();

  const transacoesHoje = await prisma.transaction.findMany({
    where: { date: { gte: inicio, lte: fim }, deletedAt: null },
    include: { barber: true, createdBy: true },
    orderBy: { date: "asc" },
  });

  if (transacoesHoje.length === 0) {
    console.log("[resumo-diario] Nenhuma transação hoje, nenhum e-mail enviado.");
    return { enviados: 0 };
  }

  const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const dataFormatada = inicio.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

  const totalEntradas = transacoesHoje.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
  const totalSaidas = transacoesHoje.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);
  const totalComissoes = transacoesHoje.reduce((s, t) => s + Number(t.commissionAmount ?? 0), 0);

  const linhasDono = transacoesHoje
    .map(
      (t) => `
    <tr>
      <td>${t.type === "INCOME" ? "Entrada" : "Saída"}</td>
      <td>${t.category}</td>
      <td>${t.barber?.name ?? "—"}</td>
      <td>${formatar(Number(t.amount))}</td>
      <td>${t.createdBy.name}</td>
    </tr>`
    )
    .join("");

  await enviarEmail({
    to: "rafaelhv850@gmail.com",
    subject: `Resumo do dia ${dataFormatada} — BlackCut Finance`,
    html: `
      <h2>Resumo do dia ${dataFormatada}</h2>
      <p><strong>Entradas:</strong> ${formatar(totalEntradas)}</p>
      <p><strong>Saídas:</strong> ${formatar(totalSaidas)}</p>
      <p><strong>Comissões:</strong> ${formatar(totalComissoes)}</p>
      <p><strong>Lucro do dia:</strong> ${formatar(totalEntradas - totalSaidas - totalComissoes)}</p>
      <table border="1" cellpadding="6" cellspacing="0">
        <tr><th>Tipo</th><th>Categoria</th><th>Barbeiro</th><th>Valor</th><th>Lançado por</th></tr>
        ${linhasDono}
      </table>
    `,
  });

  const barberIds = [...new Set(transacoesHoje.filter((t) => t.barberId).map((t) => t.barberId as string))];
  let enviadosBarbeiros = 0;

  for (const barberId of barberIds) {
    const barbeiro = await prisma.user.findUnique({ where: { id: barberId } });
    if (!barbeiro) continue;

    const transacoesBarbeiro = transacoesHoje.filter((t) => t.barberId === barberId);
    const totalGerado = transacoesBarbeiro.reduce((s, t) => s + Number(t.amount), 0);
    const totalComissaoBarbeiro = transacoesBarbeiro.reduce((s, t) => s + Number(t.commissionAmount ?? 0), 0);

    const linhasBarbeiro = transacoesBarbeiro
      .map((t) => `<tr><td>${t.category}</td><td>${formatar(Number(t.amount))}</td><td>${formatar(Number(t.commissionAmount ?? 0))}</td></tr>`)
      .join("");

    await enviarEmail({
      to: barbeiro.email,
      subject: `Seu resumo do dia ${dataFormatada} — BlackCut Finance`,
      html: `
        <h2>Olá, ${barbeiro.name}!</h2>
        <p>Resumo dos seus serviços hoje:</p>
        <p><strong>Total gerado:</strong> ${formatar(totalGerado)}</p>
        <p><strong>Sua comissão:</strong> ${formatar(totalComissaoBarbeiro)}</p>
        <table border="1" cellpadding="6" cellspacing="0">
          <tr><th>Serviço</th><th>Valor</th><th>Comissão</th></tr>
          ${linhasBarbeiro}
        </table>
      `,
    });
    enviadosBarbeiros++;
  }

  return { enviados: 1 + enviadosBarbeiros };
}
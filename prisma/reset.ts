import { prisma } from "../src/lib/prisma";
import readline from "readline";

function perguntar(pergunta: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(pergunta, (resposta) => { rl.close(); resolve(resposta); }));
}

async function main() {
  console.log("\n⚠️  ATENÇÃO: este script vai apagar PERMANENTEMENTE:");
  console.log("  - Todas as contas de barbeiros (a conta de dono é preservada)");
  console.log("  - Todos os lançamentos do fluxo de caixa");
  console.log("  - Todos os fechamentos mensais e diários");
  console.log("  - Todos os cartões fidelidade, relatos e notificações");
  console.log("  - Código de acesso, saldo bancário e taxas de pagamento");
  console.log("  - A comissão será resetada para 40%, envelopes para 60/30/10\n");

  const resposta = await perguntar('Digite exatamente "CONFIRMAR" para prosseguir: ');
  if (resposta !== "CONFIRMAR") {
    console.log("Operação cancelada. Nada foi apagado.");
    process.exit(0);
  }

  await prisma.budgetAlert.deleteMany({});
  console.log("✓ Alertas de orçamento apagados.");

  await prisma.commissionSettlement.deleteMany({});
  console.log("✓ Liquidações de comissão apagadas.");

  await prisma.transaction.deleteMany({});
  console.log("✓ Lançamentos do caixa apagados.");

  await prisma.monthlyClosure.deleteMany({});
  console.log("✓ Fechamentos mensais apagados.");

  await prisma.dailyClosure.deleteMany({});
  console.log("✓ Fechamentos diários apagados.");

  await prisma.loyaltyCard.deleteMany({});
  console.log("✓ Cartões fidelidade apagados.");

  await prisma.report.deleteMany({});
  console.log("✓ Relatos apagados.");

  await prisma.notification.deleteMany({});
  console.log("✓ Notificações apagadas.");

  await prisma.loginAttempt.deleteMany({});
  console.log("✓ Histórico de tentativas de login apagado.");

  const naoDonos = await prisma.user.findMany({ where: { role: { not: "OWNER" } }, select: { id: true } });
  const idsNaoDonos = naoDonos.map((u) => u.id);

  const subsApagadas = await prisma.pushSubscription.deleteMany({ where: { userId: { in: idsNaoDonos } } });
  console.log(`✓ ${subsApagadas.count} inscrição(ões) de notificação apagada(s).`);

  const usuariosApagados = await prisma.user.deleteMany({ where: { role: { not: "OWNER" } } });
  console.log(`✓ ${usuariosApagados.count} conta(s) apagada(s) (dono preservado).`);

  await prisma.settings.update({
    where: { id: 1 },
    data: {
      commissionPercentage: 40.0,
      saldoBancario: 0,
      accessCode: null,
      accessCodeUpdatedAt: null,
      envelopeOperacionalPct: 60,
      envelopeProLaborePct: 30,
      envelopeReservaPct: 10,
      proLaboreMeta: null,
      reservaMeta: null,
      taxaPix: 0,
      taxaDebito: 0,
      taxaCredito: 0,
    },
  });
  console.log("✓ Configurações resetadas para os valores padrão.");

  console.log("\n✅ Reset concluído com sucesso.\n");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
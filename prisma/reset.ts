import { prisma } from "../src/lib/prisma";
import readline from "readline";

function perguntar(pergunta: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(pergunta, (resposta) => { rl.close(); resolve(resposta); }));
}

async function main() {
  console.log("\n⚠️  ATENÇÃO: este script vai apagar PERMANENTEMENTE:");
  console.log("  - Todas as contas de barbeiros (a conta de dono é preservada)");
  console.log("  - Todos os lançamentos, comandas e vendas");
  console.log("  - Todas as sessões de caixa, sangrias e suprimentos");
  console.log("  - Todos os produtos e o estoque");
  console.log("  - Todos os fechamentos mensais e diários");
  console.log("  - Todos os cartões fidelidade, relatos e notificações");
  console.log("  - Código de acesso, saldo bancário, taxas de pagamento e metas");
  console.log("  - A comissão volta para 40% e os envelopes para 60/30/10");
  console.log("  Serviços e categorias de despesa NÃO são apagados.\n");

  const resposta = await perguntar('Digite exatamente "CONFIRMAR" para prosseguir: ');
  if (resposta !== "CONFIRMAR") {
    console.log("Operação cancelada. Nada foi apagado.");
    process.exit(0);
  }

  await prisma.budgetAlert.deleteMany({});
  console.log("✓ Alertas de orçamento apagados.");

  await prisma.commissionSettlement.deleteMany({});
  console.log("✓ Liquidações de comissão apagadas.");

  await prisma.cashMovement.deleteMany({});
  console.log("✓ Sangrias e suprimentos apagados.");

  await prisma.cashSession.deleteMany({});
  console.log("✓ Sessões de caixa apagadas.");

  await prisma.transaction.deleteMany({});
  console.log("✓ Lançamentos apagados.");

  await prisma.product.deleteMany({});
  console.log("✓ Produtos apagados.");

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

    const tokensApagados = await prisma.passwordResetToken.deleteMany({ where: { userId: { in: idsNaoDonos } } });
  console.log(`✓ ${tokensApagados.count} token(s) de redefinição de senha apagado(s).`);

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
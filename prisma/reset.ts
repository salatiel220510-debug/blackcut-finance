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
  console.log("  - O código de acesso atual e o saldo bancário informado");
  console.log("  - A comissão será resetada para 40%\n");

  const resposta = await perguntar('Digite exatamente "CONFIRMAR" para prosseguir: ');
  if (resposta !== "CONFIRMAR") {
    console.log("Operação cancelada. Nada foi apagado.");
    process.exit(0);
  }

  const transacoesApagadas = await prisma.transaction.deleteMany({});
  console.log(`✓ ${transacoesApagadas.count} lançamento(s) apagado(s).`);

  const naoDonos = await prisma.user.findMany({ where: { role: { not: "OWNER" } }, select: { id: true } });
  const idsNaoDonos = naoDonos.map((u) => u.id);

  const subsApagadas = await prisma.pushSubscription.deleteMany({ where: { userId: { in: idsNaoDonos } } });
  console.log(`✓ ${subsApagadas.count} inscrição(ões) de notificação apagada(s).`);

  const usuariosApagados = await prisma.user.deleteMany({ where: { role: { not: "OWNER" } } });
  console.log(`✓ ${usuariosApagados.count} conta(s) apagada(s) (dono preservado).`);

  await prisma.settings.update({
    where: { id: 1 },
    data: { commissionPercentage: 40.0, saldoBancario: 0, accessCode: null, accessCodeUpdatedAt: null },
  });
  console.log("✓ Comissão resetada para 40%, saldo bancário zerado, código de acesso limpo.");

  console.log("\n✅ Reset concluído com sucesso.\n");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
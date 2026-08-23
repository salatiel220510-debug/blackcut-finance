import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const { OWNER_NAME, OWNER_EMAIL, OWNER_PASSWORD } = process.env;

  if (!OWNER_NAME || !OWNER_EMAIL || !OWNER_PASSWORD) {
    throw new Error("Defina OWNER_NAME, OWNER_EMAIL e OWNER_PASSWORD no .env antes de rodar o seed.");
  }

  const email = OWNER_EMAIL.toLowerCase().trim();

  const ownerExistente = await prisma.user.findUnique({ where: { email } });

  const owner = ownerExistente
    ? ownerExistente
    : await prisma.user.create({
        data: {
          name: OWNER_NAME,
          email,
          passwordHash: await bcrypt.hash(OWNER_PASSWORD, 10),
          role: "OWNER",
          status: "APPROVED",
        },
      });

  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, commissionPercentage: 40.0 },
  });

  console.log(`Conta de dono pronta: ${owner.email}`);

  const servicosIniciais = [
    { name: "Corte", price: 28.0 },
    { name: "Barba", price: 18.0 },
    { name: "Sobrancelha", price: 10.0 },
    { name: "Combo", price: 40.0 },
    { name: "Produto", price: null },
  ];

  for (const s of servicosIniciais) {
    await prisma.serviceType.upsert({ where: { name: s.name }, update: {}, create: s });
  }

  const categoriasIniciais = [
    { name: "Aluguel", type: "FIXED" as const },
    { name: "Água, Luz e Internet", type: "FIXED" as const },
    { name: "Produtos e Insumos", type: "VARIABLE" as const },
    { name: "Descartáveis", type: "VARIABLE" as const },
    { name: "Marketing", type: "MARKETING" as const },
    { name: "Equipamentos", type: "INVESTMENT" as const },
  ];

  for (const c of categoriasIniciais) {
    await prisma.expenseCategory.upsert({ where: { name: c.name }, update: {}, create: c });
  }

  console.log(`Comissão padrão configurada: ${settings.commissionPercentage}%`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
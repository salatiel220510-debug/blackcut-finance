import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const { OWNER_NAME, OWNER_EMAIL, OWNER_PASSWORD } = process.env;

  if (!OWNER_NAME || !OWNER_EMAIL || !OWNER_PASSWORD) {
    throw new Error("Defina OWNER_NAME, OWNER_EMAIL e OWNER_PASSWORD no .env antes de rodar o seed.");
  }

  const email = OWNER_EMAIL.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(OWNER_PASSWORD, 10);

  const owner = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name: OWNER_NAME },
    create: { name: OWNER_NAME, email, passwordHash, role: "OWNER", status: "APPROVED" },
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
  await prisma.serviceType.upsert({
    where: { name: s.name },
    update: {},
    create: s,
  });
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
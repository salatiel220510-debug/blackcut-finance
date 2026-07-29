import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const { OWNER_NAME, OWNER_EMAIL, OWNER_PASSWORD } = process.env;

  if (!OWNER_NAME || !OWNER_EMAIL || !OWNER_PASSWORD) {
    throw new Error("Defina OWNER_NAME, OWNER_EMAIL e OWNER_PASSWORD no .env antes de rodar o seed.");
  }

  const passwordHash = await bcrypt.hash(OWNER_PASSWORD, 10);

  const owner = await prisma.user.upsert({
    where: { email: OWNER_EMAIL },
    update: {},
    create: {
      name: OWNER_NAME,
      email: OWNER_EMAIL,
      passwordHash,
      role: "OWNER",
      status: "APPROVED",
    },
  });

  console.log(`Conta de dono pronta: ${owner.email}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
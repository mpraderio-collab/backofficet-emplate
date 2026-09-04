import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const email = process.env.SEED_USER_EMAIL;
  const name = process.env.SEED_USER_NAME;
  const password = process.env.SEED_USER_PASSWORD;

  if (!email || !name || !password) {
    throw new Error(
      "Faltan SEED_USER_EMAIL, SEED_USER_NAME o SEED_USER_PASSWORD en el entorno.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { email, name, passwordHash },
  });

  console.log(`Usuario listo: ${user.email} (${user.name})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

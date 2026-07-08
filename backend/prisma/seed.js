const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const users = [
  {
    name: "Demo Seller",
    email: "seller@example.com",
    password: "Password123!",
    role: "SELLER"
  },
  {
    name: "Demo Renter",
    email: "renter@example.com",
    password: "Password123!",
    role: "RENTER"
  }
];

async function main() {
  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 12);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        passwordHash,
        role: user.role,
        emailVerifiedAt: new Date(),
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null
      },
      create: {
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role,
        emailVerifiedAt: new Date()
      }
    });
  }

  console.log(`Seeded ${users.length} users.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

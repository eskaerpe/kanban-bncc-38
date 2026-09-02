import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const divisions = [
    'Public Relations',
    'Creative Team',
    'Acara',
    'Perlengkapan',
  ];

  for (const name of divisions) {
    await prisma.division.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log('Seed standard BNCC divisions completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

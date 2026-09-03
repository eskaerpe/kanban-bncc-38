import { PrismaClient, GlobalRole, BoardRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Seed Divisions
  const divisionNames = [
    'Public Relations',
    'Creative Team',
    'Acara',
    'Perlengkapan',
  ];

  const divisionMap: Record<string, number> = {};

  for (const name of divisionNames) {
    const div = await prisma.division.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    divisionMap[name] = div.id;
  }

  // 2. Seed Accounts (Password for all: password123)
  const passwordHash = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@bncc.net' },
    update: { password_hash: passwordHash, global_role: GlobalRole.GLOBAL_ADMIN },
    create: {
      email: 'admin@bncc.net',
      name: 'Admin BNCC',
      password_hash: passwordHash,
      global_role: GlobalRole.GLOBAL_ADMIN,
    },
  });

  const koorUser = await prisma.user.upsert({
    where: { email: 'koor.pr@bncc.net' },
    update: { password_hash: passwordHash },
    create: {
      email: 'koor.pr@bncc.net',
      name: 'Budi (Koor PR)',
      password_hash: passwordHash,
      global_role: GlobalRole.USER,
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff.pr@bncc.net' },
    update: { password_hash: passwordHash },
    create: {
      email: 'staff.pr@bncc.net',
      name: 'Siti (Staff PR)',
      password_hash: passwordHash,
      global_role: GlobalRole.USER,
    },
  });

  // 3. Seed Demo Board & Board Members
  let demoBoard = await prisma.board.findFirst({
    where: { title: 'Proker BNCC Launching 2026' },
  });

  if (!demoBoard) {
    demoBoard = await prisma.board.create({
      data: {
        title: 'Proker BNCC Launching 2026',
        description: 'Board Utama Program Kerja BNCC 2026',
        created_by: adminUser.id,
      },
    });
  }

  // Assign Board Members
  const prDivId = divisionMap['Public Relations'];

  await prisma.boardMember.upsert({
    where: {
      board_id_user_id: {
        board_id: demoBoard.id,
        user_id: adminUser.id,
      },
    },
    update: { role: BoardRole.BOARD_ADMIN },
    create: {
      board_id: demoBoard.id,
      user_id: adminUser.id,
      role: BoardRole.BOARD_ADMIN,
    },
  });

  await prisma.boardMember.upsert({
    where: {
      board_id_user_id: {
        board_id: demoBoard.id,
        user_id: koorUser.id,
      },
    },
    update: { role: BoardRole.KOOR_DIVISION, division_id: prDivId },
    create: {
      board_id: demoBoard.id,
      user_id: koorUser.id,
      role: BoardRole.KOOR_DIVISION,
      division_id: prDivId,
    },
  });

  await prisma.boardMember.upsert({
    where: {
      board_id_user_id: {
        board_id: demoBoard.id,
        user_id: staffUser.id,
      },
    },
    update: { role: BoardRole.STAFF, division_id: prDivId },
    create: {
      board_id: demoBoard.id,
      user_id: staffUser.id,
      role: BoardRole.STAFF,
      division_id: prDivId,
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

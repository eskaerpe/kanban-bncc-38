import { PrismaClient, GlobalRole, BoardRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with canonical roles and 5 official divisions...');

  // 1. Seed Master Roles
  const masterRoles = [
    { code: 'SUPER_ADMIN', name: 'Super Administrator', description: 'Akses penuh sistem BNCC Kanban', is_system: true },
    { code: 'BOARD_ADMIN', name: 'Board Administrator', description: 'Pengelola board dan anggota proker', is_system: true },
    { code: 'KOOR_DIVISION', name: 'Division Coordinator', description: 'Koordinator peninjau dan approval QC divisi', is_system: true },
    { code: 'STAFF', name: 'Staff Member', description: 'Anggota pelaksana proker BNCC', is_system: true },
  ];

  const roleMap: Record<string, number> = {};
  for (const r of masterRoles) {
    const roleRecord = await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description, is_system: r.is_system },
      create: { code: r.code, name: r.name, description: r.description, is_system: r.is_system },
    });
    roleMap[r.code] = roleRecord.id;
  }
  console.log('Master roles seeded:', Object.keys(roleMap));

  // 2. Seed 5 Official BNCC Master Divisions
  const masterDivisions = [
    { code: 'PR', name: 'Public Relations', description: 'Divisi Hubungan Masyarakat & Publikasi' },
    { code: 'EEO', name: 'Event & External Organization', description: 'Divisi Event dan Organisasi Eksternal' },
    { code: 'HRD', name: 'Human Resource Development', description: 'Divisi Pengembangan Sumber Daya Manusia' },
    { code: 'RND', name: 'Research & Development', description: 'Divisi Riset dan Pengembangan Teknologi' },
    { code: 'LNT', name: 'Learning & Training', description: 'Divisi Pembelajaran dan Pelatihan' },
  ];

  const divisionMap: Record<string, number> = {};
  for (const d of masterDivisions) {
    const divRecord = await prisma.division.upsert({
      where: { name: d.name },
      update: { code: d.code, description: d.description },
      create: { code: d.code, name: d.name, description: d.description },
    });
    divisionMap[d.code] = divRecord.id;
    divisionMap[d.name] = divRecord.id;
  }
  console.log('Official divisions seeded:', masterDivisions.map(m => m.code));

  // 3. Seed/Update Demo Accounts (Password for all: password123)
  const passwordHash = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@bncc.net' },
    update: { password_hash: passwordHash, global_role: GlobalRole.GLOBAL_ADMIN, is_active: true },
    create: {
      email: 'admin@bncc.net',
      name: 'Admin BNCC',
      password_hash: passwordHash,
      global_role: GlobalRole.GLOBAL_ADMIN,
      is_active: true,
      token_version: 1,
    },
  });

  const koorUser = await prisma.user.upsert({
    where: { email: 'koor.pr@bncc.net' },
    update: { password_hash: passwordHash, is_active: true },
    create: {
      email: 'koor.pr@bncc.net',
      name: 'Budi (Koor PR)',
      password_hash: passwordHash,
      global_role: GlobalRole.USER,
      is_active: true,
      token_version: 1,
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff.pr@bncc.net' },
    update: { password_hash: passwordHash, is_active: true },
    create: {
      email: 'staff.pr@bncc.net',
      name: 'Siti (Staff PR)',
      password_hash: passwordHash,
      global_role: GlobalRole.USER,
      is_active: true,
      token_version: 1,
    },
  });

  // 4. Backfill & Map Multi-Role Junction Table (UserRole)
  // Admin: SUPER_ADMIN + STAFF
  await prisma.userRole.upsert({
    where: { user_id_role_id: { user_id: adminUser.id, role_id: roleMap['SUPER_ADMIN'] } },
    update: {},
    create: { user_id: adminUser.id, role_id: roleMap['SUPER_ADMIN'] },
  });
  await prisma.userRole.upsert({
    where: { user_id_role_id: { user_id: adminUser.id, role_id: roleMap['STAFF'] } },
    update: {},
    create: { user_id: adminUser.id, role_id: roleMap['STAFF'] },
  });

  // Koor: STAFF
  await prisma.userRole.upsert({
    where: { user_id_role_id: { user_id: koorUser.id, role_id: roleMap['STAFF'] } },
    update: {},
    create: { user_id: koorUser.id, role_id: roleMap['STAFF'] },
  });

  // Staff: STAFF
  await prisma.userRole.upsert({
    where: { user_id_role_id: { user_id: staffUser.id, role_id: roleMap['STAFF'] } },
    update: {},
    create: { user_id: staffUser.id, role_id: roleMap['STAFF'] },
  });

  // 5. Backfill & Map Multi-Division Junction Table (UserDivision)
  const prDivId = divisionMap['PR'];
  if (prDivId) {
    await prisma.userDivision.upsert({
      where: { user_id_division_id: { user_id: koorUser.id, division_id: prDivId } },
      update: {},
      create: { user_id: koorUser.id, division_id: prDivId },
    });
    await prisma.userDivision.upsert({
      where: { user_id_division_id: { user_id: staffUser.id, division_id: prDivId } },
      update: {},
      create: { user_id: staffUser.id, division_id: prDivId },
    });
  }

  // 6. Seed Demo Board & Board Members
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

  console.log('Seed and data backfill completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient, GlobalRole, BoardRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface SeedAccount {
  name: string;
  email: string;
  global_role: GlobalRole;
  roles: string[];
  divisions: string[];
  is_manager?: boolean;
}

async function main() {
  console.log('Seeding database with canonical roles, 5 official divisions, and 19 BNCC personnel accounts...');

  // 1. Seed Master Roles
  const masterRoles = [
    { code: 'SUPER_ADMIN', name: 'Super Administrator', description: 'Akses penuh teknis dan konfigurasi master sistem BNCC Kanban', is_system: true },
    { code: 'COO', name: 'Chief Operating Officer', description: 'Akses eksekutif operasional lintas divisi dan seluruh proker', is_system: true },
    { code: 'CFO', name: 'Chief Financial Officer', description: 'Akses eksekutif keuangan dan operasional lintas divisi dan seluruh proker', is_system: true },
    { code: 'MANAGER_DIVISION', name: 'Division Manager', description: 'Manajer divisi struktural BNCC', is_system: true },
    { code: 'KOOR_DIVISION', name: 'Division Coordinator', description: 'Koordinator peninjau dan approval QC divisi per proker', is_system: true },
    { code: 'STAFF', name: 'Staff Member', description: 'Anggota pelaksana proker BNCC', is_system: true },
  ];

  for (const r of masterRoles) {
    await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description, is_system: r.is_system },
      create: { code: r.code, name: r.name, description: r.description, is_system: r.is_system },
    });
  }

  const allRoles = await prisma.role.findMany();
  const roleMap: Record<string, number> = {};
  allRoles.forEach((r) => {
    roleMap[r.code] = r.id;
  });
  console.log('Master roles ready:', Object.keys(roleMap));

  // 2. Seed 5 Official BNCC Master Divisions
  const masterDivisions = [
    { code: 'PR', name: 'Public Relations', description: 'Divisi Hubungan Masyarakat & Publikasi' },
    { code: 'EEO', name: 'Event & External Organization', description: 'Divisi Event dan Organisasi Eksternal' },
    { code: 'HRD', name: 'Human Resource Development', description: 'Divisi Pengembangan Sumber Daya Manusia' },
    { code: 'RND', name: 'Research & Development', description: 'Divisi Riset dan Pengembangan Teknologi' },
    { code: 'LNT', name: 'Learning & Training', description: 'Divisi Pembelajaran dan Pelatihan' },
  ];

  for (const d of masterDivisions) {
    await prisma.division.upsert({
      where: { name: d.name },
      update: { code: d.code, description: d.description },
      create: { code: d.code, name: d.name, description: d.description },
    });
  }

  const allDivisions = await prisma.division.findMany();
  const divisionMap: Record<string, number> = {};
  allDivisions.forEach((d) => {
    if (d.code) divisionMap[d.code] = d.id;
    divisionMap[d.name] = d.id;
  });
  console.log('Official divisions ready:', Object.keys(divisionMap));

  // 3. Personnel Accounts Definition (19 Accounts)
  const defaultPasswordHash = await bcrypt.hash('password123', 10);
  const allDivisionCodes = ['PR', 'EEO', 'HRD', 'RND', 'LNT'];

  const accounts: SeedAccount[] = [
    // Executive / C-Level
    {
      name: 'Gregory',
      email: 'gregory.all@bncc.net',
      global_role: GlobalRole.GLOBAL_ADMIN,
      roles: ['COO', 'STAFF'],
      divisions: allDivisionCodes,
    },
    {
      name: 'Abiyyu',
      email: 'abiyyu.all@bncc.net',
      global_role: GlobalRole.GLOBAL_ADMIN,
      roles: ['CFO', 'STAFF'],
      divisions: allDivisionCodes,
    },

    // RND
    {
      name: 'Reihan',
      email: 'reihan.rnd@bncc.net',
      global_role: GlobalRole.GLOBAL_ADMIN,
      roles: ['SUPER_ADMIN', 'MANAGER_DIVISION', 'STAFF'],
      divisions: ['RND'],
      is_manager: true,
    },
    {
      name: 'Nevan',
      email: 'nevan.rnd@bncc.net',
      global_role: GlobalRole.USER,
      roles: ['STAFF'],
      divisions: ['RND'],
    },
    {
      name: 'Raven',
      email: 'raven.rnd@bncc.net',
      global_role: GlobalRole.USER,
      roles: ['STAFF'],
      divisions: ['RND'],
    },

    // EEO
    {
      name: 'Devania',
      email: 'devania.eeo@bncc.net',
      global_role: GlobalRole.USER,
      roles: ['MANAGER_DIVISION', 'STAFF'],
      divisions: ['EEO'],
      is_manager: true,
    },
    {
      name: 'Alif',
      email: 'alif.eeo@bncc.net',
      global_role: GlobalRole.USER,
      roles: ['STAFF'],
      divisions: ['EEO'],
    },

    // HRD
    {
      name: 'Natalie',
      email: 'natalie.hrd@bncc.net',
      global_role: GlobalRole.USER,
      roles: ['MANAGER_DIVISION', 'STAFF'],
      divisions: ['HRD'],
      is_manager: true,
    },
    {
      name: 'Givara',
      email: 'givara.hrd@bncc.net',
      global_role: GlobalRole.USER,
      roles: ['STAFF'],
      divisions: ['HRD'],
    },
    {
      name: 'Dialova',
      email: 'dialova.hrd@bncc.net',
      global_role: GlobalRole.USER,
      roles: ['STAFF'],
      divisions: ['HRD'],
    },

    // PR
    {
      name: 'Adin',
      email: 'adin.pr@bncc.net',
      global_role: GlobalRole.USER,
      roles: ['MANAGER_DIVISION', 'STAFF'],
      divisions: ['PR'],
      is_manager: true,
    },
    {
      name: 'Felicia IDT',
      email: 'feliciaIDT.pr@bncc.net',
      global_role: GlobalRole.USER,
      roles: ['STAFF'],
      divisions: ['PR'],
    },
    {
      name: 'Nabiel',
      email: 'nabiel.pr@bncc.net',
      global_role: GlobalRole.USER,
      roles: ['STAFF'],
      divisions: ['PR'],
    },
    {
      name: 'Daniel',
      email: 'daniel.pr@bncc.net',
      global_role: GlobalRole.USER,
      roles: ['STAFF'],
      divisions: ['PR'],
    },
    {
      name: 'Queen',
      email: 'queen.pr@bncc.net',
      global_role: GlobalRole.USER,
      roles: ['STAFF'],
      divisions: ['PR'],
    },

    // LNT
    {
      name: 'Raymond',
      email: 'raymond.lnt@bncc.net',
      global_role: GlobalRole.USER,
      roles: ['MANAGER_DIVISION', 'STAFF'],
      divisions: ['LNT'],
      is_manager: true,
    },
    {
      name: 'Marvell',
      email: 'marvell.lnt@bncc.net',
      global_role: GlobalRole.USER,
      roles: ['STAFF'],
      divisions: ['LNT'],
    },
    {
      name: 'Marvella',
      email: 'marvella.lnt@bncc.net',
      global_role: GlobalRole.USER,
      roles: ['STAFF'],
      divisions: ['LNT'],
    },
    {
      name: 'Felicia CS',
      email: 'feliciaCS.lnt@bncc.net',
      global_role: GlobalRole.USER,
      roles: ['STAFF'],
      divisions: ['LNT'],
    },
  ];

  // Upsert all accounts
  const userMap: Record<string, { id: number; name: string; email: string }> = {};

  for (const acc of accounts) {
    const user = await prisma.user.upsert({
      where: { email: acc.email },
      update: {
        name: acc.name,
        global_role: acc.global_role,
        is_active: true,
      },
      create: {
        name: acc.name,
        email: acc.email,
        password_hash: defaultPasswordHash,
        global_role: acc.global_role,
        is_active: true,
        token_version: 1,
      },
    });
    userMap[acc.email] = { id: user.id, name: user.name, email: user.email };
  }

  // Bulk create user roles and user divisions with skipDuplicates
  const userRolesToInsert: { user_id: number; role_id: number }[] = [];
  const userDivisionsToInsert: { user_id: number; division_id: number }[] = [];

  for (const acc of accounts) {
    const u = userMap[acc.email];
    if (!u) continue;

    for (const rCode of acc.roles) {
      const rId = roleMap[rCode];
      if (rId) {
        userRolesToInsert.push({ user_id: u.id, role_id: rId });
      }
    }

    for (const dCode of acc.divisions) {
      const dId = divisionMap[dCode];
      if (dId) {
        userDivisionsToInsert.push({ user_id: u.id, division_id: dId });
      }
    }
  }

  // Clear existing mappings for these users and re-insert in bulk
  const userIds = Object.values(userMap).map((u) => u.id);
  await prisma.userRole.deleteMany({ where: { user_id: { in: userIds } } });
  await prisma.userDivision.deleteMany({ where: { user_id: { in: userIds } } });

  await prisma.userRole.createMany({
    data: userRolesToInsert,
    skipDuplicates: true,
  });

  await prisma.userDivision.createMany({
    data: userDivisionsToInsert,
    skipDuplicates: true,
  });

  console.log(`Seeded and mapped ${accounts.length} BNCC personnel accounts successfully.`);

  // 4. Deactivate legacy demo accounts if present
  const legacyEmails = ['admin@bncc.net', 'koor.pr@bncc.net', 'staff.pr@bncc.net'];
  await prisma.user.updateMany({
    where: { email: { in: legacyEmails } },
    data: { is_active: false },
  });

  // 5. Seed Demo Proker Board
  const reihanUser = userMap['reihan.rnd@bncc.net'];
  if (reihanUser) {
    let demoBoard = await prisma.board.findFirst({
      where: { title: 'Proker BNCC Launching 2026' },
    });

    if (!demoBoard) {
      demoBoard = await prisma.board.create({
        data: {
          title: 'Proker BNCC Launching 2026',
          description: 'Board Utama Program Kerja BNCC 2026',
          created_by: reihanUser.id,
        },
      });
    }

    // Assign Creator/Super Admin as BOARD_ADMIN
    await prisma.boardMember.upsert({
      where: {
        board_id_user_id: {
          board_id: demoBoard.id,
          user_id: reihanUser.id,
        },
      },
      update: { role: BoardRole.BOARD_ADMIN },
      create: {
        board_id: demoBoard.id,
        user_id: reihanUser.id,
        role: BoardRole.BOARD_ADMIN,
      },
    });

    // Assign Adin as KOOR_DIVISION for PR on this board
    const adinUser = userMap['adin.pr@bncc.net'];
    const prDivId = divisionMap['PR'];
    if (adinUser && prDivId) {
      await prisma.boardMember.upsert({
        where: {
          board_id_user_id: {
            board_id: demoBoard.id,
            user_id: adinUser.id,
          },
        },
        update: { role: BoardRole.KOOR_DIVISION, division_id: prDivId },
        create: {
          board_id: demoBoard.id,
          user_id: adinUser.id,
          role: BoardRole.KOOR_DIVISION,
          division_id: prDivId,
        },
      });
    }

    // Assign Felicia IDT as STAFF for PR on this board
    const feliciaIdt = userMap['feliciaIDT.pr@bncc.net'];
    if (feliciaIdt && prDivId) {
      await prisma.boardMember.upsert({
        where: {
          board_id_user_id: {
            board_id: demoBoard.id,
            user_id: feliciaIdt.id,
          },
        },
        update: { role: BoardRole.STAFF, division_id: prDivId },
        create: {
          board_id: demoBoard.id,
          user_id: feliciaIdt.id,
          role: BoardRole.STAFF,
          division_id: prDivId,
        },
      });
    }
  }

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

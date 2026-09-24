# Database Authorization Migration Map & Rollback Strategy

**Project:** BNCC Proker Kanban  
**Repository:** `/mnt/d/Coding/kanban-bncc-38`  
**Status:** Approved Migration Design Specification  
**Database:** PostgreSQL (Supabase Canonical)  
**Governing Documents:** `docs/AUTHORIZATION_GLOSSARY.md`, `docs/AUTHORIZATION_MATRIX.md`, `docs/USER_AUTHORIZATION_ERD.md`  

---

## 1. Executive Summary

Dokumen ini mendefinisikan peta jalan migrasi skema database (*database migration map*) dari model otorisasi lama (single-role enum `User.role` dan single-division enum `User.division`) menuju model otorisasi modular multi-role & multi-division ala Discord.

Dokumen ini mencakup:
1. Perbandingan skema *Current* vs *Target*.
2. Script Prisma Schema target.
3. Strategi migrasi 4 tahap (*Expand-Migrate-Contract*) dengan jaminan *zero data loss*.
4. Penanganan konversi data khusus (migrasi enum usang `IIO_EEO` menjadi canonical code `EEO`).
5. Strategi rollback lengkap (*disaster recovery*).

---

## 2. Current Schema vs Target Schema Comparison

### 2.1 Current Schema (Legacy PostgreSQL)
```prisma
enum Role {
  GLOBAL_ADMIN
  BOARD_ADMIN
  STAFF
}

enum Division {
  PR
  IIO_EEO
  HRD
  RND
  LNT
}

model User {
  id        String    @id @default(uuid())
  email     String    @unique
  name      String
  password  String
  role      Role      @default(STAFF)
  division  Division?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  // relasi boards, cards, etc.
}
```

### 2.2 Target Schema (Discord-Style Multi-Role & Multi-Division)
```prisma
model User {
  id           String         @id @default(uuid())
  email        String         @unique
  name         String
  password     String
  tokenVersion Int            @default(1)
  isActive     Boolean        @default(true)
  roles        UserRole[]
  divisions    UserDivision[]
  
  // Relasi audit & operasional
  createdBoards Board[]
  boardMembers  BoardMember[]
  assignedCards CardAssignee[]
  cardActivities ActivityLog[]
  auditLogsActed RoleAuditLog[] @relation("AuditActor")
  auditLogsTarget RoleAuditLog[] @relation("AuditTarget")

  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  @@map("users")
}

model Role {
  id          String     @id @default(uuid())
  code        String     @unique // "SUPER_ADMIN", "BOARD_ADMIN", "KOOR_DIVISION", "STAFF"
  name        String
  description String?
  isSystem    Boolean    @default(false)
  users       UserRole[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@map("roles")
}

model UserRole {
  userId     String
  roleId     String
  assignedAt DateTime @default(now())
  assignedBy String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([userId, roleId])
  @@index([userId])
  @@index([roleId])
  @@map("user_roles")
}

model Division {
  id          String         @id @default(uuid())
  code        String         @unique // "PR", "EEO", "HRD", "RND", "LNT"
  name        String
  description String?
  users       UserDivision[]
  boards      Board[]
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  @@map("divisions")
}

model UserDivision {
  userId     String
  divisionId String
  assignedAt DateTime @default(now())
  assignedBy String?

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  division Division @relation(fields: [divisionId], references: [id], onDelete: Cascade)

  @@id([userId, divisionId])
  @@index([userId])
  @@index([divisionId])
  @@map("user_divisions")
}

model RoleAuditLog {
  id           String   @id @default(uuid())
  actorId      String
  targetUserId String
  action       String   // "ROLE_ASSIGN", "ROLE_REVOKE", "DIVISION_ASSIGN", "DIVISION_REMOVE"
  detail       Json?
  createdAt    DateTime @default(now())

  actor      User @relation("AuditActor", fields: [actorId], references: [id], onDelete: Cascade)
  targetUser User @relation("AuditTarget", fields: [targetUserId], references: [id], onDelete: Cascade)

  @@index([targetUserId])
  @@index([actorId])
  @@map("role_audit_logs")
}
```

---

## 3. Migration Execution Sequence (Zero-Loss Pipeline)

Migrasi database dijalankan dalam urutan ketat:

### Tahap 1: Expand (Penyediaan Tabel Baru Tanpa Menghancurkan Kolom Lama)
1. Eksekusi migrasi DDL untuk membuat tabel:
   - `roles`
   - `user_roles`
   - `divisions`
   - `user_divisions`
   - `role_audit_logs`
2. Tambahkan kolom baru pada tabel `users`:
   - `tokenVersion INT DEFAULT 1 NOT NULL`
   - `isActive BOOLEAN DEFAULT true NOT NULL`
3. Kolom lama `users.role` dan `users.division` **tetap dipertahankan** pada tahap ini.

### Tahap 2: Seed & Data Backfill (Migrasi Data Historis)
1. **Seed Master Roles:**
   ```sql
   INSERT INTO roles (id, code, name, description, "isSystem", "createdAt", "updatedAt")
   VALUES 
     (gen_random_uuid(), 'SUPER_ADMIN', 'Super Administrator', 'Akses penuh sistem BNCC Kanban', true, NOW(), NOW()),
     (gen_random_uuid(), 'BOARD_ADMIN', 'Board Administrator', 'Pengelola board dan anggota proker', true, NOW(), NOW()),
     (gen_random_uuid(), 'KOOR_DIVISION', 'Division Coordinator', 'Koordinator peninjau dan approval QC divisi', true, NOW(), NOW()),
     (gen_random_uuid(), 'STAFF', 'Staff Member', 'Anggota pelaksana proker BNCC', true, NOW(), NOW())
   ON CONFLICT (code) DO NOTHING;
   ```

2. **Seed Master Divisions (5 Divisi Resmi BNCC):**
   ```sql
   INSERT INTO divisions (id, code, name, description, "createdAt", "updatedAt")
   VALUES 
     (gen_random_uuid(), 'PR', 'Public Relations', 'Divisi Hubungan Masyarakat', NOW(), NOW()),
     (gen_random_uuid(), 'EEO', 'Event & External Organization', 'Divisi Event dan Organisasi Eksternal', NOW(), NOW()),
     (gen_random_uuid(), 'HRD', 'Human Resource Development', 'Divisi Pengembangan Sumber Daya Manusia', NOW(), NOW()),
     (gen_random_uuid(), 'RND', 'Research & Development', 'Divisi Riset dan Pengembangan Teknologi', NOW(), NOW()),
     (gen_random_uuid(), 'LNT', 'Learning & Training', 'Divisi Pembelajaran dan Pelatihan', NOW(), NOW())
   ON CONFLICT (code) DO NOTHING;
   ```

3. **Backfill Relasi UserRole:**
   ```sql
   -- Petakan GLOBAL_ADMIN lama ke SUPER_ADMIN dan STAFF
   INSERT INTO user_roles ("userId", "roleId", "assignedAt")
   SELECT u.id, r.id, NOW()
   FROM users u
   JOIN roles r ON r.code = 'SUPER_ADMIN'
   WHERE u.role = 'GLOBAL_ADMIN'
   ON CONFLICT DO NOTHING;

   -- Petakan BOARD_ADMIN lama ke BOARD_ADMIN dan STAFF
   INSERT INTO user_roles ("userId", "roleId", "assignedAt")
   SELECT u.id, r.id, NOW()
   FROM users u
   JOIN roles r ON r.code = 'BOARD_ADMIN'
   WHERE u.role = 'BOARD_ADMIN'
   ON CONFLICT DO NOTHING;

   -- Pastikan semua user eksisting memiliki peran dasar STAFF
   INSERT INTO user_roles ("userId", "roleId", "assignedAt")
   SELECT u.id, r.id, NOW()
   FROM users u
   CROSS JOIN roles r
   WHERE r.code = 'STAFF'
   ON CONFLICT DO NOTHING;
   ```

4. **Backfill Relasi UserDivision (Termasuk Konversi `IIO_EEO` → `EEO`):**
   ```sql
   -- Petakan divisi lama ke tabel baru dengan normalisasi IIO_EEO -> EEO
   INSERT INTO user_divisions ("userId", "divisionId", "assignedAt")
   SELECT 
     u.id, 
     d.id, 
     NOW()
   FROM users u
   JOIN divisions d ON (
     CASE 
       WHEN u.division = 'IIO_EEO' THEN 'EEO'
       ELSE u.division::text
     END = d.code
   )
   WHERE u.division IS NOT NULL
   ON CONFLICT DO NOTHING;
   ```

### Tahap 3: Application Dual-Read & Cutover
1. Update kode backend (`auth.service.ts`, `auth.middleware.ts`, `authorization.policy.ts`) untuk membaca role dan divisi dari relasi `roles` dan `divisions`.
2. Validasi login dan otorisasi menggunakan helper `user.roles.some(...)`.

### Tahap 4: Contract (Pembersihan Kolom Usang)
1. Setelah aplikasi terbukti stabil dan verifikasi automated test lolos 100%:
   ```sql
   ALTER TABLE users DROP COLUMN IF EXISTS role;
   ALTER TABLE users DROP COLUMN IF EXISTS division;
   DROP TYPE IF EXISTS "Role";
   DROP TYPE IF EXISTS "Division";
   ```

---

## 4. Rollback Strategy (Emergency Fallback)

Jika selama proses migrasi ditemukan *critical failure* pada aplikasi:

1. **Revert Application Deployment:** Kembalikan commit aplikasi ke versi sebelum migrasi (commit `766f1b7`).
2. **Rollback SQL (Jika kolom lama belum dihapus):**
   - Kolom lama `users.role` dan `users.division` masih utuh, sehingga aplikasi lama langsung berjalan normal tanpa data loss.
3. **Rollback SQL Lengkap (Jika perlu membersihkan tabel baru):**
   ```sql
   DROP TABLE IF EXISTS "role_audit_logs" CASCADE;
   DROP TABLE IF EXISTS "user_roles" CASCADE;
   DROP TABLE IF EXISTS "user_divisions" CASCADE;
   DROP TABLE IF EXISTS "roles" CASCADE;
   DROP TABLE IF EXISTS "divisions" CASCADE;
   ALTER TABLE "users" DROP COLUMN IF EXISTS "tokenVersion";
   ALTER TABLE "users" DROP COLUMN IF EXISTS "isActive";
   ```

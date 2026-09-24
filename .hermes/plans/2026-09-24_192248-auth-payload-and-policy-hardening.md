# Plan: Hardening Auth Payload, Role Audit Logging, and QC Governance

- **Target Project**: `kanban-bncc-38`
- **File**: `.hermes/plans/2026-09-24_192248-auth-payload-and-policy-hardening.md`
- **Author**: Antigravity (Hermes Agent)
- **Status**: DRAFT / READY FOR REVIEW

---

## 1. Executive Summary & Objectives

Berdasarkan hasil council review verifikasi komprehensif pasca-seeding 19 akun kanonikal BNCC 38, ditemukan 4 area penyempurnaan penting agar sistem otorisasi dan kontrol akses tidak memiliki celah tersembunyi (*blind spots*):

1. **Kelengkapan Payload Auth API**: Endpoint `/api/auth/login` dan `/api/auth/me` saat ini belum mengembalikan array `roles`, `divisions`, dan flag `is_super_admin` ke client/frontend.
2. **Integritas Audit Log**: Tabel `RoleAuditLog` yang telah dibuat di skema database belum diisi saat mutasi peran/divisi dijalankan di `admin-authorization.controller.ts`.
3. **Penegakan Tata Tertib Anti-Self-Approval QC**: Pelaksana tugas (*assignee*) tidak boleh meloloskan QC kartunya sendiri (*maker != checker*), termasuk jika pelaksana tersebut adalah eksekutif/admin, guna menjaga transparansi dan akuntabilitas kepengurusan.
4. **Penyelarasan Tipe Frontend**: Interface `User` pada `frontend/src/context/AuthContext.tsx` diselaraskan agar kompatibel dengan data peran dan divisi terbaru.

---

## 2. Current State & Gap Analysis

| Komponen | Kondisi Saat Ini | Kebutuhan Target |
|---|---|---|
| **`auth.controller.ts`** | Hanya mengambil scalar `User` (`publicUserSelect`) tanpa relasi roles & divisions. | Menyertakan relasi `user_roles.role` dan `user_divisions.division` serta memformatnya menjadi array string (`roles: string[]`, `divisions: string[]`, `is_super_admin: boolean`). |
| **`admin-authorization.controller.ts`** | `assignRoles` & `assignDivisions` hanya menghapus & menambah relasi + increment `token_version`, tanpa membuat log ke `role_audit_logs`. | Memasukkan pencatatan `tx.roleAuditLog.create` di dalam Prisma transaction yang sama untuk tracking mutasi admin. |
| **`card.controller.ts` & `authorization.policy.ts`** | Rule anti-self-approval di-bypass jika user adalah Super Admin / C-Level (`!req.user?.is_super_admin`). | Penegakan ketat: siapapun yang tercatat sebagai assignee kartu dilarang me-review QC kartu tersebut (wajib di-review orang lain). |
| **`frontend/src/context/AuthContext.tsx`** | Interface `User` hanya memiliki `id, email, name, global_role`. | Ditambahkan optional property: `roles?: string[]`, `divisions?: string[]`, `is_super_admin?: boolean`. |

---

## 3. Step-by-Step Implementation Plan

### Phase 1: Backend Auth Payload Enhancement
- **File**: `backend/src/controllers/auth.controller.ts`
- **Langkah-langkah**:
  1. Buat helper function `formatAuthUser(user: any)` untuk mengekstrak roles, divisions, dan status super admin secara konsisten:
     ```typescript
     const formatAuthUser = (user: any) => {
       const roles = user.user_roles?.map((ur: any) => ur.role.code) || [];
       const divisions = user.user_divisions?.map((ud: any) => ud.division.code) || [];
       const is_super_admin =
         user.global_role === 'GLOBAL_ADMIN' ||
         roles.some((r: string) => ['SUPER_ADMIN', 'COO', 'CFO'].includes(r));

       return {
         id: user.id,
         email: user.email,
         name: user.name,
         global_role: user.global_role,
         roles,
         divisions,
         is_super_admin,
         token_version: user.token_version,
         is_active: user.is_active,
         created_at: user.created_at,
       };
     };
     ```
  2. Perbarui query `login` dan `getMe` dengan `include`:
     ```typescript
     include: {
       user_roles: { include: { role: true } },
       user_divisions: { include: { division: true } },
     }
     ```
  3. Kirimkan objek user terformat di respon `login` dan `getMe`.

### Phase 2: Audit Logging pada Mutasi Otorisasi
- **File**: `backend/src/controllers/admin-authorization.controller.ts`
- **Langkah-langkah**:
  1. Pada fungsi `assignRoles`:
     - Tambahkan pencatatan audit log di dalam `prisma.$transaction`:
       ```typescript
       await tx.roleAuditLog.create({
         data: {
           actor_id: actorId,
           target_user_id: userId,
           action: 'ROLE_ASSIGN',
           detail: `Assigned roles: ${roleCodes.join(', ')}`,
         },
       });
       ```
  2. Pada fungsi `assignDivisions`:
     - Tambahkan pencatatan audit log di dalam `prisma.$transaction`:
       ```typescript
       await tx.roleAuditLog.create({
         data: {
           actor_id: actorId,
           target_user_id: userId,
           action: 'DIVISION_ASSIGN',
           detail: `Assigned divisions: ${divisionCodes.join(', ')}`,
         },
       });
       ```

### Phase 3: Penegakan Anti-Self-Approval QC Tanpa Celah
- **Files**:
  - `backend/src/policies/authorization.policy.ts`
  - `backend/src/controllers/card.controller.ts`
- **Langkah-langkah**:
  1. Di `authorization.policy.ts`, pisahkan penegakan **Anti-Self-Approval** agar bersifat absolut:
     - Jika `actualUserId` terdaftar di dalam `card.assignees`, maka fungsi `canApproveQc` mengembalikan `false` secara mutlak.
     - Jika bukan assignee, evaluasi hak approval: `superAdmin || isBoardAdmin(member) || isKoorOfDivision(member, card.division_id)`.
  2. Di `card.controller.ts` (pada method `updateCard` dan `moveCard`):
     - Ubah pengecekan `if (isSelfAssigned)` agar menolak self-approval tanpa pengecualian `!req.user?.is_super_admin`:
       ```typescript
       if (isQcDecision(card.status, targetStatus)) {
         const isSelfAssigned = card.assignees.some((a) => a.user_id === userId);
         if (isSelfAssigned) {
           res.status(403).json({
             message: 'Self-approval dilarang: Pelaksana tugas tidak boleh menyetujui atau merevisi QC atas kartunya sendiri'
           });
           return;
         }
         if (!canApproveQc(member, req.user || globalRole, card, userId)) {
           res.status(403).json({
             message: 'Hanya Koor Divisi atau Admin yang berhak menyetujui/merevisi QC'
           });
           return;
         }
       }
       ```

### Phase 4: Penyelarasan Kontrak Frontend
- **File**: `frontend/src/context/AuthContext.tsx`
- **Langkah-langkah**:
  1. Perluas interface `User`:
     ```typescript
     export interface User {
       id: number;
       email: string;
       name: string;
       global_role: 'GLOBAL_ADMIN' | 'USER';
       roles?: string[];
       divisions?: string[];
       is_super_admin?: boolean;
       token_version?: number;
       is_active?: boolean;
       created_at?: string;
     }
     ```

### Phase 5: Pengujian & Verifikasi Komprehensif
- **Files**:
  - `backend/scripts/policy-test.cjs`
- **Langkah-langkah**:
  1. Perbarui skrip test harness `backend/scripts/policy-test.cjs`:
     - Tambahkan skenario: Super Admin / C-Level yang bertindak sebagai *assignee* kartu harus **DITOLAK** saat mencoba memindahkan status kartu dari `ON_QC` ke `DONE`.
     - Tambahkan skenario: Super Admin / C-Level yang **BUKAN** assignee kartu tetap **BERHAK** menyetujui/merevisi kartu tersebut.
  2. Eksekusi pengujian:
     - `node backend/scripts/policy-test.cjs`
     - `npm --prefix backend run build` (memastikan TypeScript backend 100% valid)
     - `npm --prefix frontend run build` (memastikan TypeScript frontend 100% valid)

---

## 4. Risks & Mitigations

1. **Risk: Breaking changes pada payload login/me di frontend**
   - *Mitigasi*: Format penambahan bersifat aditif (tidak menghapus field yang sudah ada seperti `id`, `name`, `email`, `global_role`).
2. **Risk: Admin terjebak tidak bisa approve kartu jika mereka adalah satu-satunya member board**
   - *Mitigasi*: Admin cukup menghapus dirinya dari daftar *assignee* kartu tersebut sebelum melakukan QC approval, atau meminta admin/koor lain yang meng-approve. Ini melatih disiplin pemisahan peran pelaksana vs pemeriksa.

---

## 5. Git Commit Strategy

Sesuai preferensi user (*commit tiap phase, jangan stage .gitignore lokal*):
- Commit: `feat(auth): enhance auth payload with roles, divisions, audit logging and strict qc anti-self-approval`
- File `.gitignore` lokal dipertahankan dan tidak disentuh.

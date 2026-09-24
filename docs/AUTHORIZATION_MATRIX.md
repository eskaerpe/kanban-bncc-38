# Authorization & Permission Matrix

**Project:** BNCC Proker Kanban  
**Repository:** `/mnt/d/Coding/kanban-bncc-38`  
**Status:** Approved Matrix Specification (Zero-TBD)  
**Governing Standard:** `docs/AUTHORIZATION_GLOSSARY.md`  

---

## 1. Matrix Overview & Policy Principles

Matriks ini mengatur seluruh kapabilitas sistem di tingkat **Global**, **Board**, **Card**, dan **Super Admin Administration**. Semua keputusan akses wajib mengikuti prinsip:
1. **Deny-by-Default:** Segala aksi yang tidak secara eksplisit diizinkan pada tabel ini dianggap terlarang (HTTP `403 Forbidden`).
2. **Explicit Super Admin Override:** Pengguna dengan Global Role `SUPER_ADMIN` memiliki otoritas bypass di semua aksi, namun seluruh tindakannya tetap dicatat di `ActivityLog` / `AuditLog`.
3. **No Self-Approval on QC:** User yang merupakan *last mover* atau *assignee* pada card `ON_QC` dilarang melakukan `Approve QC` pada card tersebut, kendatipun ia memiliki role `BOARD_ADMIN` atau `KOOR_DIVISION`.
4. **Scope-Aware Decision:** Izin review proker divisi tertentu mensyaratkan kecocokan antara divisi user (`UserDivision`) dengan divisi penanggung jawab card/board (`Card.divisionId` / `Board.divisionId`).

---

## 2. Global & Administrative Permissions (System-Level)

| Aksi Sistem / Fitur | Non-Authenticated | Authenticated Staff (Default) | Super Admin |
|---|:---:|:---:|:---:|
| **Public Self-Registration** (`POST /api/auth/register`) | ✅ Diizinkan (Kunci: role default `STAFF`) | ❌ Ditolak (`400 Bad Request`) | ❌ Ditolak |
| **Login & Token Issuance** (`POST /api/auth/login`) | ✅ Diizinkan | ✅ Diizinkan | ✅ Diizinkan |
| **Get Own Profile** (`GET /api/auth/me`) | ❌ (`401 Unauthorized`) | ✅ Diizinkan | ✅ Diizinkan |
| **View System Audit Logs** (`GET /api/admin/audit-logs`) | ❌ | ❌ (`403 Forbidden`) | ✅ Diizinkan |
| **List All Users** (`GET /api/admin/users`) | ❌ | ❌ (`403 Forbidden`) | ✅ Diizinkan |
| **Assign/Revoke Global Role** (`POST /api/admin/users/:id/roles`) | ❌ | ❌ (`403 Forbidden`) | ✅ Diizinkan |
| **Assign/Remove User Division** (`POST /api/admin/users/:id/divisions`) | ❌ | ❌ (`403 Forbidden`) | ✅ Diizinkan |
| **Deactivate/Enable User Account** (`PATCH /api/admin/users/:id/status`) | ❌ | ❌ (`403 Forbidden`) | ✅ Diizinkan |
| **List Master Divisions** (`GET /api/lookup/divisions`) | ❌ | ✅ Diizinkan | ✅ Diizinkan |

---

## 3. Board Management Permissions

Otoritas pada level board ditentukan oleh peran anggota pada papan tersebut (`BoardMember.role`) atau status `SUPER_ADMIN`:

| Aksi Board | Non-Member / Staff Biasa | Board Viewer | Board Member | Board Admin | Super Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| **List Public / User Boards** (`GET /api/boards`) | ✅ (Hanya board publik / membership miliknya) | ✅ | ✅ | ✅ | ✅ (Melihat semua board) |
| **View Board Detail** (`GET /api/boards/:id`) | ❌ Jika board privat (`403`) | ✅ | ✅ | ✅ | ✅ |
| **Create New Board** (`POST /api/boards`) | ❌ (`403 Forbidden`) | ❌ | ❌ | ✅ | ✅ |
| **Update Board Metadata** (`PUT /api/boards/:id`) | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Archive / Delete Board** (`DELETE /api/boards/:id`) | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Invite / Add Board Member** (`POST /api/boards/:id/members`) | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Update Board Member Role** (`PUT /api/boards/:id/members/:userId`) | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Remove Board Member** (`DELETE /api/boards/:id/members/:userId`) | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## 4. Card & Task Operations (Kanban Workflow)

| Aksi Card | Board Viewer | Board Member (Bukan Assignee) | Board Member (Assignee Card) | Board Admin | Super Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| **Create Card** (`POST /api/cards`) | ❌ | ✅ | ✅ | ✅ | ✅ |
| **View Card Detail & Activity** (`GET /api/cards/:id`) | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Edit Title / Description / Due Date** (`PUT /api/cards/:id`) | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Assign / Unassign Member** (`POST /api/cards/:id/assignees`) | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Add Attachment** (`POST /api/cards/:id/attachments`) | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Delete Attachment** (`DELETE /api/cards/:id/attachments/:attId`) | ❌ | ❌ | ✅ (Hanya uploadernya) | ✅ | ✅ |
| **Delete Card** (`DELETE /api/cards/:id`) | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## 5. QC Workflow & State Transition Matrix (Strict FSM)

Aturan pergerakan status card diatur sangat ketat untuk menjamin *quality control*:

| Transisi Status | Prasyarat Bisnis | Siapa yang Berwenang Mengeksekusi? | Syarat Tambahan & Validasi |
|---|---|---|---|
| `TO_DO` → `ON_PROGRESS` | Minimal 1 Assignee terpasang pada card. | Assignee Card, Board Admin, Super Admin | Mengubah status aktivitas menjadi aktif dikerjakan. |
| `ON_PROGRESS` → `ON_QC` | Catatan pengerjaan dan/atau attachment bukti proker telah dilampirkan. | Assignee Card, Board Admin, Super Admin | Card dikunci dari editing deskripsi minor oleh staf selama masa QC. |
| `ON_QC` → `DONE` (**Approve QC**) | Hasil pekerjaan memenuhi standar mutu divisi. | **Board Admin / Koor Divisi / Super Admin** | **ATURAN SEPARATION OF DUTIES:** Dilarang self-approve jika eksekutor adalah Assignee card tersebut. |
| `ON_QC` → `REVISION` (**Reject QC**) | Terdapat kekurangan pada hasil pekerjaan. | **Board Admin / Koor Divisi / Super Admin** | **Wajib menyertakan `revisionNote`** yang disimpan secara permanen di riwayat `Revision`. |
| `REVISION` → `ON_PROGRESS` | Assignee telah membaca catatan revisi dan siap memperbaiki. | Assignee Card, Board Admin, Super Admin | Card kembali ke siklus kerja pengerjaan revisi. |
| `DONE` → Status Lain | Proker yang sudah selesai dibuka kembali untuk investigasi/audit. | **Hanya Board Admin & Super Admin** | Memerlukan alasan pembukaan kembali di log aktivitas. |

---

## 6. Implementation Reference: Centralized Policy Predicates

Di tingkat kode (`backend/src/policies/authorization.policy.ts` dan `workflow.policy.ts`), matriks di atas diimplementasikan via fungsi murni (*pure functions*):

```typescript
export function canApproveQC(params: {
  userId: string;
  isSuperAdmin: boolean;
  isBoardAdmin: boolean;
  isDivisionKoor: boolean;
  isAssignee: boolean;
}): { allowed: boolean; reason?: string } {
  if (params.isSuperAdmin) return { allowed: true };
  if (params.isAssignee) {
    return { allowed: false, reason: "Self-approval is strictly forbidden on QC review." };
  }
  if (params.isBoardAdmin || params.isDivisionKoor) {
    return { allowed: true };
  }
  return { allowed: false, reason: "Insufficient permissions to approve QC." };
}
```

---

## 7. Audit & Verification

Setiap keputusan penolakan otorisasi menghasilkan HTTP `403` dengan struktur seragam:
```json
{
  "success": false,
  "error": "FORBIDDEN",
  "message": "Insufficient permissions to approve QC.",
  "code": "AUTH_INSUFFICIENT_PERMISSIONS"
}
```
Tidak ada `TBD` yang tersisa. Matriks ini resmi menjadi tolok ukur pengujian unit test dan integration test sistem.

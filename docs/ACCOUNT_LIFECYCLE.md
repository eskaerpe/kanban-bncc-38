# Account Lifecycle & Authorization Management Specification

**Project:** BNCC Proker Kanban  
**Repository:** `/mnt/d/Coding/kanban-bncc-38`  
**Status:** Approved Lifecycle Standard  
**Governing Standard:** `docs/AUTHORIZATION_GLOSSARY.md` & `docs/AUTHORIZATION_MATRIX.md`  

---

## 1. Scope & Objective

Dokumen ini mengatur siklus hidup akun pengguna (*account lifecycle*) mulai dari pendaftaran mandiri (*self-registration*), verifikasi, penetapan peran/divisi oleh Super Admin, penanganan sesi JWT dan invalidasi token saat privilege dicabut, hingga deaktivasi akun dan pencatatan audit trail.

---

## 2. Account State Machine

Setiap akun pengguna memiliki state transisi yang jelas:

```
                  ┌───────────────────────┐
                  │   Self-Registration   │
                  │ (Endpoint: /register) │
                  └───────────┬───────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │     ACTIVE_STAFF      │  ◄── Default status saat mendaftar
                  │ (Role: STAFF, No Div) │
                  └───────────┬───────────┘
                              │
             ┌────────────────┼────────────────┐
             │                                 │
             ▼                                 ▼
┌───────────────────────────┐     ┌───────────────────────────┐
│     ELEVATED_MEMBER       │     │        DEACTIVATED        │
│ (Assigned Role & Division │     │  (Disabled by SuperAdmin, │
│      by Super Admin)      │     │      Token Invalidated)   │
└────────────┬──────────────┘     └────────────▲──────────────┘
             │                                 │
             └─────────────────────────────────┘
```

### State Definitions:
1. **`ACTIVE_STAFF`:** Akun yang baru mendaftar secara mandiri. Memiliki akses login, dapat melihat profil diri, melihat board publik, tetapi belum memiliki divisi atau peran manajerial.
2. **`ELEVATED_MEMBER`:** Pengguna yang telah diberikan role tambahan (`SUPER_ADMIN`) dan/atau scope divisi (`PR`, `EEO`, `HRD`, `RND`, `LNT`) oleh Super Admin.
3. **`DEACTIVATED`:** Akun dinonaktifkan oleh Super Admin (misal: alumni, non-aktif, atau pelanggaran keamanan). Seluruh request API ditolak (`403 Account Inactive`).

---

## 3. Self-Registration Contract (Secure Default)

### 3.1 Endpoint & Payload
- **URL:** `POST /api/auth/register`
- **Payload Input:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane.doe@binus.ac.id",
    "password": "SecurePassword123!"
  }
  ```
- **Aturan Validasi Keras:**
  1. Input `role` dan `division` **DILARANG KERAS** diterima dari request body. Jika dikirim oleh klien, backend wajib mengabaikannya (*strip off*) atau menolaknya via Zod validation schema.
  2. Password minimal 8 karakter dengan kombinasi angka dan huruf.
  3. Format email wajib valid.
  4. Akun yang baru terdaftar **otomatis** disematkan relasi `UserRole` dengan role `STAFF`.

### 3.2 Response
- Mengembalikan profil dasar user dan token JWT berstatus role dasar.

---

## 4. Super Admin Role & Division Management (Discord-Style RBAC)

Super Admin mengelola otorisasi anggota melalui endpoint terproteksi (`requireSuperAdmin` middleware):

### 4.1 Assign / Revoke Global Role
- **URL:** `POST /api/admin/users/:userId/roles`
- **Method:** `POST` (Assign), `DELETE` (Revoke)
- **Payload:**
  ```json
  {
    "role": "SUPER_ADMIN"
  }
  ```
- **Constraint:**
  - Minimal harus tersisa 1 `SUPER_ADMIN` aktif dalam sistem untuk mencegah *system lockout* permanen.
  - User tidak dapat mencabut role `SUPER_ADMIN` miliknya sendiri jika ia adalah satu-satunya super admin aktif.

### 4.2 Assign / Remove User Division
- **URL:** `POST /api/admin/users/:userId/divisions`
- **Method:** `POST` (Assign), `DELETE` (Remove)
- **Payload:**
  ```json
  {
    "divisionCode": "RND"
  }
  ```
- **Validasi:** `divisionCode` wajib salah satu dari `["PR", "EEO", "HRD", "RND", "LNT"]`.

---

## 5. Token Invalidation & Session Revocation Policy

Salah satu celah kritis pada sistem JWT stateless adalah jika hak akses dicabut di database, token lama masih berlaku hingga expired. Sistem menerapkan mekanisme **Active Invalidation**:

1. **Kolom `tokenVersion` pada Model `User`:**
   - Model `User` memiliki kolom integer `tokenVersion Int @default(1)`.
   - Token JWT memuat klaim: `{ userId, email, tokenVersion }`.
2. **Event Pemicu Kenaikan `tokenVersion`:**
   - Role user dicabut atau diubah oleh Super Admin.
   - Status user diubah menjadi `DEACTIVATED`.
   - User melakukan reset password atau logout paksa.
3. **Pengecekan Middleware (`auth.middleware.ts`):**
   - Middleware memverifikasi token dan memeriksa kecocokan `tokenVersion` user di cache/database.
   - Jika `token.tokenVersion !== dbUser.tokenVersion`, request langsung ditolak dengan `401 Unauthorized (Token Revoked)`.

---

## 6. Audit Trail Logging (Security Audit)

Setiap perubahan hak akses, penetapan divisi, dan pengubahan status akun **wajib** dicatat secara permanen pada tabel `RoleAuditLog` / `AuditLog`:

### 6.1 Schema Event Audit
| Field | Tipe Data | Deskripsi |
|---|---|---|
| `id` | String (UUID/CUID) | Primary key log |
| `actorId` | String | ID Super Admin yang melakukan perubahan |
| `targetUserId` | String | ID User yang hak aksesnya diubah |
| `action` | Enum (`ROLE_ASSIGN`, `ROLE_REVOKE`, `DIVISION_ASSIGN`, `DIVISION_REMOVE`, `USER_DEACTIVATE`) | Jenis tindakan |
| `detail` | JSON | Payload detail (role/divisi yang diubah, alasan) |
| `ipAddress` | String? | Alamat IP pemohon |
| `createdAt` | DateTime | Waktu eksekusi mutasi |

---

## 7. Account Deactivation & Purge

- **Soft Delete / Deactivation:** Sistem menggunakan `isActive Boolean @default(true)`. Akun tidak langsung dihapus permanen (*hard delete*) untuk menjaga integritas relasi foreign key pada `ActivityLog`, `Card`, `Revision`, dan `Attachment`.
- **Ekspektasi saat Deactivated:**
  - Token lama langsung kedaluwarsa via `tokenVersion`.
  - Percobaan login ditolak: `"Akun Anda telah dinonaktifkan. Silakan hubungi Super Administrator."`
  - Nama akun pada board history tetap tampil dengan badge `(Inactive)`.

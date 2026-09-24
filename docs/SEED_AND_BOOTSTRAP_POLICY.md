# Seeding & Bootstrap Policy Specification

**Project:** BNCC Proker Kanban  
**Repository:** `/mnt/d/Coding/kanban-bncc-38`  
**Status:** Approved Seeding Standard  
**Security Level:** High / Zero-Credential Leakage  
**Governing Standard:** `docs/AUTHORIZATION_GLOSSARY.md` & `docs/AUTHORIZATION_MIGRATION_MAP.md`  

---

## 1. Executive Summary

Dokumen ini menetapkan aturan baku (*policy*) untuk inisialisasi awal sistem (*system bootstrap*) dan pengisian data master (*seeding*). Fokus utama adalah mencegah kebocoran kredensial (*zero-credential leakage*), menjamin *idempotency* script seeder, serta memisahkan secara tegas antara data master resmi organisasi dengan data tiruan (*mock data*) pengujian.

---

## 2. Master Divisions Seeding Policy (The 5 BNCC Divisions)

Sistem BNCC Proker Kanban memiliki **5 divisi resmi** yang menjadi master scope organisasi:

| Kode | Nama Resmi | Deskripsi |
|---|---|---|
| `PR` | Public Relations | Hubungan masyarakat, branding, publikasi, dan komunikasi eksternal |
| `EEO` | Event & External Organization | Penyelenggaraan event proker, lomba, expo, dan hubungan organisasi eksternal |
| `HRD` | Human Resource Development | Manajemen SDM, keanggotaan, evaluasi anggota, dan kaderisasi |
| `RND` | Research & Development | Riset teknologi, inovasi produk digital, dan rekayasa perangkat lunak |
| `LNT` | Learning & Training | Kurikulum pembelajaran, pelatihan teknis, dan sertifikasi |

### 2.1 Idempotency Guarantee
Script seed master divisi wajib bersifat *idempotent* menggunakan operasi `upsert`:
```typescript
const divisions = [
  { code: 'PR', name: 'Public Relations' },
  { code: 'EEO', name: 'Event & External Organization' },
  { code: 'HRD', name: 'Human Resource Development' },
  { code: 'RND', name: 'Research & Development' },
  { code: 'LNT', name: 'Learning & Training' },
];

for (const div of divisions) {
  await prisma.division.upsert({
    where: { code: div.code },
    update: { name: div.name },
    create: {
      code: div.code,
      name: div.name,
      description: `Divisi resmi BNCC: ${div.name}`
    }
  });
}
```

---

## 3. Master Roles Seeding Policy

Sistem memiliki **4 peran baku (*system roles*)**:

| Kode Role | Nama | Sifat | Deskripsi |
|---|---|---|---|
| `SUPER_ADMIN` | Super Administrator | `isSystem: true` | Otoritas penuh sistem, manajemen user, role, dan divisi |
| `BOARD_ADMIN` | Board Administrator | `isSystem: true` | Hak mengelola board, anggota board, dan proker |
| `KOOR_DIVISION` | Division Coordinator | `isSystem: true` | Hak meninjau, menyetujui, dan menolak QC kartu divisi |
| `STAFF` | Staff Member | `isSystem: true` | Peran dasar anggota pelaksana proker |

Script seed master roles juga wajib menggunakan pola `upsert` pada `code`.

---

## 4. Super Admin Bootstrap Policy (Zero-Credential Leakage)

### 4.1 Larangan Keras (*Strict Prohibitions*)
1. **DILARANG KERAS** menuliskan email atau password akun Super Admin secara hardcoded di dalam repository, script git, atau dokumen markdown publik.
2. **DILARANG KERAS** meng-commit file `.env` atau `credentials.txt` ke dalam riwayat version control.

### 4.2 Prosedur Bootstrap yang Disetujui
Inisialisasi akun Super Admin pertama dilakukan melalui **CLI Bootstrap Script** mandiri:

```bash
# Jalankan script bootstrap dengan environment variable transient
BOOTSTRAP_ADMIN_NAME="Super Admin BNCC" \
BOOTSTRAP_ADMIN_EMAIL="admin@bncc.net" \
BOOTSTRAP_ADMIN_PASSWORD="SecureTempPassword123!" \
npm --prefix backend run bootstrap:admin
```

#### Alur Kerja Script `bootstrap:admin`:
1. Membaca `BOOTSTRAP_ADMIN_EMAIL` dan `BOOTSTRAP_ADMIN_PASSWORD` dari process environment.
2. Memvalidasi bahwa password memenuhi syarat kompleksitas (minimal 10 karakter, alfanumerik + simbol).
3. Melakukan hashing password menggunakan `bcrypt` (work factor / salt rounds minimal 10).
4. Melakukan `upsert` pada tabel `users`.
5. Mengaitkan user tersebut dengan `Role` bernilai `SUPER_ADMIN` dan `STAFF` pada tabel `user_roles`.
6. Mencatat audit log awal (*System Bootstrap Event*).
7. Menghapus variabel kredensial dari memori dan keluar dengan exit code 0.

---

## 5. Pemisahan Lingkungan (Environment Separation)

| Komponen | Development (`NODE_ENV=development`) | Production (`NODE_ENV=production`) |
|---|---|---|
| Master Divisions (5) | Wajib di-seed (`npm run seed:master`) | Wajib di-seed (`npm run seed:master`) |
| Master Roles (4) | Wajib di-seed (`npm run seed:master`) | Wajib di-seed (`npm run seed:master`) |
| Super Admin | Di-bootstrap via env/cli | Di-bootstrap oleh DevOps/Owner via CLI terisolasi |
| Mock Users / Board Dummy | Diizinkan via `npm run seed:mock` | **DILARANG KERAS** dijalankan |

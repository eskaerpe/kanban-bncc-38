# Sprint 1: Foundation, Auth & User Management

## Goal
Membangun fondasi project, koneksi database MySQL, modul autentikasi JWT (Login/Register), dan sistem hak akses dasar.

## Tasks Breakdown

### Task 1.1: Prisma Schema & Database Migration
- **Description**: Buat file `prisma/schema.prisma` yang mendefinisikan model-model sesuai `docs/data-model.md` (`User`, `Division`, `Board`, `BoardMember`, `Card`, `CardAssignee`, `CardAttachment`, `CardRevision`, `CardActivity`).
- **Acceptance Criteria**:
  - Schema Prisma valid (`npx prisma validate`).
  - Relasi dan cascade delete (`onDelete: Cascade`) terdefinisi tepat.
  - Memiliki script seed (`prisma/seed.ts`) untuk divisi standar BNCC (`Public Relations`, `Creative Team`, `Acara`, `Perlengkapan`).
  - Generate Prisma Client (`npx prisma generate`).

### Task 1.2: Express Server Setup & JWT Auth API
- **Description**: Siapkan Express server dengan CORS, body-parser, Prisma Client (`@prisma/client`), dan JWT middleware.
- **Endpoints**:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- **Acceptance Criteria**:
  - Password tersimpan menggunakan `bcrypt` hashing (min 10 rounds).
  - Endpoint `login` mengembalikan JWT token dengan payload `{ id, email, global_role }`.
  - Middleware `authenticateJWT` menolak request tanpa header `Authorization: Bearer <token>`.

### Task 1.3: Frontend Auth UI & Context
- **Description**: Buat Halaman Login & Register di React dengan Tailwind CSS serta setup AuthContext untuk mengelola state user login.
- **Acceptance Criteria**:
  - Form memiliki validasi format email & password minimal 6 karakter.
  - JWT token tersimpan di `localStorage`.
  - Redirect otomatis ke Dashboard jika user sudah terautentikasi.

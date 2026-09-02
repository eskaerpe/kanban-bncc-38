# Product Requirement Document (PRD) — BNCC Proker Kanban

## 1. Executive Summary & Core Objective
BNCC Proker Kanban adalah aplikasi manajemen tugas berbasis board (fork & modifikasi konsep Planka) yang didesain khusus untuk kebutuhan alur kerja Program Kerja (Proker) di BNCC. Aplikasi ini memfasilitasi kolaborasi lintas divisi dengan kontrol akses ketat (*per-board role*), *quality control gatekeeper*, catatan revisi transparan, Notion-style card modal, dan audit log otomatis.

## 2. Target Users & User Roles

### 2.1 Global Roles (Sistem-Wide)
- **Global Admin (C-Level / DPI BNCC & Manager BNCC)**: Memiliki akses penuh ke seluruh board proker, manajemen user, manajemen divisi global, serta bypass permission (*Override Permission*).

### 2.2 Board-Level Roles (Per-Board Proker)
- **Board Admin / DPI Event (Ketua & Sekretaris Pelaksana)**: Membuat & mengelola board proker, mengundang anggota, menentukan divisi yang terlibat di proker.
- **Koor Divisi**: Kepala divisi tertentu pada proker (misal: Koor Creative di Proker A). Memiliki hak *QC Gatekeeper* untuk card divisi tersebut.
- **Staff / Aktivis**: Anggota divisi pada proker. Memiliki hak edit & pindahkan card yang di-assign kepadanya / divisinya.

## 3. Product Phase Scope

### 3.1 Phase 1 (MVP Scope — WAJIB)
- **Auth**: JWT Authentication (Register/Login Email + Password), tanpa OAuth.
- **Board Proker Management**: CRUD Board Proker, Status Board (`Active`, `Archived`).
- **5 Standard Columns**: `TO DO` -> `On Progress` -> `On QC` -> `Revision` -> `Done`.
- **Division Tagging**: Card memiliki 1 Tag Divisi (misal: `Public Relations`, `Creative Team`, `Acara`, `Perlengkapan`).
- **Multi-Assignee per Card**: Card dapat di-assign ke 1 atau lebih anggota divisi terkait.
- **Priority Level Badge**: `Low`, `Mid`, `High`.
- **Due Date & Overdue Badge**: Tanggal tenggat + penanda visual jika lewat tenggat.
- **Link Attachments**: Melampirkan link (URL ter-validasi http/https, seperti Figma/Drive) tanpa upload binary.
- **Notion-Style Card Modal**: Property grid vertikal di bagian atas (Status, Assignees, Division, Priority, Due Date, Links), Rich-text Description, dan Audit Log / Catatan Revisi di bawah.
- **Per-Board Access Control**: Anggota hanya bisa melihat semua/divisi lain, tapi hanya bisa edit/geser card milik divisinya / assignment-nya.
- **QC Gatekeeper & Revision Note**:
  - Pindah dari `On QC` ke `Done` atau `Revision` hanya boleh oleh Koor Divisi terkait, DPI Event, Manager BNCC, & C-Level BNCC.
  - Saat card dipindahkan ke `Revision`, modal **Catatan Revisi** WAJIB diisi.
  - Card di `Revision` dapat ditarik kembali ke `On Progress` / `On QC` oleh Staff Divisi setelah diperbaiki.
- **Filter Board**: Filter tampilan card berdasarkan: Divisi Saya / Semua Divisi / Divisi Tertentu / Priority / Due Date.
- **Audit Log / Activity Trail**: Catatan riwayat aksi otomatis di setiap card (misal: perpindahan status, catatan revisi, pergantian assignee).

### 3.2 Non-Goals (Out of Scope for v1)
- Binary file upload ke local server / S3.
- Integrasi OAuth / Google / NIM SSO BNCC.
- Real-time notification via Email / Telegram / Push Notification (hanya UI update).
- Custom column creation (kolom dikunci ke 5 status standar).

## 4. Tech Stack & Architecture Assumptions

### 4.1 Tech Stack
- **Frontend**: React.js + Tailwind CSS + Drag and Drop library (`dnd-kit`).
- **Backend**: Express.js (Node.js REST API) + Prisma ORM.
- **Database**: MySQL 8.0 (dikoneksikan via Prisma Client).
- **Authentication**: JSON Web Token (JWT) + bcrypt pass hashing.

### 4.2 Assumptions & Constraints
- Database relational (MySQL) dipilih sesuai stack standar BNCC.
- Role bersifat per-board, tersimpan dalam tabel pivot `board_members` (`user_id`, `board_id`, `role`, `division_id`).
- Audit log disimpan di tabel `card_activities` untuk transparansi audit kepengurusan.

## 5. Non-Functional Requirements
- **Security**: Validasi JWT di setiap endpoint sensitif, validasi role & division ID di backend level middleware (bukan sekadar UI hiding).
- **Performance**: Dashboard board load time < 500ms P95.
- **Input Validation**: URLs wajib diawali `http://` atau `https://`. Catatan revisi minimal 5 karakter.

# Sprint 2: Board Proker & Role Management

## Goal
Membangun manajemen Board Proker (CRUD, Active/Archived status) dan manajemen anggota per-board (*Board Members Roles & Division Assignment*).

## Tasks Breakdown

### Task 2.1: Backend Board & Member API
- **Description**: Buat endpoint API untuk mengelola Board Proker dan anggota di dalamnya.
- **Endpoints**:
  - `POST /api/boards` (Create Board — DPI Event / C-Level / Manager).
  - `GET /api/boards` (Get user's boards).
  - `GET /api/boards/:id` (Get board detail + columns + members).
  - `PUT /api/boards/:id/status` (Archive / Activate Board).
  - `POST /api/boards/:id/members` (Add member to board with role & division).
- **Acceptance Criteria**:
  - Validasi bahwa hanya `BOARD_ADMIN`, `GLOBAL_ADMIN`, atau `Manager BNCC` yang bisa menambah/mengubah status board dan anggota.

### Task 2.2: Proker Dashboard Page (Frontend)
- **Description**: Halaman dashboard utama (`/`) yang menampilkan grid card proker aktif dan terarsip.
- **Acceptance Criteria**:
  - Grid card menampilkan judul proker, jumlah divisi terlibat, dan status badge (`Active` / `Archived`).
  - Tombol `+ New Board` membuka modal form untuk input judul proker & deskripsi.

### Task 2.3: Board Member & Settings Page UI
- **Description**: Halaman pengaturan board (`/board/:id/settings`) untuk melihat dan mengedit daftar anggota proker.
- **Acceptance Criteria**:
  - Tabel anggota menampilkan Nama, Email, Role (`Board Admin`, `Koor Division`, `Staff`), dan Divisi Assigned.
  - Dropdown role dan divisi dapat diubah oleh Board Admin.

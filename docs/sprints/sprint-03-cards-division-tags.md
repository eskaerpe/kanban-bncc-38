# Sprint 3: Kanban Board & Division Tagging

## Goal
Membangun tampilan Kanban Board 5 kolom dengan fitur Drag and Drop (`dnd-kit`), filter divisi, dan penandaan card per divisi.

## Tasks Breakdown

### Task 3.1: 5 Columns Kanban Layout & DnD Setup
- **Description**: Buat layout Kanban 5 kolom horisontal (`TO DO`, `On Progress`, `On QC`, `Revision`, `Done`) menggunakan library `dnd-kit`.
- **Acceptance Criteria**:
  - Kolom disusun dari kiri ke kanan dengan header judul kolom & counter jumlah card.
  - Card dapat didrag dan didrop antar kolom dengan animasi yang mulus.

### Task 3.2: Card Component UI & Division Badges
- **Description**: Komponen visual card di dalam kolom board.
- **Acceptance Criteria**:
  - Menampilkan Title card.
  - Tag Divisi dalam bentuk pill badge berwarna (misal: PR = Biru, Creative = Ungu).
  - Badge Priority (`Low` = Hijau, `Mid` = Kuning, `High` = Merah).
  - Badge Due Date (Warna Merah jika tanggal < hari ini).
  - Icon avatar untuk multi-assignee.

### Task 3.3: Filter Bar & Board Filter State
- **Description**: Filter bar di atas Kanban board untuk menyaring card yang ditampilkan.
- **Acceptance Criteria**:
  - Pilihan filter: `Semua Divisi`, `Divisi Saya Only`, filter per Divisi Spesifik (`Creative`, `PR`, dll), dan Priority.
  - State filter mengubah tampilan card tanpa me-reload halaman.

### Task 3.4: Backend Card CRUD & Position Endpoints
- **Description**: Endpoint API backend untuk mengelola card dan urutan posisi card.
- **Endpoints**:
  - `POST /api/cards`
  - `PUT /api/cards/:id/position`
- **Acceptance Criteria**:
  - Posisi card (`position` integer) ter-update di database MySQL saat didrag.

# Sprint 5: QC Gatekeeper, Revision Loop & Audit Log

## Goal
Mengunci alur QC (*Quality Control Gatekeeper*), mewajibkan catatan revisi saat reject card, dan mencatat riwayat aktivitas otomatis (*Audit Trail*).

## Tasks Breakdown

### Task 5.1: Backend QC Gatekeeper Middleware & Permission Check
- **Description**: Middleware backend untuk membatasi perpindahan status card dari `On QC` ke `Done` atau `Revision`.
- **Acceptance Criteria**:
  - Jika target status = `Done` atau `Revision` DARI `On QC`, cek role user di board:
    - Diizinkan: `KOOR_DIVISION` (dari divisi card), `BOARD_ADMIN` (DPI Event), `GLOBAL_ADMIN` (C-Level), atau `Manager BNCC`.
    - Ditolak (`403 Forbidden`): Staff biasa.

### Task 5.2: Mandatory Revision Note Modal (Frontend & Backend)
- **Description**: Form input catatan revisi saat card didrag atau diubah statusnya ke `Revision`.
- **Acceptance Criteria**:
  - Modal pop-up meminta input teks "Catatan Revisi" (minimal 5 karakter).
  - Data tersimpan ke tabel `card_revisions` dan status card berubah ke `Revision`.
  - Staff divisi dapat melihat catatan ini di Notion Card Modal dan menarik kembali card ke `On Progress` / `On QC` setelah selesai revisi.

### Task 5.3: Automated Activity Audit Log
- **Description**: Sistem pencatatan otomatis setiap aksi penting di card.
- **Acceptance Criteria**:
  - Setiap perpindahan status, perubahan assignee, dan penambahan catatan revisi otomatis membuat row di `card_activities`.
  - Log aktivitas ditampilkan di bagian bawah Notion Card Modal secara kronologis (Waktu WIB + User + Keterangan Aksi).

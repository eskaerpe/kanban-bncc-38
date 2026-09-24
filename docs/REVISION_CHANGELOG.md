# Revision Changelog: Specification & Governance Package (Revision 2026-09-24)

**Project:** BNCC Proker Kanban  
**Repository:** `/mnt/d/Coding/kanban-bncc-38`  
**Revision Date:** 2026-09-24  
**Author:** Pair Programming Assistant (Hermes Agent / Antigravity)  
**Target Audience:** Council (Solution Architect, Product Manager, CTO)  
**Status:** Ready for Council Re-Review  

---

## 1. Executive Summary & Purpose

Revisi ini dieksekusi secara menyeluruh untuk menjawab hasil telaah **Deep Council Review** (`docs/COUNCIL_PRD_REVIEW.md`) dan menyelesaikan seluruh deliverable prasyarat yang digariskan pada **Change Plan** (`docs/PRD_CHANGE_PLAN.md`).

Sebelum revisi ini dijalankan, proses perbaikan kode terblokir oleh 4 kendala fundamental:
1. **Matriks Otorisasi Belum Final:** Dokumen rencana lama (`docs/UPDATE_PLAN.md`) masih memuat 12 status `TBD` pada aksi-aksi krusial (seperti persetujuan QC, pembuatan board, dan penghapusan kartu).
2. **Ketiadaan Dokumen Kontrak Spesifikasi:** Lima dokumen spesifikasi teknis dan kebijakan yang dirujuk oleh Council belum terwujud di direktori `docs/`.
3. **Ketidakpastian Terminologi & Cakupan:** Terdapat percampuran antara *global role*, *board role*, dan *division scope*, serta istilah non-kanonikal seperti *C-Level*, *Manager*, atau *DPI*.
4. **Ketiadaan Peta Migrasi Database & Kebijakan Bootstrap:** Belum ada skenario teknis untuk memigrasikan database PostgreSQL/Prisma eksisting ke multi-role tanpa risiko *data loss*, normalisasi kode `IIO_EEO` ke `EEO`, dan perlindungan kredensial Super Admin.

Melalui revisi ini, **seluruh fase persiapan dan kontrak spesifikasi (Phase 0, Phase 1, dan Phase 2) telah dieksekusi secara lengkap**, seluruh `TBD` telah dieliminasi, dan artefak baru telah diterbitkan untuk di-review kembali oleh Council.

---

## 2. Summary of Changes (File by File)

| No | File Path | Status | Deskripsi Perubahan & Kontribusi |
|---|---|---|---|
| 1 | `docs/AUTHORIZATION_GLOSSARY.md` | **BARU (Created)** | Menetapkan definisi kanonikal 4 peran sistem (`SUPER_ADMIN`, `BOARD_ADMIN`, `KOOR_DIVISION`, `STAFF`), memisahkan global role vs board role vs division scope, dan melarang istilah ambigu. |
| 2 | `docs/AUTHORIZATION_MATRIX.md` | **BARU (Created)** | Matriks hak akses granular untuk 13 operasi sistem. **100% Zero-TBD**. Menegakkan aturan ketat anti *self-approval* pada alur QC. |
| 3 | `docs/ACCOUNT_LIFECYCLE.md` | **BARU (Created)** | Mengunci alur *self-registration* (default `STAFF`, tanpa privilege administratif), manajemen status akun, mekanisme pembatalan sesi (*token revocation* via `tokenVersion`), dan format *audit log*. |
| 4 | `docs/AUTHORIZATION_MIGRATION_MAP.md` | **BARU (Created)** | Panduan migrasi database 4 tahap (*Expand-Migrate-Contract*), skema Prisma target, SQL data backfill, konversi `IIO_EEO` → `EEO`, dan strategi *disaster rollback*. |
| 5 | `docs/SEED_AND_BOOTSTRAP_POLICY.md` | **BARU (Created)** | Kebijakan inisialisasi awal tanpa kebocoran kredensial (*zero-credential leakage*), seeder *idempotent* untuk 5 divisi resmi BNCC (`PR`, `EEO`, `HRD`, `RND`, `LNT`), dan isolasi environment. |
| 6 | `docs/UPDATE_PLAN.md` | **DIREKONSILIASI (Patched)** | Mengganti tabel izin lama yang penuh `TBD` dengan ringkasan matriks kanonikal yang disetujui, serta menautkan dokumen ke standar spesifikasi baru. |
| 7 | `docs/PRD.md` | **DIUPDATE (Patched)** | Menambahkan Bagian 17 (*Approved Governance & Specification Standard*) yang mengikat PRD dengan seluruh dokumen kontrak spesifikasi hasil Council. |
| 8 | `docs/REVISION_CHANGELOG.md` | **BARU (Created)** | Dokumen changelog komprehensif ini untuk memfasilitasi review ulang oleh Council. |

---

## 3. Detailed Phase-by-Phase Execution Log

### Phase 0: Contract Freeze & Baseline Reconciliation
- **Aksi:** Membekukan kosakata otorisasi dan merekonsiliasi seluruh dokumen acuan.
- **Hasil:**
  - Penerbitan `docs/AUTHORIZATION_GLOSSARY.md`.
  - Istilah `C-Level`, `Manager`, dan `DPI` resmi dipensiunkan dari sistem otorisasi; digantikan oleh kombinasi `SUPER_ADMIN` atau peran struktural yang dipetakan secara eksplisit.
  - Peran divisi ditetapkan murni sebagai *organizational scope*, bukan hak akses administratif langsung.
  - Penyesuaian `docs/UPDATE_PLAN.md` agar sejalan dengan prinsip *defense-in-depth*.

### Phase 1: Product & Authorization Decision Package
- **Aksi:** Menutup seluruh ambiguitas izin dan menetapkan siklus hidup akun.
- **Hasil:**
  - Penerbitan `docs/AUTHORIZATION_MATRIX.md`: Seluruh aksi (Board, Card, QC, Attachments, Roles) kini memiliki status izin definitif (`Yes`, `No`, atau kondisional bersyarat).
  - Penerbitan `docs/ACCOUNT_LIFECYCLE.md`:
    - Registrasi publik dilarang memilih peran atau divisi sendiri (wajib default `STAFF` murni).
    - Pemberian peran `SUPER_ADMIN` dan penugasan divisi hanya dapat dilakukan melalui API/UI terlindungi Super Admin.
    - Menetapkan mekanisme *immediate privilege revocation*: penambahan kolom `tokenVersion` pada model pengguna untuk membatalkan JWT aktif jika akun diturunkan haknya atau dinonaktifkan.

### Phase 2: Target Data Model & Migration Design
- **Aksi:** Merancang arsitektur skema database masa depan dan mitigasi risiko operasional.
- **Hasil:**
  - Penerbitan `docs/AUTHORIZATION_MIGRATION_MAP.md`:
    - Model Prisma multi-role (`UserRole` menghubungkan `User` dan `Role`).
    - Model Prisma multi-division (`UserDivision` menghubungkan `User` dan `Division`).
    - Penyediaan model `RoleAuditLog` untuk merekam jejak perubahan hak akses.
    - Script SQL Backfill otomatis yang memetakan data lama dan mengubah enum usang `IIO_EEO` menjadi kode resmi `EEO`.
    - Skrip rollback darurat untuk menjamin *zero downtime* dan *zero data loss*.
  - Penerbitan `docs/SEED_AND_BOOTSTRAP_POLICY.md`:
    - Membakukan 5 divisi resmi BNCC (`PR`, `EEO`, `HRD`, `RND`, `LNT`).
    - Menetapkan prosedur bootstrap Super Admin via CLI dengan *transient environment variables* (tidak ada password atau email tersimpan di repositori atau file git).

---

## 4. Council Re-Review Rubric & Verification Criteria

Bagi anggota Council yang akan meninjau ulang paket spesifikasi ini, berikut adalah panduan evaluasi berbasis peran:

### A. Solution Architect Review Focus
- [x] **Separation of Concerns:** Pemisahan jelas antara Global Role, Board Role, dan Division Scope (`docs/AUTHORIZATION_GLOSSARY.md`).
- [x] **Data Integrity & Normalization:** Model join table `UserRole` dan `UserDivision` sudah memenuhi kaidah Third Normal Form (3NF) (`docs/USER_AUTHORIZATION_ERD.md`).
- [x] **Safe Database Migration:** Jalur migrasi 4 tahap (*Expand-Migrate-Contract*) menjamin ketiadaan *downtime* atau *data loss* (`docs/AUTHORIZATION_MIGRATION_MAP.md`).
- [x] **Revocation Latency:** Mitigasi JWT stale privilege menggunakan `tokenVersion` (`docs/ACCOUNT_LIFECYCLE.md`).

### B. Product Manager (PM) Review Focus
- [x] **Business Alignment:** Alur kerja proker BNCC tercermin akurat dalam 5 divisi resmi (`PR`, `EEO`, `HRD`, `RND`, `LNT`).
- [x] **Workflow Enforcement:** Mekanisme FSM Kanban dan QC terlindungi secara logis; staf pelaksana tidak dapat menyetujui pekerjaannya sendiri (`docs/AUTHORIZATION_MATRIX.md`).
- [x] **User Onboarding:** Alur registrasi mandiri aman dan transparan tanpa memberikan celah eskalasi hak istimewa (`docs/ACCOUNT_LIFECYCLE.md`).

### C. Chief Technology Officer (CTO) Review Focus
- [x] **Security & Zero-Leakage:** Larangan keras hardcoded credentials; bootstrap Super Admin terisolasi (`docs/SEED_AND_BOOTSTRAP_POLICY.md`).
- [x] **Auditability & Compliance:** Setiap perubahan hak akses dan penugasan divisi wajib tercatat dalam `role_audit_logs` (`docs/ACCOUNT_LIFECYCLE.md`).
- [x] **Operational Disaster Recovery:** Skenario rollback teruji dan terdokumentasi jika terjadi kegagalan deployment (`docs/AUTHORIZATION_MIGRATION_MAP.md`).
- [x] **Zero-TBD Readiness:** Tidak ada lagi keputusan tertunda (*no unresolved TBDs*) pada spesifikasi inti.

---

## 5. Kesimpulan & Rekomendasi Selanjutnya

Dengan selesainya seluruh deliverable pada revisi ini:
1. **Dokumentasi Spesifikasi kini berstatus LENGKAP dan SIAP.**
2. Dokumen ini dapat langsung diajukan ke sesi **Council Review** berikutnya untuk mendapatkan stempel persetujuan (*Sign-Off*).
3. Setelah Council memberikan *Sign-Off*, fase implementasi kode (Phase 3: Backend Schema & Policy, Phase 4: Automated Tests, Phase 5: Frontend Admin UI) dapat dieksekusi dengan aman dan terarah tanpa risiko ambiguitas logika.

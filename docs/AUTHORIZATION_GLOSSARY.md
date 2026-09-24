# Authorization Glossary & Terminology Contract

**Project:** BNCC Proker Kanban  
**Repository:** `/mnt/d/Coding/kanban-bncc-38`  
**Status:** Approved Specification Standard  
**Last Updated:** September 2026  

---

## 1. Executive Summary & Objective

Dokumen ini mendefinisikan terminologi kanonikal, batasan otoritas (*authority boundaries*), dan hirarki otorisasi pada sistem **BNCC Proker Kanban**. Tujuannya adalah menghilangkan ambiguitas semantik antara peran organisasi riil (BNCC), hak akses sistem global (*system-wide RBAC*), batasan scope divisi (*division scope*), dan hak akses spesifik di level papan kerja (*board-level membership*).

---

## 2. Core Concepts: The Four-Tier Authorization Taxonomy

Sistem membedakan secara tegas 4 lapis konsep otorisasi:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. GLOBAL ROLES (System-Wide Authority)                     │
│    SUPER_ADMIN | STAFF (Default unprivileged)               │
├─────────────────────────────────────────────────────────────┤
│ 2. DIVISION SCOPES (Organizational Boundary)                │
│    PR | EEO | HRD | RND | LNT                               │
├─────────────────────────────────────────────────────────────┤
│ 3. BOARD ROLES (Board-Scoped Authority)                     │
│    BOARD_ADMIN | BOARD_MEMBER | BOARD_VIEWER                 │
├─────────────────────────────────────────────────────────────┤
│ 4. FUNCTIONAL CAPABILITIES (Context-Driven Authority)       │
│    QC_REVIEWER (Koor Divisi / Board Admin on Target Scope)   │
└─────────────────────────────────────────────────────────────┘
```

1. **Global Role (Sistem):** Hak istimewa lintas aplikasi. Diberikan secara eksplisit oleh Super Admin melalui tabel relasi `UserRole`.
2. **Division Scope (Organisasi):** Identitas keanggotaan divisi mahasiswa di BNCC. Satu user dapat memiliki satu atau lebih divisi melalui tabel relasi `UserDivision`. **Divisi adalah boundary/scope, BUKAN hak akses otomatis.**
3. **Board Role (Papan Kerja):** Hak akses di dalam suatu Board spesifik melalui model `BoardMember`.
4. **Functional Capability (Workflow):** Izin situasional saat mengeksekusi aksi bisnis tertentu (misal: verifikasi QC pada Card divisi R&D).

---

## 3. Canonical Global Roles

| Role Key | Nama Tampilan | Definisi & Batasan Wewenang | Aturan Pemberian |
|---|---|---|---|
| `SUPER_ADMIN` | Super Administrator | Memiliki akses mutlak ke seluruh sistem: mengelola user, memberikan/mencabut role (ala Discord), menetapkan divisi user, melihat audit log, mengelola semua board, dan bypass darurat jika diperlukan. | Ditetapkan via CLI / Environment Bootstrap saat inisialisasi, atau diberikan oleh Super Admin lain yang sudah aktif. **Tidak dapat dipilih saat registrasi.** |
| `STAFF` | General Staff | Peran dasar default setiap akun yang mendaftar. Memiliki hak membaca board publik, berpartisipasi pada board di mana ia diundang sebagai anggota, memindahkan card miliknya dari `TO_DO` ke `ON_PROGRESS`, dan mengajukan card ke `ON_QC`. | Otomatis diberikan oleh sistem (*system-assigned*) saat pendaftaran akun baru berhasil. |

---

## 4. Canonical Division Scopes (Master Data)

Sistem menetapkan **5 Divisi Resmi BNCC** dengan kode kanonikal yang divalidasi ketat:

| Division Code | Nama Resmi Divisi | Deskripsi & Ruang Lingkup Proker | Catatan Migrasi / Legacy |
|---|---|---|---|
| `PR` | Public Relations | Hubungan masyarakat, kemitraan eksternal, branding, dan publikasi proker. | Tetap `PR`. |
| `EEO` | Event and External Organization | Manajemen acara, kepanitiaan eksternal, dan kolaborasi event. | **Wajib menggantikan kode legacy `IIO_EEO`.** |
| `HRD` | Human Resource Development | Manajemen sumber daya internal, regenerasi anggota, dan pelatihan aktivis. | Tetap `HRD`. |
| `RND` | Research and Development | Riset teknologi, kurikulum teknis, pengembangan produk internal software. | **Wajib menggunakan kode `RND`** (simbol `&` dilarang dalam identifier/code). |
| `LNT` | Learning and Training | Pelatihan berkala, kelas teknis member/calon member, dan sertifikasi. | Tetap `LNT`. |

### Aturan Scope Divisi:
- **Multi-Division:** User diizinkan memiliki lebih dari satu divisi jika ditugaskan lintas divisi oleh Super Admin.
- **Scope Isolation:** Keanggotaan di divisi `RND` **tidak otomatis** memberikan izin mengelola atau meng-QC proker milik divisi `PR`.

---

## 5. Canonical Board Roles (Per-Board Scopes)

| Board Role Key | Nama Tampilan | Batasan Wewenang di Dalam Board Terkait |
|---|---|---|
| `BOARD_ADMIN` | Board Administrator | Dapat mengubah metadata board (nama, deskripsi), menambah/menghapus anggota board, membuat card, mengarsipkan card, dan melakukan approval QC pada card di board tersebut. |
| `BOARD_MEMBER` | Board Collaborator | Dapat membuat card, mengedit card yang ditugaskan kepadanya, memindahkan card miliknya, menambahkan attachment, dan mengajukan QC. |
| `BOARD_VIEWER` | Board Observer / Viewer | Read-only. Hanya dapat melihat daftar kolom, card, attachment, dan log aktivitas board. Tidak dapat memindahkan status atau mengedit card. |

---

## 6. Functional Capability: QC Reviewer (Koordinator Divisi)

Dalam alur finite state machine (FSM) Kanban BNCC:
- Status `ON_QC` adalah gerbang kendali mutu sebelum card dapat dinyatakan `DONE`.
- **Aktor yang berhak melakukan `Approve QC` (`DONE`) atau `Reject QC` (`REVISION`):**
  1. Pengguna berstatus `SUPER_ADMIN`.
  2. Pengguna berstatus `BOARD_ADMIN` pada board tersebut.
  3. Koordinator Divisi yang relevan: Pengguna yang memiliki scope divisi yang sama dengan divisi target card tersebut DAN memiliki penugasan kewenangan pengawasan di board tersebut.
- **Larangan Keras:** Assignee (pembuat/pelaksana tugas yang memajukan card ke `ON_QC`) **DILARANG KERAS** menyetujui (self-approve) card pekerjaannya sendiri.

---

## 7. Forbidden Terminology & Anti-Patterns (Kamus Larangan)

Untuk mencegah bias implementasi dan ambiguitas kode, istilah dan pola berikut **dilarang digunakan tanpa mapping resmi**:

| Istilah / Pola Dilarang | Alasan Pelarangan | Padanan Kanonikal yang Wajib Digunakan |
|---|---|---|
| `IIO_EEO` | Kode peninggalan legacy yang membingungkan struktur divisi riil. | Wajib menggunakan `EEO`. |
| `R&D` dalam kode / DB key | Mengandung karakter spesial `&` yang merusak URL query, enum parsing, dan API parameter. | Gunakan code `RND` di DB/API; `Research & Development` hanya untuk label tampilan UI. |
| `C-Level` / `DPI` / `Manager` | Istilah struktur organisasi riil yang tidak memiliki padanan kolom spesifik di skema database. | Petakan ke kombinasi: `SUPER_ADMIN` (untuk Ketua/DPI umum) atau `KOOR_DIVISION` / `BOARD_ADMIN` dengan division scope terkait. |
| Single `role` enum di tabel `User` | Melarang user memiliki multi-role ala Discord; melanggar kebutuhan bisnis target. | Digantikan dengan model relasi junction `UserRole` dan `UserDivision`. |
| Self-Registration dengan pilihan Role | Membuka celah eskalasi hak istimewa (privilege escalation) di mana user luar bisa mendaftar sebagai Admin. | Registrasi publik hanya membuat akun berstatus `STAFF` murni tanpa divisi privileged. |
| Divisi dianggap sebagai Permission | Divisi adalah boundary organisasi, bukan kapabilitas operasional sistem. | Otorisasi selalu divalidasi melalui formula: `isSuperAdmin || (hasBoardRole(ADMIN) && inScope)`. |

---

## 8. Ringkasan Formula Otorisasi

Setiap request perubahan status atau manipulasi data di backend dievaluasi melalui predikat deterministik:

$$\text{Authorized} = \text{IsSuperAdmin} \lor (\text{HasBoardPermission} \land \text{ScopeMatches} \land \neg\text{SelfReviewConstraint})$$

Prinsip ini bersifat **Deny-by-Default**: jika tidak ada aturan yang secara eksplisit mengizinkan suatu aksi, aksi tersebut wajib ditolak dengan HTTP `403 Forbidden`.

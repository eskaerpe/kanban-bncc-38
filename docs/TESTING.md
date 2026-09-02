# Testing & Verification Guide — BNCC Proker Kanban

Dokumen ini berisi 8 checklist verifikasi kualitas sebelum aplikasi siap rilis (Production Ready).

## 1. Quality Checklist Matrix

### 1.1 Auth & Session Security
- [ ] **Happy Path**: User dapat register, login, mendapatkan JWT, dan redirect ke Dashboard.
- [ ] **Token Expiry**: Saat JWT expired / invalid, request API return `401 Unauthorized` dan user ter-redirect ke Login.
- [ ] **Password Security**: Password tersimpan dalam database MySQL dalam format bcrypt hash (minimal 10 rounds).

### 1.2 Access Control & Role Permissions (IDOR Protection)
- [ ] **Edit Lock**: User Staff Divisi A tidak bisa mengedit atau menggeser card milik Divisi B via UI maupun direct API curl/Postman (`403 Forbidden`).
- [ ] **QC Gatekeeper Lock**: User Staff biasa mencoba memindahkan card dari `On QC` ke `Done` atau `Revision` via API request langsung ditolak backend (`403 Forbidden`).
- [ ] **Override Access**: Global Admin (C-Level / Manager BNCC) dan DPI Event dapat mengubah status card mana saja di `On QC`.

### 1.3 Card & Properties Editing
- [ ] **Multi-Assignee**: Card dapat ditambahkan multiple user assignee dan muncul dengan icon avatar yang sesuai.
- [ ] **Link Attachment Validation**: Memasukkan link tanpa `http://` atau `https://` menolak submission dengan error validasi.
- [ ] **Due Date Overdue Badge**: Card dengan due date < tanggal hari ini menampilkan badge merah *Overdue*.

### 1.4 Revision Loop & Notes
- [ ] **Mandatory Revision Note**: Memindahkan card dari `On QC` ke `Revision` tanpa mengisi catatan revisi (atau < 5 karakter) memblokir aksi.
- [ ] **Revision Retrieval**: Staff Divisi dapat memindahkan card yang berstatus `Revision` kembali ke `On Progress` atau `On QC`.

### 1.5 Audit Log Accuracy
- [ ] **Activity Record**: Setiap perpindahan status, penambahan catatan revisi, dan perubahan assignee tercatat otomatis di Activity Log dengan nama user dan timestamp WIB.

### 1.6 Responsive UI & Empty/Loading States
- [ ] **Mobile & Tablet Layout**: Dashboard dan Kanban board dapat diakses dengan scroll horisontal yang responsif pada layar 360px - 768px.
- [ ] **Empty States**: Kolom tanpa card atau board tanpa proker menampilkan ilustrasi/teks empty state yang informatif.

---

## 2. Seed Data untuk Testing Manual

Gunakan data akun seed berikut untuk melakukan test manual role & permission:

| Email | Password | Role Global | Role Board (Proker A) | Divisi Assigned |
|---|---|---|---|---|
| `cfo@bncc.net` | `password123` | `GLOBAL_ADMIN` | — (Override) | — |
| `dpi.event@bncc.net` | `password123` | `USER` | `BOARD_ADMIN` | Acara |
| `koor.creative@bncc.net` | `password123` | `USER` | `KOOR_DIVISION` | Creative Team |
| `staff.creative@bncc.net` | `password123` | `USER` | `STAFF` | Creative Team |
| `staff.pr@bncc.net` | `password123` | `USER` | `STAFF` | Public Relations |

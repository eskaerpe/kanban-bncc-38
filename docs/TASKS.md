# Master Task Breakdown — BNCC Proker Kanban

## Execution Stages & Guidelines
- **1 Task = 1 Prompt = 1 Commit**.
- Jangan pernah melompati urutan Stage.
- Frontend dibuat dulu menggunakan data mock / state lokal sebelum dihubungkan ke backend.

---

## Stage 0: Environment & Database Skeleton Setup
- [x] **T-01**: Inisialisasi struktur repo frontend (React.js + Tailwind CSS) & backend (Express.js + MySQL schema).
- [x] **T-02**: Buat DDL Script MySQL (`schema.sql`) sesuai `docs/data-model.md`.

---

## Stage 1: Auth & User Management (Sprint 1)
- [ ] **T-03**: [Backend] Express JWT Auth endpoints (`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`).
- [ ] **T-04**: [Frontend] Halaman Login & Context Auth (JWT token storage & auto-login check).

---

## Stage 2: Board Proker & Member Roles (Sprint 2)
- [ ] **T-05**: [Backend] Board CRUD endpoints & middleware check `board_members` role.
- [ ] **T-06**: [Frontend] Dashboard Proker Page (`/`) — grid card proker & modal `+ New Board`.
- [ ] **T-07**: [Frontend] Board Settings Page (`/board/:id/settings`) — manajemen member proker & assignment role/divisi.

---

## Stage 3: Kanban Columns & Card Drag and Drop (Sprint 3)
- [ ] **T-08**: [Frontend] 5 Columns Kanban Layout (`TO DO`, `On Progress`, `On QC`, `Revision`, `Done`) menggunakan `dnd-kit`.
- [ ] **T-09**: [Frontend] Card Component UI: Division tag badge, multi-assignee avatars, priority badge (`Low`/`Mid`/`High`), Due date badge (overdue highlight).
- [ ] **T-10**: [Frontend] Filter Bar: Filter card berdasarkan Divisi Saya / Semua Divisi / Divisi Tertentu / Priority.
- [ ] **T-11**: [Backend] Card CRUD & Position reorder endpoints (`GET /api/boards/:id/cards`, `POST /api/cards`, `PUT /api/cards/:id/move`).

---

## Stage 4: Notion-Style Card Modal & Property Editing (Sprint 4)
- [ ] **T-12**: [Frontend] Notion-Style Card Modal Layout: Header title editable, Property grid vertikal (Status, Assignees, Division, Priority, Due Date, Links).
- [ ] **T-13**: [Frontend] Description Rich-Text Editor & Attachments Link Manager (URL regex http/https validation).
- [ ] **T-14**: [Backend] Card detail endpoints & update property middleware (validasi division/assignee edit lock).

---

## Stage 5: QC Gatekeeper, Revision Loop & Audit Log (Sprint 5)
- [ ] **T-15**: [Backend & Frontend] Gatekeeper Logic: Intercept drag-and-drop dari `On QC` ke `Done` atau `Revision`. Kunci aksi hanya untuk Koor Divisi, DPI Event, Manager BNCC, & C-Level.
- [ ] **T-16**: [Frontend & Backend] Mandatory Revision Modal: Form input Catatan Revisi (min 5 chars) saat reject ke `Revision`, simpan ke `card_revisions`.
- [ ] **T-17**: [Frontend & Backend] Audit Activity Log: Catat & tampilkan timeline aksi di bagian bawah Notion Card Modal.

---

## Stage 6: Integration, Testing & Deployment
- [ ] **T-18**: Integrasi menyeluruh FE ke BE & DB MySQL.
- [ ] **T-19**: Eksekusi checklist `docs/TESTING.md`.
- [ ] **T-20**: Deploy ke VPS sesuai `docs/DEPLOYMENT.md`.

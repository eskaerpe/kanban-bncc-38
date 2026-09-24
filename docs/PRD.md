# Product Requirements Document (PRD)
# BNCC Proker Kanban — Reverse-Engineered Current State

> **Dokumen ini bukan target-state PRD.** Dokumen ini merekonstruksi produk berdasarkan source code, Prisma schema, seed, frontend routes, backend routes, dan dokumentasi yang tersedia pada repository saat ini. Tujuannya adalah menjadi baseline untuk quality check: mana yang benar-benar sudah ada, mana yang baru direncanakan, dan mana yang masih menjadi gap.

- **Status:** Reverse-engineered baseline
- **Versi:** 0.1
- **Tanggal pemeriksaan:** 2026-09-23
- **Repository:** `/mnt/d/Coding/kanban-bncc-38`
- **Canonical database source:** `backend/prisma/schema.prisma`
- **Evidence utama:** `backend/src`, `backend/prisma/seed.ts`, `frontend/src`, `docs/`

---

## 1. Cara Membaca Dokumen Ini

Setiap requirement diberi status berikut:

| Status | Arti |
|---|---|
| **Implemented** | Ada implementasi yang dapat diidentifikasi di source code dan/atau schema. Tidak otomatis berarti sudah production-ready. |
| **Partially implemented** | Sebagian alur tersedia, tetapi ada batasan, ketidakkonsistenan, atau sisi frontend/backend belum lengkap. |
| **Documented only** | Ada di dokumen/diagram/plan, tetapi belum dibuktikan dalam runtime atau schema saat ini. |
| **Gap** | Dibutuhkan oleh product direction atau dokumen lama, tetapi belum tersedia pada current implementation. |
| **Unverified** | Terlihat mungkin tersedia, tetapi belum dibuktikan oleh test/integration verification yang memadai. |

**Aturan evidence:** klaim tentang kondisi saat ini hanya dibuat jika dapat ditelusuri ke file, route, model, controller, atau test. Dokumentasi aspiratif tidak dianggap sebagai fitur implemented.

---

## 2. Product Summary Current State

BNCC Proker Kanban adalah aplikasi web internal untuk mengelola program kerja BNCC menggunakan board Kanban. Unit kerja utama aplikasi saat ini adalah:

1. **User** melakukan register/login memakai email dan password.
2. User yang sudah login melihat board yang dapat diaksesnya.
3. User membuat atau mengelola board program kerja.
4. Board memiliki anggota dengan **board-level role**.
5. Card berada dalam satu board dan ditandai satu division.
6. Card dapat diberi assignee, priority, due date, attachment, revision note, dan activity log.
7. Card bergerak melalui workflow Kanban dan memiliki QC gate.

Current implementation adalah **modular monolith**:

```text
React + Vite frontend
        │ HTTP JSON + JWT Bearer
        ▼
Express + TypeScript backend
        │ Prisma ORM
        ▼
PostgreSQL / Supabase-compatible database
```

Produk saat ini sudah memiliki fondasi Kanban dan authorization dasar. Namun, arsitektur user authorization yang diinginkan—self-registration dengan multiple roles, multiple divisions, dan super-admin assignment—belum menjadi model runtime utama.

---

## 3. Problem Statement

BNCC membutuhkan sistem untuk:

- memusatkan pengelolaan program kerja dalam board;
- memecah pekerjaan berdasarkan divisi;
- menetapkan penanggung jawab card;
- memberi visibility terhadap progres pekerjaan;
- memastikan card melewati QC sebelum selesai;
- menyimpan histori revisi dan aktivitas;
- membatasi akses berdasarkan membership dan authorization.

Current system telah menjawab bagian inti Kanban, tetapi masih memiliki gap penting pada:

- model role global yang masih single-role;
- relasi user-to-division yang belum tersedia;
- pengelolaan authorization oleh super admin;
- admin UI dan endpoint administrasi;
- konsistensi antara PRD lama, seeder, dan model divisi;
- pembuktian test terhadap seluruh acceptance criteria;
- beberapa edge case Kanban dan production-readiness.

---

## 4. Scope Current Product

### 4.1 In Scope dan Terlihat Implemented

- Register dan login berbasis email/password.
- JWT bearer authentication.
- Board CRUD dengan status `ACTIVE` dan `ARCHIVED`.
- Board membership dengan role `BOARD_ADMIN`, `KOOR_DIVISION`, dan `STAFF`.
- Card Kanban pada board.
- Card status `TO_DO`, `ON_PROGRESS`, `ON_QC`, `REVISION`, dan `DONE`.
- Drag/move card melalui endpoint move.
- Division tagging pada card.
- Multi-assignee pada card.
- Priority `LOW`, `MID`, `HIGH`.
- Due date.
- Attachment berbasis URL/title.
- Revision note dan card activity log.
- Lookup division dan user.
- Centralized workflow policy dan QC authorization policy pada jalur card yang telah diintegrasikan.
- Security middleware dasar: Helmet, CORS, JSON parser, rate limit, JWT authentication.

### 4.2 Out of Scope atau Belum Terbukti

- Multiple role per user seperti Discord.
- Multiple division per user.
- Super-admin dashboard untuk grant/revoke role dan division.
- Self-registration dengan approval/verification lifecycle.
- Email verification, password reset, invitation, atau mandatory password change.
- Audit trail khusus untuk perubahan authorization.
- Notification center, email notification, atau realtime update.
- OAuth/SSO.
- File upload binary; attachment saat ini berbasis URL.
- Mobile-native application.
- Reporting/analytics lintas board.

---

## 5. Actors and Authorization Current State

### 5.1 Actors

| Actor | Current meaning | Evidence/status |
|---|---|---|
| Anonymous visitor | Dapat membuka login/register | Frontend public routes; implemented |
| Registered user | User dengan `global_role = USER` | Prisma `User`; implemented |
| Global admin | User dengan `global_role = GLOBAL_ADMIN` | Prisma enum dan controller checks; implemented but single global role |
| Board admin | Member dengan `BoardRole.BOARD_ADMIN` | `BoardMember.role`; implemented |
| Division coordinator | Member dengan `BoardRole.KOOR_DIVISION` dan optional division | `BoardMember.role`; partially implemented |
| Staff | Member dengan `BoardRole.STAFF` | `BoardMember.role`; implemented |
| Super admin authorization manager | Actor yang dapat mengatur arbitrary user roles/divisions | **Gap**: belum ada dedicated API/UI/model |

### 5.2 Current Authorization Model

Current schema memisahkan:

```text
User.global_role: GLOBAL_ADMIN | USER
User ──< BoardMember >── Board
BoardMember.role: BOARD_ADMIN | KOOR_DIVISION | STAFF
BoardMember.division_id: optional Division
```

Model ini **bukan** model multiple roles/multiple divisions per user. User hanya memiliki satu `global_role`, sedangkan role lain melekat pada membership di board tertentu.

### 5.3 Desired Authorization Model — Target, Not Current

Arah produk yang telah disepakati membutuhkan:

```text
User ──< UserRole >── Role
User ──< UserDivision >── Division
```

Dengan prinsip:

- user dapat self-register;
- user baru tidak boleh memilih privileged role sendiri;
- user dapat memiliki beberapa role;
- user dapat terkait ke beberapa division;
- super admin dapat grant/revoke role dan division;
- assignment memiliki audit trail;
- seeder membuat master division, bukan akun berdasarkan divisi.

Bagian ini adalah **target architecture/gap**, bukan kemampuan current runtime.

---

## 6. Functional Requirements — Current State

### FR-01 Authentication

**Description:** User dapat membuat akun dan login.

**Current behavior:**

- Register membutuhkan `email`, `password`, dan `name`.
- Password minimum yang divalidasi adalah 6 karakter.
- Password di-hash sebelum disimpan menggunakan `bcryptjs`.
- Login menghasilkan JWT.
- Authenticated request menggunakan header `Authorization: Bearer <token>`.
- `/api/auth/me` menyediakan current user.
- Register/login dikenai authentication rate limit.

**Status:** **Implemented, security hardening still required.**

**Acceptance criteria current baseline:**

- Email duplicate ditolak.
- Password tidak dikembalikan dalam response.
- Token invalid/expired ditolak.
- Request tanpa bearer token ke endpoint protected ditolak.

**Gap:** email verification, reset password, account status, token revocation, password policy yang lebih kuat, dan lifecycle user belum tersedia atau belum terverifikasi.

### FR-02 Board Management

**Description:** User membuat dan mengelola board Proker.

**Current behavior:**

- Authenticated user dapat membuat board.
- Creator otomatis menjadi `BOARD_ADMIN` pada board tersebut.
- Board memiliki title, optional description, status, creator, dan created timestamp.
- Board dapat dibaca, di-update, di-archive, dan di-delete sesuai authorization controller.
- Daftar board memfilter membership dan memberikan akses khusus kepada `GLOBAL_ADMIN`.

**Status:** **Implemented / partially verified.**

**Gap:** board-level policy perlu diuji menyeluruh untuk setiap endpoint; belum ada board settings, template, period, owner transfer, atau soft-delete policy yang terdokumentasi konsisten.

### FR-03 Board Membership

**Description:** Board admin mengelola orang yang terlibat dalam suatu board.

**Current behavior:**

- Member dapat ditambahkan berdasarkan `user_id`.
- Member memiliki board role.
- Member dapat memiliki optional division pada board.
- Member dapat dihapus.
- Lookup user dan division tersedia untuk membantu assignment.

**Status:** **Implemented / partially implemented.**

**Gap:** membership belum terintegrasi dengan user-to-division master assignment; validasi apakah user memang anggota division tertentu perlu diperjelas; belum ada invitation/approval workflow; belum ada dedicated member route karena operasi member berada di bawah board routes.

### FR-04 Division Master Data

**Description:** Division menjadi taxonomy untuk member dan card.

**Current behavior:**

- Tabel `Division` memiliki `id` dan `name` unique.
- Card memiliki tepat satu `division_id`.
- Board member memiliki optional `division_id`.
- Lookup division tersedia.

**Status:** **Implemented as generic master data.**

**Important mismatch:**

- Current schema hanya menyimpan nama division, bukan code + name.
- Dokumen target menyepakati lima master division: `PR`, `EEO`, `HRD`, `R&D`, `LNT`.
- Current seed perlu dianggap sebagai source yang harus diverifikasi terhadap lima data tersebut; model target dengan code belum diimplementasikan.

**Gap:** stable code, description, active flag, ordering, uniqueness policy, migration dari nama lama, dan admin management belum tersedia.

### FR-05 Card Creation

**Description:** User membuat pekerjaan pada board.

**Current behavior:**

- Card memiliki board, division, title, description, priority, due date, status, position, dan created timestamp.
- Card dibuat pada status awal `TO_DO` menurut current controller behavior.
- Akses pembuatan dibatasi membership board atau global admin.

**Status:** **Implemented.**

**Known gap:** UI/contract dapat menerima context kolom tertentu, tetapi current behavior berpotensi tetap membuat card sebagai `TO_DO`. Acceptance criteria untuk create-card dari kolom non-`TO_DO` harus diputuskan dan diuji.

### FR-06 Card Assignment

**Description:** Card dapat diberikan kepada satu atau beberapa user.

**Current behavior:**

- Relasi `CardAssignee` menghubungkan card dan user.
- Endpoint add/remove assignee tersedia.
- Frontend menampilkan assignees.

**Status:** **Implemented / partially verified.**

**Gap:** belum ada jaminan pada product contract bahwa assignee harus board member atau anggota division card; aturan tersebut perlu difinalkan dan ditegakkan konsisten.

### FR-07 Kanban Workflow

**Description:** Card mengikuti state machine pekerjaan.

**Current states:**

```text
TO_DO → ON_PROGRESS → ON_QC → DONE
                         │
                         └──→ REVISION → ON_PROGRESS
```

Same-status movement digunakan untuk reorder position.

**Current policy:**

- Central workflow policy tersedia di `backend/src/policies/workflow.policy.ts`.
- Invalid transition ditolak.
- Revision note divalidasi minimum lima karakter.
- QC decision menggunakan policy authorization.
- Jalur `PUT` update dan `PATCH /move` telah diintegrasikan dengan policy.

**Status:** **Implemented at backend policy layer; integration coverage incomplete.**

**Gap/risiko:**

- Semua endpoint yang dapat mengubah status harus dipastikan memakai policy yang sama.
- Drag-and-drop dengan filter aktif berpotensi menghitung position berdasarkan daftar yang tidak lengkap.
- Acceptance test untuk setiap transition, unauthorized QC, revision loop, reorder, dan concurrent update belum menjadi official test suite.

### FR-08 Quality Control and Revision

**Description:** Card yang masuk QC hanya dapat diputuskan oleh actor berwenang.

**Current behavior:**

- QC decision dapat mengubah card ke `DONE` atau `REVISION` sesuai workflow policy.
- `GLOBAL_ADMIN` dapat approve/reject.
- `BOARD_ADMIN` dapat approve/reject.
- `KOOR_DIVISION` dapat melakukan QC bila division coordinator relevan dengan card.
- Revision membutuhkan note minimum lima karakter.
- Revision dicatat pada `CardRevision`.

**Status:** **Implemented in backend policy/controller; frontend and end-to-end verification incomplete.**

**Gap:** UI khusus untuk QC queue/decision belum dipisahkan; reason/decision semantics perlu distandarkan; belum ada SLA/escalation; audit authorization decision perlu diperkuat.

### FR-09 Card Activity and Audit

**Description:** Aktivitas penting card dapat ditelusuri.

**Current behavior:**

- `CardActivity` menyimpan user, action type, description, dan timestamp.
- Endpoint untuk membaca activity tersedia.
- Attachment/revision/assignment/status actions dapat menghasilkan activity sesuai controller path.

**Status:** **Partially implemented.**

**Gap:** belum ada immutable audit log global; perubahan role/division/board permission belum tercatat sebagai authorization audit; retention/export/search belum ada.

### FR-10 Attachment

**Description:** Card dapat memiliki referensi attachment.

**Current behavior:**

- `CardAttachment` menyimpan title, URL, dan timestamp.
- Endpoint add/delete attachment tersedia.
- Implementasi saat ini menyimpan URL, bukan upload binary ke object storage.

**Status:** **Implemented as URL attachment.**

**Gap:** file validation, malware scanning, ownership policy, signed URL, storage lifecycle, dan actual upload belum tersedia.

### FR-11 Frontend Navigation and Screens

**Current routes:**

- `/login`
- `/register`
- `/`
- `/boards/:id`
- `/logout`

**Current screens:**

- Login page.
- Register page.
- Dashboard board list/create.
- Board detail Kanban.
- Card modal/details dan board/member interactions berada dalam flow board detail.

**Status:** **Implemented for core MVP flow.**

**Gap:** belum ada frontend route/page untuk super-admin authorization, profile management, division administration, user status, audit log, notification, password reset, atau dedicated QC dashboard.

---

## 7. Data Model Current State

### 7.1 Current Entities

| Entity | Current purpose |
|---|---|
| `User` | Account, email, hashed password, name, single global role |
| `Division` | Generic division master with unique name |
| `Board` | Proker workspace |
| `BoardMember` | User membership in a board with board role and optional division |
| `Card` | Work item within a board and division |
| `CardAssignee` | Many-to-many card assignment |
| `CardAttachment` | URL attachment on card |
| `CardRevision` | Revision notes on card |
| `CardActivity` | Card-level activity history |

### 7.2 Current Enums

```text
GlobalRole: GLOBAL_ADMIN, USER
BoardStatus: ACTIVE, ARCHIVED
BoardRole: BOARD_ADMIN, KOOR_DIVISION, STAFF
CardStatus: TO_DO, ON_PROGRESS, ON_QC, REVISION, DONE
CardPriority: LOW, MID, HIGH
```

### 7.3 Missing Target Entities

The following are required for the intended authorization direction but are absent from current Prisma schema:

```text
Role
UserRole
UserDivision
RoleAssignmentAudit / AuthorizationAudit
User.status or account lifecycle fields
Division.code and richer master-data fields
```

A migration must define how existing `global_role` and `BoardMember.role` map to the new model. No automatic destructive migration should be assumed.

---

## 8. API Surface Current State

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Boards and membership

```text
GET    /api/boards
POST   /api/boards
GET    /api/boards/:id
PUT    /api/boards/:id
DELETE /api/boards/:id
POST   /api/boards/:id/members
DELETE /api/boards/:id/members/:userId
```

### Cards

```text
GET    /api/boards/:boardId/cards
POST   /api/boards/:boardId/cards
PUT    /api/cards/:id
PATCH  /api/cards/:id/move
DELETE /api/cards/:id
POST   /api/cards/:id/assignees
DELETE /api/cards/:id/assignees/:userId
GET    /api/cards/:id/activities
```

### Attachments and lookup

```text
POST   /api/cards/:id/attachments
DELETE /api/attachments/:id
GET    /api/divisions
GET    /api/users
```

### Missing API Surface for Target Authorization

```text
GET/PATCH /api/admin/users/:id
GET/POST/DELETE /api/admin/users/:id/roles
GET/POST/DELETE /api/admin/users/:id/divisions
GET/POST/PATCH /api/admin/roles
GET/POST/PATCH /api/admin/divisions
GET /api/admin/authorization-audit
POST /api/auth/verify-email
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

Endpoint names above are **proposed gap inventory**, not existing routes.

---

## 9. Non-Functional Requirements Current State

### 9.1 Security

**Present:**

- Helmet.
- CORS configuration through environment.
- Global API rate limit.
- Stricter auth rate limit.
- JWT verification and database user existence check.
- Bcrypt password hashing.
- Zod request validation on selected routes.
- Centralized workflow/QC policy.

**Remaining gaps:**

- JWT secret/configuration validation must be verified for production startup.
- Token lifetime, revocation, refresh strategy, and account disable behavior need specification.
- CORS production allowlist must not remain wildcard.
- Authorization policy should be centralized for all board/member/card mutations, not only workflow/QC decisions.
- Role/division assignment must be protected by explicit super-admin authorization.
- Security audit and dependency remediation remain incomplete.

### 9.2 Reliability and Data Integrity

- PostgreSQL datasource is configured through `DATABASE_URL` and `DIRECT_URL`.
- Prisma schema and migrations are intended to live under `backend/prisma`.
- Board/card mutations should use transactions where multiple related records must remain consistent.
- Unique constraints and cascade behavior exist in current schema but need migration-level review.

**Gap:** no documented backup/restore test, migration rollback procedure, concurrency strategy, or production observability contract.

### 9.3 Performance

No formal SLO, expected user count, board size, card count, pagination requirement, or query budget is currently defined.

**Gap:** define performance targets before production rollout, especially for board card loading, activities, assignee lookup, and admin user search.

### 9.4 Maintainability

- Backend TypeScript build has been exercised successfully in the current work.
- Frontend production build has historically been exercised.
- Frontend lint is currently blocked by ESLint 10 not finding a flat config file according to prior verification.
- Official backend test suite for policy and integration coverage is incomplete.

---

## 10. Seed and Onboarding Requirements

### 10.1 Current Seed Reality

Current seed is the operational source for initial development data. It must be reviewed against the intended onboarding model before production use.

The target seed behavior is:

- seed master division data only;
- use the five agreed divisions:
  - `PR` — Public Relation
  - `EEO` — Event & External Event Organizer
  - `HRD` — Human Resource and Development
  - `R&D` — Research and Development
  - `LNT` — Learning and Training
- do not create accounts grouped by legacy admin/division labels as the primary model;
- do not place plaintext passwords in seed, docs, logs, or commits;
- create privileged authorization through a controlled admin/invitation flow.

### 10.2 Gap

Current schema does not yet support division codes or `UserDivision`, and current global role is not multi-role. Seed must not be changed blindly until migration mapping and bootstrap-admin strategy are defined.

---

## 11. Current User Journeys

### Journey A — New user registration

```text
Open /register
  → submit name/email/password
  → backend validates input
  → password hashed
  → user created with global_role USER
  → user can login
```

**Gap:** no verification, approval, default division assignment, or account status lifecycle.

### Journey B — Create board

```text
Login
  → dashboard
  → create board
  → creator becomes BOARD_ADMIN
  → board appears in accessible board list
```

### Journey C — Execute card

```text
Open board
  → create card with division/priority/due date
  → assign one or more users
  → move TO_DO → ON_PROGRESS
  → move ON_PROGRESS → ON_QC
  → authorized QC actor approves to DONE
  → or rejects to REVISION with note
  → work returns to ON_PROGRESS
```

### Journey D — Manage member

```text
Board admin opens board
  → lookup user
  → assign board role and optional division
  → member works on cards
```

**Gap:** this is board membership management, not global authorization management.

### Journey E — Super admin manages authorization

```text
Super admin opens admin console
  → finds user
  → grants/revokes multiple roles
  → assigns/removes multiple divisions
  → changes account status
  → action is audited
```

**Status:** **Target journey only; not implemented.**

---

## 12. Gap Matrix

| ID | Gap | Severity | Current evidence | Required outcome |
|---|---|---:|---|---|
| G-01 | User hanya memiliki satu `global_role` | P0 | `User.global_role` enum | Introduce role catalog + `UserRole` many-to-many |
| G-02 | User belum memiliki multi-division relationship | P0 | `Division` hanya direferensikan card/member | Add `UserDivision` with uniqueness and auditability |
| G-03 | Super-admin authorization management belum ada | P0 | No admin route/page/model | Protected admin API + UI for grant/revoke |
| G-04 | Privileged role self-assignment protection belum punya lifecycle lengkap | P0 | Register defaults to `USER`, no account status/approval model | Enforce server-side and test bootstrap/admin flow |
| G-05 | Division code dan five-master-data contract belum formal di schema | P1 | `Division.name` only | Add stable code, seed five divisions, migration policy |
| G-06 | Authorization audit belum ada | P1 | Only card activity exists | Add immutable role/division assignment audit |
| G-07 | Official test suite belum mencakup full authorization/workflow | P1 | Temporary/policy checks and partial verification | Add automated unit/integration/security tests |
| G-08 | Frontend admin console belum ada | P1 | App routes only login/register/dashboard/board | Add admin user/role/division screens |
| G-09 | Password recovery/email verification belum ada | P1 | Register/login only | Define account lifecycle and recovery flows |
| G-10 | Board/member/card authorization belum memiliki satu enforcement layer untuk semua mutation | P1 | Checks distributed in controllers plus policies | Consolidate policy service and test matrix |
| G-11 | Card creation status/filter-position edge cases belum diputuskan | P1 | Controller/presentation behavior needs explicit contract | Define and test create-column and filtered reorder semantics |
| G-12 | Attachment hanya URL, bukan managed upload | P2 | `CardAttachment.url` | Decide external-link vs object-storage upload |
| G-13 | No notification/realtime contract | P2 | No notification model/routes | Define later-phase collaboration notifications |
| G-14 | No reporting/analytics | P2 | No report model or route | Define KPI and reporting scope if needed |
| G-15 | Production operational readiness incomplete | P0/P1 | Lint/test/audit/deployment verification incomplete | Complete quality gates, monitoring, backup, rollback, and security review |

---

## 13. Recommended Target Product Requirements

Bagian ini mengubah gap utama menjadi requirement yang dapat diuji. Ini bukan klaim bahwa fiturnya sudah ada.

### AUTH-01 Self-registration

User dapat membuat akun tanpa memilih privileged role. Akun baru mendapat role default non-privileged dan status yang ditentukan oleh lifecycle policy.

### AUTH-02 Role catalog

Role disimpan sebagai master data dan dapat memiliki permission mapping. Role tidak boleh menjadi hardcoded single enum jika targetnya multiple roles.

### AUTH-03 Multiple roles

Satu user dapat memiliki lebih dari satu role. Duplicate assignment tidak diperbolehkan. Grant/revoke harus idempotent dan diaudit.

### AUTH-04 Multiple divisions

Satu user dapat terhubung ke beberapa division. Assignment harus memiliki uniqueness constraint dan status aktif/nonaktif bila diperlukan.

### AUTH-05 Super-admin management

Hanya super/global admin yang berwenang dapat mengelola role, division assignment, account status, dan privileged access user lain.

### AUTH-06 Server-side enforcement

Frontend tidak boleh menjadi sumber authorization. Backend harus mengevaluasi current user, status, roles, divisions, board membership, dan resource ownership pada setiap mutation.

### AUTH-07 Assignment audit

Setiap grant, revoke, status change, dan division assignment mencatat actor, target user, perubahan, timestamp, dan optional reason.

### DIV-01 Five master divisions

Seeder/migration menyediakan tepat master division yang disepakati dengan stable code: `PR`, `EEO`, `HRD`, `R&D`, `LNT`. Tidak ada plaintext credential dalam seed.

### KANBAN-01 Enforced workflow

Backend menolak transition ilegal dan memastikan QC/revision mengikuti state machine yang terdokumentasi.

### KANBAN-02 QC authorization

Hanya actor berwenang berdasarkan global role/assigned role, board membership, dan division context yang dapat memutuskan QC.

### KANBAN-03 Revision traceability

Revision decision memerlukan note bermakna dan menghasilkan history yang dapat dibaca oleh stakeholder board.

### OPS-01 Quality gates

Build, lint, schema validation, unit test, integration test, security test, seed verification, dan smoke test harus menjadi quality gate sebelum deployment.

---

## 14. Proposed Delivery Phases

### Phase 0 — Baseline and safety

- Freeze current-state PRD and architecture decisions.
- Validate canonical schema/migrations/seed location.
- Preserve existing user-local changes.
- Establish test and deployment quality gates.

### Phase 1 — Authorization data model

- Add `Role`, `UserRole`, `UserDivision`.
- Add division code and five master division seed.
- Define migration mapping from `global_role` and board roles.
- Add account status and bootstrap-admin strategy.

### Phase 2 — Authorization API and policy

- Add super-admin protected APIs.
- Centralize permission evaluation.
- Add assignment audit.
- Add unit/integration/security tests.

### Phase 3 — Super-admin UI

- User search/detail.
- Role grant/revoke.
- Division assignment.
- Account status management.
- Authorization audit viewer.

### Phase 4 — Kanban quality hardening

- Resolve card creation column semantics.
- Resolve reorder under filters.
- Add complete transition/QC/revision integration tests.
- Improve optimistic concurrency and error UX.

### Phase 5 — Operational readiness

- Fix frontend lint configuration.
- Dependency audit/remediation.
- Backup/restore and rollback runbook.
- Monitoring, logging, and production security review.

---

## 15. Acceptance Criteria for This Reverse-Engineering PRD

This document is considered useful as a baseline when:

- current implemented features are distinguishable from target features;
- every major requirement has an evidence/status label;
- the current single-role model is not incorrectly described as multi-role;
- the five-division target is recorded without inventing accounts or credentials;
- gaps are assigned severity and a potential delivery phase;
- known Kanban and quality-gate risks are visible;
- no secret, password, token, API key, or connection string is present.

---

## 16. Evidence Index

Primary files inspected for this reverse engineering:

- `backend/prisma/schema.prisma`
- `backend/prisma/seed.ts`
- `backend/src/app.ts`
- `backend/src/routes/auth.routes.ts`
- `backend/src/routes/board.routes.ts`
- `backend/src/routes/card.routes.ts`
- `backend/src/routes/attachment.routes.ts`
- `backend/src/routes/lookup.routes.ts`
- `backend/src/controllers/auth.controller.ts`
- `backend/src/controllers/board.controller.ts`
- `backend/src/controllers/card.controller.ts`
- `backend/src/controllers/attachment.controller.ts`
- `backend/src/controllers/lookup.controller.ts`
- `backend/src/middlewares/auth.middleware.ts`
- `backend/src/policies/workflow.policy.ts`
- `backend/src/policies/authorization.policy.ts`
- `backend/src/schemas/validation.schemas.ts`
- `frontend/src/App.tsx`
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/RegisterPage.tsx`
- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/pages/BoardDetailPage.tsx`
- `docs/SYSTEM_FLOW_AND_QC_GUIDE.md`
- `docs/ARCHITECTURE_DECISIONS.md`
- `docs/COUNCIL_CODE_REVIEW.md`
- `docs/UPDATE_PLAN.md`

This evidence index intentionally does not imply that every documented target feature is implemented.

---

## 17. Approved Governance & Specification Standard

Following the formal Deep Council review (`docs/COUNCIL_PRD_REVIEW.md`) and Change Plan execution (`docs/PRD_CHANGE_PLAN.md`), the target requirements are governed by the following canonical contract documents:

1. **Authorization Glossary & Vocabulary:** `docs/AUTHORIZATION_GLOSSARY.md`
2. **Permission Matrix (Zero-TBD):** `docs/AUTHORIZATION_MATRIX.md`
3. **Account Lifecycle & Token Revocation:** `docs/ACCOUNT_LIFECYCLE.md`
4. **Database Migration & Rollback Strategy:** `docs/AUTHORIZATION_MIGRATION_MAP.md`
5. **Seeding & Bootstrap Policy:** `docs/SEED_AND_BOOTSTRAP_POLICY.md`
6. **Data Model ERD:** `docs/USER_AUTHORIZATION_ERD.md`
7. **Council PRD Review:** `docs/COUNCIL_PRD_REVIEW.md`
8. **Implementation Change Plan:** `docs/PRD_CHANGE_PLAN.md`
9. **Revision Changelog:** `docs/REVISION_CHANGELOG.md`

# BNCC Proker Kanban — Full System Flow & Visualisation Brief

> **Purpose:** Dokumen ini dibuat sebagai single source of understanding untuk quality check. Dokumen ini dapat langsung diberikan kepada image-generative AI untuk dibuat menjadi diagram sistem, user-flow map, atau architecture infographic.
>
> **Project:** BNCC Proker Kanban
> **System type:** Internal web application untuk mengelola program kerja/proker, board, tugas, divisi, QC, dan revisi.
> **Current status:** Functional MVP foundation. Sebagian policy hardening sudah diimplementasikan, tetapi desain user-role multi-role pada dokumen ini masih merupakan target architecture dan belum seluruhnya diterapkan ke schema/source code.

---

## 1. Tujuan Sistem

Sistem ini digunakan oleh organisasi BNCC untuk:

1. Mengelola program kerja dalam bentuk board.
2. Mengorganisasi pekerjaan dalam Kanban.
3. Menghubungkan card dengan divisi, assignee, priority, dan due date.
4. Memindahkan pekerjaan melalui workflow yang jelas.
5. Mengirim pekerjaan ke Quality Control.
6. Menerima keputusan QC: selesai atau perlu revisi.
7. Mencatat aktivitas penting sebagai audit trail.
8. Membatasi aksi berdasarkan authentication, role, division, dan board membership.
9. Memungkinkan user membuat akun sendiri, lalu administrator memberikan role dan scope akses.

---

## 2. Konteks Organisasi

Sistem memiliki lima divisi utama BNCC:

| Code | Nama |
|---|---|
| `PR` | Public Relation |
| `EEO` | Event & External Event Organizer |
| `HRD` | Human Resource and Development |
| `RND` | Research and Development |
| `LNT` | Learning and Training |

Divisi adalah master data organisasi. Divisi tidak sama dengan role.

Contoh:

```text
User = Reihan Permana
Role = KOOR_DIVISION
Division = RND
```

Artinya user tersebut adalah koordinator untuk divisi R&D. `KOOR_DIVISION` menjelaskan kewenangan, sedangkan `RND` menjelaskan scope divisinya.

---

## 3. Aktor Sistem

### 3.1 Guest / Unauthenticated User

Dapat:

- Membuka halaman login.
- Membuka halaman signup.
- Membuat akun sendiri.

Tidak dapat:

- Membuka board internal.
- Melihat card internal.
- Mengubah data organisasi.
- Memberikan role kepada dirinya sendiri.

### 3.2 Registered Staff

Akun baru secara default menjadi user non-privileged dengan role `STAFF` setelah aktif.

Dapat:

- Login.
- Melihat board yang diizinkan.
- Melihat card sesuai akses board.
- Membuat atau mengubah pekerjaan sesuai permission board.
- Mengubah status card hanya melalui transisi workflow yang valid.

Tidak dapat:

- Menjadikan dirinya admin.
- Memberikan role kepada user lain.
- Mengakses board tanpa membership/authorization.
- Menyetujui QC jika bukan pihak berwenang.

### 3.3 Koordinator Divisi

Role: `KOOR_DIVISION`.

Scope aksesnya harus terhubung ke satu atau beberapa divisi. Koordinator divisi:

- Melihat pekerjaan divisinya.
- Meninjau pekerjaan yang masuk QC untuk divisinya.
- Menyetujui pekerjaan menjadi `DONE`.
- Mengembalikan pekerjaan menjadi `REVISION` dengan catatan revisi.
- Tidak otomatis memiliki akses global ke seluruh divisi.

### 3.4 Board Admin

Role: `BOARD_ADMIN` pada board tertentu atau melalui role administratif yang ditentukan sistem.

Dapat:

- Mengelola board.
- Mengelola board member.
- Mengatur card dalam board.
- Melakukan QC sesuai authorization policy.

### 3.5 Global Admin / Super Admin

Role: `GLOBAL_ADMIN`.

Ini adalah otoritas tertinggi aplikasi. Dapat:

- Mengaktifkan atau menonaktifkan user.
- Mengatur role user.
- Mencabut role user.
- Menetapkan user ke satu atau beberapa divisi.
- Menetapkan primary division.
- Mengelola board dan board member.
- Mengawasi seluruh pekerjaan.
- Mengatur authorization user lain.

User biasa tidak boleh memilih role privileged ketika signup.

---

## 4. Model Authorization yang Diinginkan

Sistem tidak boleh bergantung pada satu kolom `user.role` saja. Model targetnya adalah role dan division terpisah sehingga satu user dapat memiliki beberapa role dan beberapa scope.

```text
USER
  ├── USER_ROLE ─────── ROLE
  └── USER_DIVISION ─── DIVISION
```

Contoh user:

```text
User A
  ├── STAFF
  ├── KOOR_DIVISION
  └── RND

User B
  ├── STAFF
  ├── BOARD_ADMIN
  ├── PR
  └── HRD

User C
  ├── GLOBAL_ADMIN
  └── seluruh organisasi
```

Authorization dievaluasi dari kombinasi:

```text
account_status
+ assigned roles
+ assigned divisions
+ board membership
+ object ownership
+ requested action
```

Frontend hanya menampilkan atau menyembunyikan tombol sebagai UX. Backend tetap menjadi sumber kebenaran authorization.

---

## 5. Data Utama Sistem

### 5.1 User

Menyimpan identitas login dan status akun:

- full name
- email/username
- password hash
- account status
- flag wajib ganti password
- created at
- updated at

Password plaintext tidak disimpan.

### 5.2 Role

Role dasar yang direkomendasikan:

- `STAFF`
- `KOOR_DIVISION`
- `BOARD_ADMIN`
- `GLOBAL_ADMIN`

Role privileged hanya dapat diberikan oleh `GLOBAL_ADMIN`.

### 5.3 Division

Master data lima divisi BNCC:

- `PR`
- `EEO`
- `HRD`
- `RND`
- `LNT`

### 5.4 Board

Board merepresentasikan satu ruang kerja/proker. Board memiliki:

- nama
- pembuat
- daftar member
- daftar card
- timestamp

### 5.5 Board Member

Relasi antara user dan board. Board membership menentukan apakah user boleh masuk dan beroperasi pada board tersebut.

### 5.6 Card

Card merepresentasikan tugas/pekerjaan. Card dapat memiliki:

- title
- description
- status
- priority
- division
- assignee
- due date
- position/order
- creator
- activity history

---

## 6. Authentication Flow

```text
[Guest]
   |
   | Signup
   v
[Create Account]
   |
   v
[Account Pending/Active]
   |
   | default role: STAFF
   v
[Login]
   |
   v
[Credential Validation]
   |
   +-- invalid --> [401 Unauthorized]
   |
   +-- inactive/suspended --> [403 Account Inactive]
   |
   +-- valid --> [Issue JWT/Session]
                         |
                         v
                    [Dashboard]
```

Aturan penting:

1. Email harus unik.
2. Password diverifikasi menggunakan password hash.
3. JWT/session membawa identity, bukan seluruh keputusan authorization permanen.
4. Backend tetap mengambil role/division/membership terbaru dari database.
5. User baru tidak boleh signup sebagai `GLOBAL_ADMIN`.
6. Akun import massal sebaiknya memakai temporary password dan wajib mengganti password.

---

## 7. Login sampai Dashboard Flow

```text
User membuka aplikasi
        |
        v
Frontend mengecek session/token
        |
        +-- tidak ada token --> Login page
        |
        +-- ada token -------> Request /me atau profile
                                      |
                                      +-- token invalid --> logout + Login
                                      |
                                      +-- token valid ---> load user authorization
                                                               |
                                                               v
                                                         Dashboard
```

Dashboard menampilkan hanya resource yang boleh diakses user.

---

## 8. Board Access Flow

```text
[Request board]
       |
       v
[Authenticate user]
       |
       v
[Load user role/division/board membership]
       |
       +-- GLOBAL_ADMIN? ------ yes --> allow
       |
       +-- board member? ------- yes --> evaluate board role --> allow/deny
       |
       +-- neither ------------- no --> 403 Forbidden
```

Access tidak boleh hanya disembunyikan dari frontend. Endpoint backend harus melakukan pengecekan yang sama.

---

## 9. Kanban Board Flow

Board memiliki kolom workflow berikut:

```text
TO_DO → ON_PROGRESS → ON_QC → DONE
                         |
                         v
                      REVISION
                         |
                         v
                    ON_PROGRESS
```

### 9.1 Makna Status

| Status | Makna |
|---|---|
| `TO_DO` | Pekerjaan belum mulai. |
| `ON_PROGRESS` | Pekerjaan sedang dikerjakan. |
| `ON_QC` | Pekerjaan siap diperiksa. |
| `REVISION` | Pekerjaan dikembalikan dengan catatan perbaikan. |
| `DONE` | Pekerjaan telah disetujui/selesai. |

### 9.2 Transition Rules

| From | To | Keterangan |
|---|---|---|
| `TO_DO` | `ON_PROGRESS` | Staff mulai mengerjakan. |
| `ON_PROGRESS` | `TO_DO` | Dapat dikembalikan jika belum dimulai, bila policy mengizinkan. |
| `ON_PROGRESS` | `ON_QC` | Pekerjaan diajukan untuk QC. |
| `ON_QC` | `DONE` | Hanya QC authority yang boleh menyetujui. |
| `ON_QC` | `REVISION` | Hanya QC authority, wajib ada catatan revisi. |
| `REVISION` | `ON_PROGRESS` | Pekerjaan dikerjakan ulang. |
| Status sama | Status sama | Reordering dalam kolom tetap diperbolehkan. |
| `DONE` | status lain | Ditolak secara default. |
| `TO_DO` | `DONE` | Ditolak karena melewati workflow. |

### 9.3 Card Creation

```text
[User klik Add Card]
        |
        v
[Input title, description, division, assignee, priority, due date]
        |
        v
[Frontend validation]
        |
        v
[POST /cards]
        |
        v
[Authenticate]
        |
        v
[Validate payload]
        |
        v
[Check board membership and create permission]
        |
        v
[Set initial status = TO_DO]
        |
        v
[Persist card]
        |
        v
[Write activity log]
        |
        v
[Return card]
```

Status awal harus konsisten. User tidak boleh membuat card langsung menjadi `DONE` atau `ON_QC` tanpa proses workflow yang sah.

---

## 10. Drag-and-Drop Flow

```text
User drag card dari Column A ke Column B
        |
        v
Frontend menentukan card_id, target_status, target_position
        |
        v
PATCH/PUT card movement request
        |
        v
Backend authenticate
        |
        v
Backend validate payload
        |
        v
Backend load current card + board + actor authorization
        |
        v
Check allowed transition
        |
        +-- invalid --> 400 Invalid Workflow Transition
        |
        +-- valid --> check special QC permission
                              |
                              +-- unauthorized --> 403 Forbidden
                              |
                              +-- authorized --> transaction:
                                                    update status
                                                    reorder cards
                                                    write activity
                                                         |
                                                         v
                                                       response
```

Jika filter aktif, frontend harus menghitung posisi berdasarkan dataset yang benar dan backend tetap harus menormalkan order agar tidak terjadi duplikasi atau posisi negatif.

---

## 11. QC and Revision Flow

```text
[Staff selesai bekerja]
        |
        v
[Move ON_PROGRESS → ON_QC]
        |
        v
[QC authority membuka card]
        |
        +-----------------------------+
        |                             |
        v                             v
[Approve]                         [Reject]
        |                             |
        v                             v
ON_QC → DONE                  ON_QC → REVISION
                                      |
                                      v
                           wajib revision note >= 5 karakter
                                      |
                                      v
                              assign kembali ke worker
                                      |
                                      v
                              REVISION → ON_PROGRESS
```

QC authority adalah salah satu dari:

- `GLOBAL_ADMIN`;
- `BOARD_ADMIN` yang berwenang pada board;
- `KOOR_DIVISION` untuk divisi yang sesuai dengan card.

Staff biasa tidak boleh memutuskan QC hanya karena dia dapat melihat card.

---

## 12. Authorization Decision Flow

```text
[Incoming request]
        |
        v
[Is user authenticated?]
        |
        +-- no --> 401
        |
        v
[Is account active?]
        |
        +-- no --> 403
        |
        v
[Load roles, divisions, membership, target resource]
        |
        v
[Evaluate requested action]
        |
        +-- GLOBAL_ADMIN --> allow
        |
        +-- BOARD_ADMIN + board scope --> allow according to board policy
        |
        +-- KOOR_DIVISION + matching division --> allow division actions
        |
        +-- STAFF + allowed ownership/membership --> allow limited action
        |
        +-- no matching policy --> 403
```

---

## 13. Super Admin User Management Flow

```text
[Super Admin membuka User Management]
        |
        v
[Load users]
        |
        +-- search/filter by name, email, status, division, role
        |
        v
[Open user detail]
        |
        +-- assign role
        +-- revoke role
        +-- assign division
        +-- revoke division
        +-- set primary division
        +-- activate/suspend account
        |
        v
[Confirm change]
        |
        v
[Backend verifies GLOBAL_ADMIN]
        |
        +-- unauthorized --> 403
        |
        +-- authorized --> transaction:
                              update assignment
                              record actor
                              record timestamp
                              write audit log
                                   |
                                   v
                              return updated authorization
```

Perubahan authorization harus dapat diaudit. Sistem harus mengetahui siapa yang memberikan role, kepada siapa, kapan, dan status assignment-nya.

---

## 14. Activity and Audit Flow

Aktivitas penting yang sebaiknya dicatat:

- user login/logout;
- signup;
- account activation/suspension;
- role granted/revoked;
- division assigned/revoked;
- board created/updated/deleted;
- board member added/removed;
- card created;
- card edited;
- card assigned;
- card moved;
- card submitted to QC;
- card approved;
- card rejected to revision;
- revision note added.

```text
[Domain mutation]
        |
        v
[Database transaction]
        |
        +-- update domain data
        +-- create activity/audit record
        |
        v
[Response]
```

Perubahan domain dan audit event sebaiknya dibuat dalam transaction yang sama agar tidak terjadi perubahan tanpa jejak audit.

---

## 15. Error Flow

| Kondisi | Response yang diharapkan |
|---|---|
| Tidak login | `401 Unauthorized` |
| Akun inactive/suspended | `403 Forbidden` |
| Tidak punya role/scope | `403 Forbidden` |
| Resource tidak ditemukan | `404 Not Found` |
| Payload invalid | `400 Bad Request` atau `422 Unprocessable Entity` |
| Workflow transition invalid | `400 Bad Request` |
| QC dilakukan pihak tidak berwenang | `403 Forbidden` |
| Revision tanpa catatan valid | `400 Bad Request` |
| Email sudah digunakan | `409 Conflict` |

Error tidak boleh membocorkan password, token, connection string, atau data sensitif.

---

## 16. Target Database Relationship

```text
USER
  ├──< USER_ROLE >── ROLE
  ├──< USER_DIVISION >── DIVISION
  ├──< BOARD_MEMBER >── BOARD
  ├── creates >── CARD
  └── produces >── AUDIT_LOG

BOARD
  ├──< BOARD_MEMBER
  └──< CARD

DIVISION
  ├──< USER_DIVISION
  └──< CARD

CARD
  └──< ACTIVITY_LOG
```

Prinsip database:

- email user unique;
- role code unique;
- division code unique;
- user-role composite unique;
- user-division composite unique;
- foreign key wajib valid;
- revoked assignment tidak berlaku untuk authorization aktif;
- satu user maksimal memiliki satu primary division.

---

## 17. Seed Data vs User-Created Data

### Seeder membuat

- lima master division;
- role master;
- optional bootstrap `GLOBAL_ADMIN` melalui environment yang aman;
- migration dan constraint database.

### User membuat sendiri

- akun mereka melalui signup;
- profile dasar mereka;
- password mereka.

### Super Admin mengatur

- account status;
- role tambahan;
- division assignment;
- primary division;
- board membership;
- board-specific authorization.

Seeder tidak boleh membuat akun otomatis seperti “admin PR”, “admin HRD”, atau akun berdasarkan nama divisi kecuali memang ada keputusan bisnis eksplisit untuk akun bootstrap tertentu.

---

## 18. End-to-End Example

### Example: Staff mengerjakan card R&D

```text
1. User signup menggunakan email.
2. Sistem membuat akun dengan role STAFF.
3. Super Admin mengaktifkan akun.
4. Super Admin memberi division RND.
5. Super Admin atau Board Admin menambahkan user ke board R&D.
6. User login.
7. User melihat board yang menjadi member-nya.
8. User membuat card baru.
9. Card mulai dari TO_DO.
10. User memindahkan card ke ON_PROGRESS.
11. User menyelesaikan pekerjaan.
12. User mengajukan card ke ON_QC.
13. Koor R&D melakukan review.
14. Jika valid, card dipindahkan ke DONE.
15. Jika belum valid, card dipindahkan ke REVISION dengan catatan.
16. User memperbaiki card.
17. Card dikembalikan ke ON_PROGRESS lalu ON_QC.
18. Koor R&D melakukan review ulang.
19. Semua mutation penting tercatat di activity/audit log.
```

### Example: User mencoba mengubah role sendiri

```text
1. User mengirim request assign GLOBAL_ADMIN kepada dirinya sendiri.
2. Backend membaca actor role.
3. Actor bukan GLOBAL_ADMIN yang valid untuk perubahan tersebut.
4. Request ditolak dengan 403 Forbidden.
5. Attempt dapat dicatat sebagai security audit event.
```

---

## 19. Visual Diagram Brief untuk Image AI

Gunakan prompt berikut jika ingin mengubah dokumen ini menjadi gambar:

```text
Create a clear professional system-flow infographic for an internal BNCC Proker Kanban web application.

Show five horizontal layers:
1. Actors: Guest, Staff, Division Coordinator, Board Admin, Global Admin.
2. Authentication: Signup, account activation, login, JWT/session, dashboard.
3. Authorization: User, multiple roles, multiple divisions, board membership, backend policy.
4. Kanban workflow: TO_DO → ON_PROGRESS → ON_QC → DONE, with ON_QC → REVISION → ON_PROGRESS.
5. Data and audit: Users, Roles, Divisions, Boards, Board Members, Cards, Activity/Audit Logs.

Use separate colors for:
- authentication;
- authorization/security;
- board/Kanban workflow;
- QC/revision;
- database entities;
- audit logging.

Show Global Admin above the authorization layer with arrows to assign/revoke roles, divisions, account status, and board membership.
Show Division Coordinator connected only to the matching division and QC actions for that division.
Show Staff connected to limited card operations.
Show the backend request pipeline:
HTTP request → authentication → validation → load context → authorization policy → workflow policy → transaction → audit log → response.

Important labels:
- Five divisions: PR, EEO, HRD, RND, LNT.
- Roles: STAFF, KOOR_DIVISION, BOARD_ADMIN, GLOBAL_ADMIN.
- Backend is the source of truth for authorization.
- New users default to STAFF and cannot self-assign privileged roles.
- QC approval requires authorized actor.
- Revision requires a note of at least 5 characters.

Style: clean technical architecture diagram, readable Indonesian labels, directional arrows, no decorative clutter, no credentials, no passwords, no real personal data.
```

---

## 20. Quality Check Questions

Gunakan pertanyaan berikut untuk memvalidasi apakah desain sudah sesuai kebutuhan:

1. Apakah user bisa signup sendiri tanpa dibuat oleh seeder per divisi?
2. Apakah user baru otomatis non-privileged?
3. Apakah satu user bisa memiliki lebih dari satu role?
4. Apakah satu user bisa memiliki lebih dari satu divisi?
5. Apakah role dan division diperlakukan sebagai dua konsep berbeda?
6. Apakah Super Admin bisa memberikan dan mencabut role?
7. Apakah Super Admin bisa memberikan dan mencabut division?
8. Apakah koordinator hanya punya kewenangan pada divisinya?
9. Apakah Board Admin dibatasi pada board yang relevan?
10. Apakah Staff tidak dapat mengubah role dirinya sendiri?
11. Apakah card selalu mengikuti workflow yang valid?
12. Apakah QC approval hanya boleh dilakukan pihak berwenang?
13. Apakah revision wajib memiliki catatan?
14. Apakah setiap perubahan penting memiliki audit log?
15. Apakah frontend tidak menjadi satu-satunya lapisan keamanan?
16. Apakah akun suspended benar-benar tidak dapat memakai endpoint terproteksi?
17. Apakah lima divisi yang digunakan adalah PR, EEO, HRD, RND, dan LNT?
18. Apakah diagram dan implementasi aktual masih memiliki gap yang harus diselesaikan?

---

## 21. Important Reality Check

Dokumen ini membedakan dua hal:

### Current foundation

Project sudah memiliki foundation untuk:

- authentication;
- board/proker;
- board membership;
- Kanban;
- card;
- division/priority filter;
- assignee/due date;
- QC/revision concept;
- activity log;
- Prisma/PostgreSQL direction.

### Target architecture

Model berikut perlu dipastikan dan/atau diimplementasikan secara penuh:

- self-registration yang aman;
- many-to-many user-role;
- many-to-many user-division;
- Super Admin user-management dashboard;
- assignment/revocation audit history;
- complete backend authorization matrix;
- integration/security tests;
- frontend lint and CI quality gates.

Jangan menganggap seluruh target architecture sudah tersedia hanya karena diagram ini menjelaskannya. Dokumen ini adalah blueprint dan alat quality check untuk membandingkan kebutuhan bisnis dengan implementasi aktual.

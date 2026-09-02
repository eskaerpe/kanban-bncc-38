# Sprint 4: Notion-Style Card Modal & Property Editing

## Goal
Membangun modal detail card ber-gaya Notion (vertical property list) untuk mengedit properti card, deskripsi rich-text, dan lampiran link URL.

## Tasks Breakdown

### Task 4.1: Notion-Style Modal Component (Frontend)
- **Description**: Modal overlay saat card diklik dengan layout Notion-style.
- **Acceptance Criteria**:
  - Header: Editable Title.
  - Property Grid Vertikal:
    - `Status`: Dropdown select 5 kolom.
    - `Assignees`: Multi-select dropdown user board.
    - `Division`: Select tag divisi.
    - `Priority`: Select `Low` / `Mid` / `High`.
    - `Due Date`: Date picker.
    - `Attachments`: List of link URLs.
  - Main Body: Description text area (Rich text / Markdown).

### Task 4.2: Link Attachment Manager
- **Description**: Komponen untuk menambahkan dan menghapus lampiran link URL pada card.
- **Acceptance Criteria**:
  - Validasi regex URL: Wajib diawali `http://` atau `https://`.
  - Mengirimkan link tanpa protocol menolak input dengan error visual.
  - Menampilkan judul link & URL yang dapat diklik ke tab baru (`target="_blank"`).

### Task 4.3: Backend Card Detail & Property Update Endpoints
- **Description**: API backend untuk memperbarui atribut card.
- **Endpoints**:
  - `GET /api/cards/:id`
  - `PUT /api/cards/:id`
  - `POST /api/cards/:id/attachments`
  - `DELETE /api/cards/:id/attachments/:attachmentId`
- **Acceptance Criteria**:
  - Backend memvalidasi bahwa hanya user yang merupakan Assignee, Anggota Divisi terkait, atau Admin yang dapat mengubah properti card.

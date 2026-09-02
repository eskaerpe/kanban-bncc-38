# AGENTS.md — Coding Agent Rules & Guidelines (BNCC Proker Kanban)

Dokumen ini adalah aturan kerja wajib untuk AI Coding Agent (OpenCode / Claude Code / Codex / Antigravity) khusus pada project BNCC Proker Kanban.

## Aturan Utama
1. **1 Task = 1 Prompt = 1 Commit**. Jangan pernah mengerjakan beberapa task sekaligus.
2. **Strict Protocol**: Referensikan file `@docs/PRD.md`, `@docs/TASKS.md`, dan `@docs/sprints/sprint-xx.md`. Jangan berasumsi atau menambah fitur di luar dokumen ini.
3. **No Code Without Verification**: Sebelum melaporkan selesai, jalankan linter, test, atau build command untuk memastikan tidak ada error syntax.

## Per-Task Execution Command Pattern

Gunakan pola prompt ini saat memerintahkan coding agent:

```text
Referensikan @docs/AGENTS.md, @docs/PRD.md, @docs/TASKS.md, dan @docs/sprints/sprint-xx.md.
Kerjakan HANYA <Task ID & Judul Task, misal: Task 1.1: Database Schema & MySQL Migration Script>.
Ikuti acceptance criteria persis seperti yang tertulis.
Setelah selesai: jalankan npm run build / test, tempel bukti outputnya, dan buat commit git dengan pesan "T-xx: <judul>".
```

## Anti-Pattern (Jangan Dilakukan Agent)
- Menambahkan library tambahan tanpa konfirmasi.
- Menyimpan file upload binary di local disk server (hanya link URL HTTP/HTTPS).
- Menghapus atau mengubah struktur file di `docs/`.
- Membuka endpoint API tanpa autentikasi JWT / role check middleware.

# BNCC Proker Kanban - Multi-Division Program Workplan Platform

Monorepo application for managing organization program tasks across 5 standardized Kanban columns with strict Quality Control (QC) approval workflows, revision auditing, multi-assignees, and HTTP/HTTPS link attachments.

---

## 🚀 Key Features

- **User Auth & RBAC**: Secure JWT Authentication with role-based access control (`GLOBAL_ADMIN`, `BOARD_ADMIN`, `KOOR_DIVISION`, `STAFF`).
- **Board & Member Management**: Multi-member board authorization with member roles and assignment capabilities.
- **5 Standardized Kanban Columns**: Fixed 5-column workflow (`BACKLOG`, `TODO`, `IN_PROGRESS`, `ON_QC`, `DONE`).
- **Drag and Drop UI**: Built with `@dnd-kit` for intuitive drag-and-drop task reordering and status column updates.
- **QC Approval Gatekeeper**: Status transitions from `ON_QC` to `DONE` or `REVISION` are restricted strictly to Koor Division & Board Admins, requiring mandatory revision notes for rejection.
- **Notion-Style Card Detail Modal**: Vertical property layout featuring multi-assignee selection, HTTP/HTTPS link attachment manager, revision history, and a full activity audit log.

---

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM, MySQL
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, `@dnd-kit`
- **DevOps & Production**: Nginx, PM2, Bash scripts

---

## 📁 Monorepo Directory Structure

```text
kanban-bncc/
├── backend/                  # Express.js REST API & Prisma ORM
│   ├── prisma/               # Database schema & seeds
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── middleware/       # Auth & role verification
│   │   ├── routes/           # Express router definitions
│   │   └── index.ts          # API entry point & static asset fallback
│   └── package.json
├── frontend/                 # React SPA (Vite + Tailwind + @dnd-kit)
│   ├── src/
│   │   ├── api/              # Axios HTTP client & API hooks
│   │   ├── components/       # Board, Column, Card, Modal components
│   │   ├── context/          # React Context (Auth)
│   │   └── pages/            # App routes & views
│   └── package.json
├── docs/                     # Documentation & server templates
│   └── nginx-kanban.conf     # Nginx reverse proxy configuration
├── deploy.sh                 # Production deployment script
├── .env.example              # Root environment template
└── README.md
```

---

## 💻 Local Development Setup (XAMPP MySQL & Node.js)

### Langkah 1: Persiapan Database XAMPP MySQL
1. Buka **XAMPP Control Panel** di Windows dan jalankan service **MySQL** (dan Apache jika menggunakan phpMyAdmin).
2. Buat database baru bernama `kanban_bncc` melalui phpMyAdmin (`http://localhost/phpmyadmin`) atau MySQL CLI.

### Langkah 2: Konfigurasi Environment File
1. Di direktori `backend/`, buat/perbarui file `.env`:
   ```env
   DATABASE_URL="mysql://root:@localhost:3306/kanban_bncc"
   PORT=5000
   JWT_SECRET="kanban...2026"
   CORS_ORIGIN="http://localhost:5173"
   ```

2. Di direktori `frontend/`, buat/perbarui file `.env`:
   ```env
   VITE_API_BASE_URL="http://localhost:5000/api"
   ```

### Langkah 3: Database Migration & Seeding (Prisma)
Jalankan perintah berikut di folder `backend/`:
```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed
```
*(Perintah ini akan membuat struktur tabel di MySQL XAMPP dan mengisi data divisi standar BNCC serta akun seed default).*

### Langkah 4: Jalankan Server Backend & Frontend
**Option A (Terminal Terpisah):**
- **Terminal 1 (`backend/`)**: `npm run dev` (Berjalan di `http://localhost:5000`)
- **Terminal 2 (`frontend/`)**: `npm install` lalu `npm run dev` (Berjalan di `http://localhost:5173`)

**Option B (Root Monorepo Runner):**
- Di root monorepo: `npm run dev:backend` dan `npm run dev:frontend`

### Langkah 5: Verifikasi Akses Aplikasi
- Buka browser di `http://localhost:5173`.
- Lakukan Register akun baru atau Login menggunakan credential hasil seed.

---

## 🌐 Production Deployment Guide

### 1. Prerequisites

- **OS**: Ubuntu 22.04 LTS (or equivalent Linux distribution)
- **Node.js**: v18.x or v20.x LTS
- **Database**: MySQL 8.0+
- **Process Manager**: PM2 (`npm install -g pm2`)
- **Web Server**: Nginx

### 2. Automated Deployment

Execute the automated deployment script from the project root:

```bash
chmod +x deploy.sh
./deploy.sh
```

The script will automatically pull the main branch, install dependencies, run Prisma migrations, build TypeScript targets, and restart PM2.

### 3. Database Setup / Deployment

To manually run production database migrations and seeding:

```bash
cd backend
npm run db:setup
```

### 4. Nginx Reverse Proxy Configuration

Copy the configuration template from `docs/nginx-kanban.conf` to Nginx:

```bash
sudo cp docs/nginx-kanban.conf /etc/nginx/sites-available/kanban.bncc.net
sudo ln -s /etc/nginx/sites-available/kanban.bncc.net /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Process Monitoring (PM2)

Check running services and inspect application logs:

```bash
# Check PM2 process status
pm2 status

# View live application logs
pm2 logs kanban-backend

# Restart application
pm2 restart kanban-backend
```

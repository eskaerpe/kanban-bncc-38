# Deployment & Production Setup — BNCC Proker Kanban

Dokumen ini menjelaskan prosedur deployment aplikasi BNCC Proker Kanban pada server VPS (Ubuntu 22.04 LTS) tanpa Docker, menggunakan PM2 dan Nginx.

## 1. Prerequisites Server
- Ubuntu 22.04 LTS (VPS).
- Node.js v18.x / v20.x & npm.
- MySQL Server 8.0+.
- PM2 (Process Manager): `npm install -g pm2`.
- Nginx Web Server.

## 2. Environment Variables Setup

Buat file `.env` di folder root backend:

```env
PORT=5000
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=bncc_kanban_user
DB_PASSWORD=YourStrongPasswordHere
DB_NAME=bncc_kanban_db

# Security & JWT
JWT_SECRET=super_secret_jwt_key_bncc_2026_change_this
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://kanban.bncc.net
```

## 3. Database Migration Steps
1. Masuk ke MySQL CLI: `mysql -u root -p`.
2. Buat database & user:
   ```sql
   CREATE DATABASE bncc_kanban_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'bncc_kanban_user'@'localhost' IDENTIFIED BY 'YourStrongPasswordHere';
   GRANT ALL PRIVILEGES ON bncc_kanban_db.* TO 'bncc_kanban_user'@'localhost';
   FLUSH PRIVILEGES;
   ```
3. Eksekusi file DDL: `mysql -u bncc_kanban_user -p bncc_kanban_db < docs/schema.sql`.

## 4. Frontend Build & Backend PM2 Run

### Backend
```bash
cd backend
npm install --production
pm2 start server.js --name "bncc-kanban-api"
pm2 save
```

### Frontend Build
```bash
cd frontend
npm install
npm run build
# Output build akan ada di folder frontend/dist
```

## 5. Nginx Configuration

Buat konfigurasi site Nginx `/etc/nginx/sites-available/bncc-kanban`:

```nginx
server {
    listen 80;
    server_name kanban.bncc.net;

    # Frontend Static Files
    location / {
        root /var/www/bncc-kanban/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Reverse Proxy
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site & SSL Certbot:
```bash
sudo ln -s /etc/nginx/sites-available/bncc-kanban /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d kanban.bncc.net
```

## 6. Smoke Test (Post-Deploy Checklist)
1. Buka `https://kanban.bncc.net` -> Pastikan halaman Login muncul.
2. Login dengan akun Global Admin -> Pastikan Dashboard Proker memuat data.
3. Test buat 1 Card & pindahkan status -> Cek apakah API return 200 OK.

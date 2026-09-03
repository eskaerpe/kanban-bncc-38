#!/bin/bash
set -e

# Anchor script execution to repository root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Starting deployment sequence ==="

echo "[1/4] Pulling latest code from main..."
git pull origin main

echo "[2/4] Setting up and building backend..."
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run build

echo "[3/4] Setting up and building frontend..."
cd ../frontend
npm install
npm run build

echo "[4/4] Restarting process manager..."
cd ..
pm2 restart kanban-backend || pm2 start backend/dist/index.js --name kanban-backend

echo "=== Deployment completed successfully! ==="

#!/usr/bin/env bash
# PDFToolsHub deploy script — run on the VPS as the deploy user.
# Usage: bash deploy/deploy.sh [branch]
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/pdftoolshub}"
BRANCH="${1:-prod}"
BACKUP_SENTINEL=".deployed"

cd "$APP_DIR"

echo "==> Pulling $BRANCH"
git fetch --all --prune
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "==> Installing dependencies"
npm ci --no-audit --no-fund

echo "==> Prisma generate"
npx prisma generate

echo "==> Building"
npm run build

echo "==> Restarting service"
sudo systemctl restart pdftoolshub

echo "==> Done. Health check:"
sleep 2
curl -fsS http://127.0.0.1:3000/api/health || echo "App not responding — check journalctl -u pdftoolshub"
touch "$BACKUP_SENTINEL"
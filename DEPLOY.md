# PDFToolsHub — VPS Deployment Guide

Deploy PDFToolsHub on a plain Linux VPS (Ubuntu 22.04 / 24.04 recommended).
Everything runs on a single machine — no external SaaS required for the 26 PDF tools.
Accounts & usage history need PostgreSQL (optional otherwise).

---

## 1. Prerequisites

- A VPS (1 vCPU / 1 GB is enough for light use; 2 GB recommended for OCR/compress)
- A domain name (setup below uses `pdf.example.com` — replace it)
- Node.js 20+ (guide: Node 22 LTS)

```bash
# Debian/Ubuntu
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git
node --version
```

---

## 2. Create a deploy user

```bash
sudo adduser --disabled-password deploy
sudo usermod -aG sudo deploy
sudo -u deploy mkdir -p /var/www/pdftoolshub
```

---

## 3. Clone & build the app

```bash
sudo -iu deploy
cd /var/www/pdftoolshub
git clone https://github.com/NSKWeb/pdftoolshub.git .
git checkout prod   # production branch

# Install dependencies (production-only is smaller, but Next build needs dev too)
npm ci
npm run prisma:generate
npm run build
```

---

## 4. Configure environment

```bash
cp .env.example .env
nano .env
```

Set at minimum:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_SITE_URL` | `https://pdf.example.com` |
| `JWT_SECRET` | `openssl rand -hex 32` output |
| `DATABASE_URL` | `postgresql://pdftoolshub:<strong-password>@localhost:5432/pdftoolshub` (optional) |

---

## 5. Database (optional, for accounts)

```bash
sudo apt-get install -y postgresql
sudo -u postgres psql -c "CREATE USER pdftoolshub WITH PASSWORD '<strong-password>';"
sudo -u postgres psql -c "CREATE DATABASE pdftoolshub OWNER pdftoolshub;"
```

Push the schema:

```bash
cd /var/www/pdftoolshub
npx prisma db push   # or: npx prisma migrate deploy if you have migrations
```

---

## 6. Run as a systemd service

Create `/etc/systemd/system/pdftoolshub.service`:

```ini
[Unit]
Description=PDFToolsHub (Next.js)
After=network.target postgresql.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/var/www/pdftoolshub
EnvironmentFile=/var/www/pdftoolshub/.env
ExecStart=/usr/bin/npm run start -- -p 3000
Restart=on-failure
RestartSec=5
# Hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ReadWritePaths=/var/www/pdftoolshub/.uploads

[Install]
WantedBy=multi-user.target
```

Enable & start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now pdftoolshub
sudo systemctl status pdftoolshub --no-pager
```

---

## 7. Reverse proxy — nginx + HTTPS

```bash
sudo apt-get install -y nginx
```

Create `/etc/nginx/sites-available/pdftoolshub`:

```nginx
server {
    listen 80;
    server_name pdf.example.com;

    # Redirect all HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pdf.example.com;

    # --- TLS ---
    ssl_certificate     /etc/letsencrypt/live/pdf.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pdf.example.com/privkey.pem;

    client_max_body_size 75M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host                $host;
        proxy_set_header X-Real-IP           $remote_addr;
        proxy_set_header X-Forwarded-For     $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto   $scheme;
        proxy_read_timeout 300s;   # OCR/compress can be slow; raise a bit
        proxy_send_timeout 300s;
    }
}
```

Enable + get a TLS cert:

```bash
sudo ln -s /etc/nginx/sites-available/pdftoolshub /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d pdf.example.com
```

---

## 8. Auto-restart & updates

Optional scheduled rebuild (cron, as deploy user):

```cron
0 4 * * * cd /var/www/pdftoolshub && git pull --ff-only && npm ci && npx prisma generate && npm run build && sudo systemctl restart pdftoolshub
```

---

## 9. Verify

- `https://pdf.example.com` loads
- `/api/health` returns `{"status":"ok"}` — `curl https://pdf.example.com/api/health`
- Upload a PDF → merge it → download works

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `502 Bad Gateway` | `sudo journalctl -u pdftoolshub -n 50` — check the app is running on :3000 |
| Uploads fail with `413` | Raise `client_max_body_size` in the nginx config (75M above) |
| OCR fails on first run | Allow tesseract to download language data, or pre-seed `TESSERACT_DATA_DIR` |
| Slow first request | Normal — next.js starts lazily; warm with `curl /api/health` after restart |
| `prisma` client errors | `npm run prisma:generate` after every `git pull` |
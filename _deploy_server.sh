#!/bin/bash
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

echo "=== 1. Install Node.js 22 ==="
apt-get update -y
apt-get install -y curl gnupg ca-certificates
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
node -v
npm -v

echo "=== 2. Install PostgreSQL 16 ==="
apt-get install -y postgresql postgresql-contrib

echo "=== 3. Create database ==="
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='wall'" | grep -q 1 || sudo -u postgres psql -c "CREATE USER wall WITH PASSWORD 'wall';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='confession_wall'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE confession_wall OWNER wall;"

echo "=== 4. Create .env ==="
cd /www/wwwroot/Confession-Wall/web
AUTH_SECRET=$(openssl rand -hex 32)
cat > .env <<EOF
DATABASE_URL=postgresql://wall:wall@127.0.0.1:5432/confession_wall
AUTH_SECRET=${AUTH_SECRET}
ADMIN_EMAIL=admin@example.com
DEEPSEEK_API_KEY=sk-a9e8d8392d094f8996ac85090105d9fb
DEEPSEEK_MODEL=deepseek-flash
SMTP_HOST=
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
EOF
echo ".env created"

echo "=== 5. Set npm mirror ==="
npm config set registry https://registry.npmmirror.com
export PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma

echo "=== 6. npm install ==="
npm install

echo "=== 7. prisma db push ==="
npx prisma db push

echo "=== 8. build ==="
npm run build

echo "=== 9. PM2 ==="
npm install -g pm2
pm2 start npm --name confession-wall -- start
pm2 save
pm2 startup systemd -u root --hp /root | bash || true

echo "DEPLOY_DONE"

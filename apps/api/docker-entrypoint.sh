#!/bin/sh
# Applies pending Prisma migrations before the API starts.
#
# `migrate deploy` only replays committed migration files — it never generates
# new ones and never prompts — so it is safe to run on every container start,
# including when several replicas boot at once (Prisma takes an advisory lock).
set -e

echo "[entrypoint] waiting for database..."
# Prisma itself retries the connection, but a short wait keeps the first-boot
# logs clean when MySQL is still initialising.
until node -e "
  const net = require('net');
  const url = new URL(process.env.DATABASE_URL);
  const s = net.connect(Number(url.port || 3306), url.hostname);
  s.on('connect', () => { s.end(); process.exit(0); });
  s.on('error', () => process.exit(1));
" 2>/dev/null; do
  sleep 2
done

echo "[entrypoint] applying migrations..."
npx prisma migrate deploy

echo "[entrypoint] starting API..."
exec "$@"

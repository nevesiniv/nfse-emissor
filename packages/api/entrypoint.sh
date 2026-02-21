#!/bin/sh
set -e

echo "[API] Executando migrações Prisma..."
npx prisma migrate deploy

echo "[API] Executando seed..."
npx prisma db seed || true

echo "[API] Iniciando servidor..."
node dist/index.js

#!/bin/sh
set -e

echo "==> Aplicando migrações do banco..."
npx prisma migrate deploy

echo "==> Verificando dados iniciais (seed idempotente — só popula se vazio)..."
npx tsx prisma/seed.ts || echo "Seed ignorado (banco já populado ou erro não-crítico)"

echo "==> Iniciando aplicação na porta ${PORT:-3000}..."
exec npx next start -p "${PORT:-3000}"

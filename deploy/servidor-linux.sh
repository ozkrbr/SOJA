#!/bin/bash
# ============================================================
# deploy/servidor-linux.sh
# Sobe o Custo de Produção Soja em qualquer servidor Linux
# com Docker instalado. Não precisa do código-fonte.
#
# Uso:
#   chmod +x servidor-linux.sh
#   ./servidor-linux.sh
# ============================================================
set -e

IMAGE="ozkr/custo-soja:latest"
DB_NAME="custo_soja"
DB_USER="soja"
DB_PASS="soja"          # troque antes de ir para produção
APP_PORT=3000
NETWORK="soja_net"
VOLUME="soja_postgres_data"

echo "==> Verificando Docker..."
docker --version

echo "==> Criando rede e volume (idempotente)..."
docker network create "$NETWORK" 2>/dev/null || true
docker volume  create "$VOLUME"  2>/dev/null || true

echo "==> Subindo banco de dados..."
docker run -d \
  --name custo_soja_db \
  --network "$NETWORK" \
  --restart unless-stopped \
  -e POSTGRES_DB="$DB_NAME" \
  -e POSTGRES_USER="$DB_USER" \
  -e POSTGRES_PASSWORD="$DB_PASS" \
  -v "$VOLUME":/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:16-alpine 2>/dev/null || docker start custo_soja_db

echo "==> Aguardando Postgres ficar saudável..."
until docker exec custo_soja_db pg_isready -U "$DB_USER" -d "$DB_NAME" -q; do
  echo "   ...aguardando"
  sleep 3
done
echo "   Postgres pronto."

echo "==> Puxando imagem da aplicação..."
docker pull "$IMAGE"

echo "==> Removendo container antigo (se existir)..."
docker rm -f custo_soja_app 2>/dev/null || true

echo "==> Subindo aplicação (migrate + seed + start automáticos)..."
docker run -d \
  --name custo_soja_app \
  --network "$NETWORK" \
  --restart unless-stopped \
  -e DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@custo_soja_db:5432/${DB_NAME}" \
  -e PORT=3000 \
  -p "${APP_PORT}":3000 \
  "$IMAGE"

echo ""
echo "==> Aguardando inicialização..."
sleep 8
docker logs custo_soja_app --tail 20

echo ""
echo "============================================"
echo "  Aplicação disponível em:"
echo "  http://$(hostname -I | awk '{print $1}'):${APP_PORT}"
echo "============================================"

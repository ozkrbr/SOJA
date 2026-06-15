#!/bin/bash
# ============================================================
# deploy/deploy.sh
# Instala ou atualiza o Custo de Produção Soja num servidor
# Linux com Docker. O banco de dados é preservado entre
# atualizações; apenas o container da aplicação é recriado.
#
# Uso:
#   chmod +x deploy.sh
#   ./deploy.sh               # instala/atualiza para :latest
#   ./deploy.sh 1.1.0         # versão específica
# ============================================================
set -e

# ── Configuração ──────────────────────────────────────────
IMAGE="ozkr/custo-soja"
TAG="${1:-latest}"
FULL_IMAGE="${IMAGE}:${TAG}"

DB_NAME="${SOJA_DB_NAME:-custo_soja}"
DB_USER="${SOJA_DB_USER:-soja}"
# Senha do banco — NUNCA hardcoded. Defina via variável de ambiente:
#   export SOJA_DB_PASS='suaSenhaForte'
#   ./deploy.sh
DB_PASS="${SOJA_DB_PASS:?Defina a variavel de ambiente SOJA_DB_PASS antes de rodar (ex.: export SOJA_DB_PASS=...)}"

APP_PORT=10101
NETWORK="soja_net"
VOLUME="soja_postgres_data"
# ─────────────────────────────────────────────────────────

echo ""
echo "======================================================"
echo "  Custo de Produção Soja — Deploy"
echo "  Imagem : ${FULL_IMAGE}"
echo "  Porta  : ${APP_PORT}"
echo "======================================================"
echo ""

echo "==> Verificando Docker..."
docker --version

echo ""
echo "==> Criando rede e volume (idempotente)..."
docker network create "$NETWORK" 2>/dev/null && echo "   Rede criada." || echo "   Rede já existe."
docker volume  create "$VOLUME"  2>/dev/null && echo "   Volume criado." || echo "   Volume já existe."

# ── Banco de dados: só cria se ainda não existir ─────────
echo ""
if docker ps -a --format "{{.Names}}" | grep -q "^custo_soja_db$"; then
  echo "==> Banco de dados já existe — mantendo."
  docker start custo_soja_db 2>/dev/null || true
else
  echo "==> Criando container do banco de dados..."
  docker run -d \
    --name custo_soja_db \
    --network "$NETWORK" \
    --restart unless-stopped \
    -e POSTGRES_DB="$DB_NAME" \
    -e POSTGRES_USER="$DB_USER" \
    -e POSTGRES_PASSWORD="$DB_PASS" \
    -v "$VOLUME":/var/lib/postgresql/data \
    -p 5432:5432 \
    postgres:16-alpine
fi

echo ""
echo "==> Aguardando Postgres ficar saudável..."
until docker exec custo_soja_db pg_isready -U "$DB_USER" -d "$DB_NAME" -q 2>/dev/null; do
  echo "   ...aguardando"
  sleep 3
done
echo "   Postgres pronto."

# ── Aplicação: sempre recriada ────────────────────────────
echo ""
echo "==> Puxando imagem ${FULL_IMAGE} ..."
docker pull "$FULL_IMAGE"

echo ""
echo "==> Parando e removendo container anterior da aplicação..."
docker stop custo_soja_app 2>/dev/null && echo "   Container parado." || echo "   Nenhum container anterior."
docker rm   custo_soja_app 2>/dev/null || true

echo ""
echo "==> Subindo nova versão (migrate + seed automáticos)..."
docker run -d \
  --name custo_soja_app \
  --network "$NETWORK" \
  --restart unless-stopped \
  -e DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@custo_soja_db:5432/${DB_NAME}" \
  -e AZURE_TENANT_ID="${AZURE_TENANT_ID:?Defina AZURE_TENANT_ID no ambiente}" \
  -e AZURE_CLIENT_ID="${AZURE_CLIENT_ID:?Defina AZURE_CLIENT_ID no ambiente}" \
  -e PORT=3000 \
  -p "${APP_PORT}":3000 \
  "$FULL_IMAGE"

echo ""
echo "==> Aguardando inicialização (migrate + seed + next start)..."
sleep 10
docker logs custo_soja_app --tail 25

echo ""
echo "======================================================"
echo "  Versão  : ${TAG}"
echo "  App     : http://$(hostname -I | awk '{print $1}'):${APP_PORT}"
echo "======================================================"

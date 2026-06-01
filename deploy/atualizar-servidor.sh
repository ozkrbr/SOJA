#!/bin/bash
# ============================================================
# deploy/atualizar-servidor.sh
# Atualiza o app para a versão mais recente do Docker Hub.
# Executa migrações pendentes automaticamente via entrypoint.
#
# Uso:
#   chmod +x atualizar-servidor.sh
#   ./atualizar-servidor.sh               # puxa :latest
#   ./atualizar-servidor.sh 1.1.0         # puxa versão específica
# ============================================================
set -e

IMAGE="ozkr/custo-soja"
TAG="${1:-latest}"
FULL_IMAGE="${IMAGE}:${TAG}"
DB_USER="soja"
DB_PASS="soja"
DB_NAME="custo_soja"
APP_PORT=10101
NETWORK="soja_net"

echo "==> Verificando containers em execução..."
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "custo_soja|NAMES"

echo ""
echo "==> Puxando nova imagem: ${FULL_IMAGE} ..."
docker pull "${FULL_IMAGE}"

echo ""
echo "==> Parando container antigo..."
docker stop custo_soja_app 2>/dev/null || true
docker rm   custo_soja_app 2>/dev/null || true

echo ""
echo "==> Subindo novo container (migrate automático no entrypoint)..."
docker run -d \
  --name custo_soja_app \
  --network "${NETWORK}" \
  --restart unless-stopped \
  -e DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@custo_soja_db:5432/${DB_NAME}" \
  -e PORT="${APP_PORT}" \
  -p "${APP_PORT}":3000 \
  "${FULL_IMAGE}"

echo ""
echo "==> Aguardando inicialização..."
sleep 8

echo ""
echo "==> Logs do novo container:"
docker logs custo_soja_app --tail 20

echo ""
echo "============================================"
echo "  Versão: ${TAG}"
echo "  App:    http://$(hostname -I | awk '{print $1}'):${APP_PORT}"
echo "============================================"

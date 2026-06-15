#!/bin/bash
# ============================================================
# atualizar.sh  —  rodar diretamente no servidor
# Puxa a imagem mais recente do Docker Hub e reinicia o app.
# O banco de dados é preservado.
#
# Uso:
#   chmod +x atualizar.sh && ./atualizar.sh
#   ./atualizar.sh 1.2.0    # versão específica
# ============================================================
set -e

IMAGE="ozkr/custo-soja"
TAG="${1:-latest}"
APP_PORT=10101
DB_USER="${SOJA_DB_USER:-soja}"
DB_PASS="${SOJA_DB_PASS:?Defina a variavel de ambiente SOJA_DB_PASS antes de rodar}"
DB_NAME="${SOJA_DB_NAME:-custo_soja}"
NETWORK="soja_net"

FULL_IMAGE="${IMAGE}:${TAG}"

echo ""
echo "======================================================"
echo "  Custo de Produção Soja — Atualização"
echo "  Imagem : ${FULL_IMAGE}"
echo "======================================================"
echo ""

echo "==> Puxando imagem do Docker Hub..."
docker pull "$FULL_IMAGE"

echo ""
echo "==> Parando container anterior..."
docker stop custo_soja_app 2>/dev/null && echo "   Parado." || echo "   Nenhum container rodando."
docker rm   custo_soja_app 2>/dev/null || true

echo ""
echo "==> Subindo nova versão..."
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
echo "==> Aguardando inicialização (migrate + seed + start)..."
sleep 8
docker logs custo_soja_app --tail 25

echo ""
echo "======================================================"
echo "  Atualização concluída!"
echo "  URL: http://$(hostname -I | awk '{print $1}'):${APP_PORT}"
echo "======================================================"

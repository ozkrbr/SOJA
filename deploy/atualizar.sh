#!/bin/bash
# ============================================================
# deploy/atualizar.sh
# Builda, envia ao Docker Hub e reinicia o app no servidor.
# Pré-requisito: Docker rodando localmente +
#                SSH configurado para o servidor.
#
# Uso:
#   chmod +x deploy/atualizar.sh
#   ./deploy/atualizar.sh               # tag :latest
#   ./deploy/atualizar.sh 1.2.0         # tag específica
#   SOJA_DB_PASS=senha ./deploy/atualizar.sh
# ============================================================
set -e

# ── Configuração ──────────────────────────────────────────
IMAGE="ozkr/custo-soja"
TAG="${1:-latest}"
SERVER="10.1.3.70"
SSH_USER="root"
APP_PORT=10101
DB_USER="soja"
DB_NAME="custo_soja"
NETWORK="soja_net"

# Senha: variável de ambiente ou prompt interativo
if [ -z "$SOJA_DB_PASS" ]; then
  read -rsp "Senha do banco de dados: " SOJA_DB_PASS
  echo ""
fi
# ─────────────────────────────────────────────────────────

FULL_IMAGE="${IMAGE}:${TAG}"

echo ""
echo "======================================================"
echo "  Custo de Produção Soja — Atualização"
echo "  Imagem  : ${FULL_IMAGE}"
echo "  Servidor: ${SSH_USER}@${SERVER}:${APP_PORT}"
echo "======================================================"
echo ""

# 1. Build local
echo "==> Buildando imagem..."
docker build -t "$FULL_IMAGE" .

# 2. Push para o Docker Hub
echo ""
echo "==> Enviando para o Docker Hub..."
docker push "$FULL_IMAGE"

# 3. Atualiza o container no servidor via SSH
echo ""
echo "==> Conectando ao servidor e atualizando o container..."

ssh "${SSH_USER}@${SERVER}" bash -s <<REMOTE
set -e
echo '--- Puxando imagem ${FULL_IMAGE} ---'
docker pull ${FULL_IMAGE}

echo '--- Parando container anterior ---'
docker stop custo_soja_app 2>/dev/null || true
docker rm   custo_soja_app 2>/dev/null || true

echo '--- Subindo nova versão ---'
docker run -d \
  --name custo_soja_app \
  --network ${NETWORK} \
  --restart unless-stopped \
  -e DATABASE_URL="postgresql://${DB_USER}:${SOJA_DB_PASS}@custo_soja_db:5432/${DB_NAME}" \
  -e PORT=3000 \
  -p ${APP_PORT}:3000 \
  ${FULL_IMAGE}

echo '--- Aguardando inicialização ---'
sleep 8
docker logs custo_soja_app --tail 20
echo ''
echo "App disponível em http://\$(hostname -I | awk '{print \$1}'):${APP_PORT}"
REMOTE

echo ""
echo "======================================================"
echo "  Atualização concluída!"
echo "  Versão : ${TAG}"
echo "  URL    : http://${SERVER}:${APP_PORT}"
echo "======================================================"

#!/bin/bash
# ==============================================================
# deploy/deploy-ec2.sh
# Rodar diretamente no servidor EC2 (Ubuntu, linux/amd64).
#
# Uso:
#   chmod +x deploy-ec2.sh
#   ./deploy-ec2.sh               # instala/atualiza para :latest
#   ./deploy-ec2.sh 1.2.0         # versão específica
#
# Variável de ambiente opcional:
#   SOJA_DB_PASS  — evita o prompt de senha
# ==============================================================
set -euo pipefail

# ── Configuração ───────────────────────────────────────────────
IMAGE="ozkr/custo-soja"
TAG="${1:-latest}"
FULL_IMAGE="${IMAGE}:${TAG}"

APP_PORT=3000   # acesso externo via Nginx (porta 443) → localhost:3000
DB_NAME="custo_soja"
DB_USER="soja"
NETWORK="soja_net"
VOLUME="soja_postgres_data"
# ──────────────────────────────────────────────────────────────

# Senha do banco
DB_PASS="${SOJA_DB_PASS:-}"
if [[ -z "$DB_PASS" ]]; then
  read -rsp "Senha do banco de dados: " DB_PASS
  echo
fi

echo ""
echo "======================================================"
echo "  Custo de Produção Soja — Deploy EC2"
echo "  Imagem : ${FULL_IMAGE}"
echo "  Porta  : 443 (HTTPS via Nginx → localhost:${APP_PORT})"
echo "======================================================"

# ── 1. Instalar Docker ─────────────────────────────────────────
echo ""
echo "==> Verificando Docker..."
if ! command -v docker &>/dev/null; then
  echo "   Docker não encontrado — instalando..."
  sudo apt-get update -qq
  sudo apt-get install -y -qq ca-certificates curl gnupg
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu \
$(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update -qq
  sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io
  sudo systemctl enable --now docker
  sudo usermod -aG docker "$USER"
  echo "   Docker instalado com sucesso."
else
  echo "   Docker já instalado: $(docker --version)"
fi

# Garantir que o usuário atual pode usar Docker sem sudo
if ! docker info &>/dev/null 2>&1; then
  DOCKER_CMD="sudo docker"
else
  DOCKER_CMD="docker"
fi

# ── 2. Rede e volume (idempotente) ────────────────────────────
echo ""
echo "==> Criando rede e volume (se necessário)..."
$DOCKER_CMD network create "$NETWORK" 2>/dev/null && echo "   Rede criada." || echo "   Rede já existe."
$DOCKER_CMD volume  create "$VOLUME"  2>/dev/null && echo "   Volume criado." || echo "   Volume já existe."

# ── 3. Postgres: preserva dados entre deploys ─────────────────
echo ""
if $DOCKER_CMD ps -a --format "{{.Names}}" | grep -q "^custo_soja_db$"; then
  echo "==> Banco de dados já existe — mantendo dados."
  $DOCKER_CMD start custo_soja_db 2>/dev/null || true
else
  echo "==> Criando container Postgres..."
  $DOCKER_CMD run -d \
    --name custo_soja_db \
    --network "$NETWORK" \
    --restart unless-stopped \
    --platform linux/amd64 \
    -e POSTGRES_DB="$DB_NAME" \
    -e POSTGRES_USER="$DB_USER" \
    -e POSTGRES_PASSWORD="$DB_PASS" \
    -v "${VOLUME}":/var/lib/postgresql/data \
    postgres:16-alpine
fi

# ── 4. Aguardar Postgres ───────────────────────────────────────
echo ""
echo "==> Aguardando Postgres ficar pronto..."
for i in $(seq 1 20); do
  if $DOCKER_CMD exec custo_soja_db pg_isready -U "$DB_USER" -d "$DB_NAME" -q 2>/dev/null; then
    echo "   Postgres pronto."
    break
  fi
  echo "   ...aguardando ($i/20)"
  sleep 3
done

# ── 5. Puxar imagem ────────────────────────────────────────────
echo ""
echo "==> Puxando ${FULL_IMAGE} (linux/amd64)..."
$DOCKER_CMD pull --platform linux/amd64 "$FULL_IMAGE"

# ── 6. Parar app anterior ──────────────────────────────────────
echo ""
echo "==> Parando container anterior (se existir)..."
$DOCKER_CMD stop custo_soja_app 2>/dev/null && echo "   Parado." || echo "   Nenhum container anterior."
$DOCKER_CMD rm   custo_soja_app 2>/dev/null || true

# ── 7. Subir nova versão ───────────────────────────────────────
echo ""
echo "==> Subindo ${FULL_IMAGE}..."
$DOCKER_CMD run -d \
  --name custo_soja_app \
  --network "$NETWORK" \
  --restart unless-stopped \
  --platform linux/amd64 \
  -e DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@custo_soja_db:5432/${DB_NAME}" \
  -e AZURE_TENANT_ID="${AZURE_TENANT_ID:?Defina AZURE_TENANT_ID no ambiente}" \
  -e AZURE_CLIENT_ID="${AZURE_CLIENT_ID:?Defina AZURE_CLIENT_ID no ambiente}" \
  -e PORT=3000 \
  -p 127.0.0.1:"${APP_PORT}":3000 \
  "$FULL_IMAGE"

# ── 8. Logs de inicialização ───────────────────────────────────
echo ""
echo "==> Aguardando inicialização (migrate + seed + next start)..."
sleep 12
$DOCKER_CMD logs custo_soja_app --tail 30

echo ""
echo "======================================================"
echo "  Deploy concluído!"
echo "  Versão : ${TAG}"
echo "  URL    : https://custosoja.terrenaagro.com.br"
echo "======================================================"

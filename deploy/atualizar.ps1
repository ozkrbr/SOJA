# ============================================================
# deploy/atualizar.ps1
# Envia a imagem mais recente ao servidor e reinicia o app.
# Pré-requisito: Docker Desktop rodando localmente +
#                SSH configurado para o servidor.
#
# Uso:
#   .\deploy\atualizar.ps1
#   .\deploy\atualizar.ps1 -Tag 1.2.0
# ============================================================
param(
    [string]$Tag = "latest"
)

# ── Configuração ──────────────────────────────────────────
$IMAGE   = "ozkr/custo-soja"
$SERVER  = "COLOQUE_O_IP_DO_SERVIDOR_AQUI"   # ex.: "192.168.1.100"
$SSH_USER = "root"                            # usuário SSH do servidor
$APP_PORT = 10101
$DB_USER  = "soja"
$DB_PASS  = if ($env:SOJA_DB_PASS) { $env:SOJA_DB_PASS } else { Read-Host "Senha do banco de dados" }
$DB_NAME  = "custo_soja"
$NETWORK  = "soja_net"
# ─────────────────────────────────────────────────────────

$FULL_IMAGE = "${IMAGE}:${Tag}"

Write-Host ""
Write-Host "======================================================"
Write-Host "  Custo de Produção Soja — Atualização"
Write-Host "  Imagem  : $FULL_IMAGE"
Write-Host "  Servidor: ${SSH_USER}@${SERVER}:${APP_PORT}"
Write-Host "======================================================"
Write-Host ""

# 1. Build local
Write-Host "==> Buildando imagem..."
docker build -t $FULL_IMAGE .
if ($LASTEXITCODE -ne 0) { Write-Error "Build falhou."; exit 1 }

# 2. Push para o Docker Hub
Write-Host ""
Write-Host "==> Enviando para o Docker Hub..."
docker push $FULL_IMAGE
if ($LASTEXITCODE -ne 0) { Write-Error "Push falhou."; exit 1 }

# 3. Atualiza o container no servidor via SSH
Write-Host ""
Write-Host "==> Conectando ao servidor e atualizando o container..."

$remoteCmd = @"
set -e
echo '--- Puxando imagem $FULL_IMAGE ---'
docker pull $FULL_IMAGE

echo '--- Parando container anterior ---'
docker stop custo_soja_app 2>/dev/null || true
docker rm   custo_soja_app 2>/dev/null || true

echo '--- Subindo nova versão ---'
docker run -d \
  --name custo_soja_app \
  --network $NETWORK \
  --restart unless-stopped \
  -e DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@custo_soja_db:5432/${DB_NAME}" \
  -e PORT=3000 \
  -p ${APP_PORT}:3000 \
  $FULL_IMAGE

echo '--- Aguardando inicialização ---'
sleep 8
docker logs custo_soja_app --tail 20
echo ''
echo 'App disponível em http://'$(hostname -I | awk '{print $1}'):${APP_PORT}
"@

ssh "${SSH_USER}@${SERVER}" $remoteCmd
if ($LASTEXITCODE -ne 0) { Write-Error "Deploy remoto falhou."; exit 1 }

Write-Host ""
Write-Host "======================================================"
Write-Host "  Atualização concluída!"
Write-Host "  Versão : $Tag"
Write-Host "  URL    : http://${SERVER}:${APP_PORT}"
Write-Host "======================================================"

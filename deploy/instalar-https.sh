#!/bin/bash
# ==============================================================
# deploy/instalar-https.sh
# Configura Nginx + Let's Encrypt (Certbot) no servidor EC2.
#
# Pré-requisitos:
#   - Ubuntu 20.04+
#   - Domínio custosoja.terrenaagro.com.br apontando para este IP
#   - Portas 80 e 443 abertas no Security Group da AWS
#
# Uso (rodar uma única vez no servidor):
#   chmod +x instalar-https.sh
#   sudo ./instalar-https.sh
# ==============================================================
set -euo pipefail

DOMAIN="custosoja.terrenaagro.com.br"
EMAIL="oscar.santana@terrenaagro.com.br"
APP_PORT=3000
NGINX_CONF="/etc/nginx/sites-available/${DOMAIN}"

# ── Verificar root ─────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  echo "ERRO: Execute com sudo: sudo ./instalar-https.sh"
  exit 1
fi

echo ""
echo "======================================================"
echo "  HTTPS — Nginx + Certbot"
echo "  Domínio : ${DOMAIN}"
echo "  Proxy   : localhost:${APP_PORT}"
echo "======================================================"

# ── 1. Nginx ───────────────────────────────────────────────────
echo ""
echo "==> [1/5] Instalando Nginx..."
apt-get update -qq
apt-get install -y -qq nginx
systemctl enable --now nginx
echo "   Nginx instalado: $(nginx -v 2>&1)"

# ── 2. Certbot via snap ────────────────────────────────────────
echo ""
echo "==> [2/5] Instalando Certbot..."
apt-get install -y -qq snapd
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/bin/certbot
echo "   Certbot instalado: $(certbot --version)"

# ── 3. Configurar Nginx como reverse proxy ─────────────────────
echo ""
echo "==> [3/5] Configurando Nginx para ${DOMAIN}..."

cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass         http://localhost:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Ativar site e desativar o default (evita conflito)
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx
echo "   Nginx configurado e recarregado."

# ── 4. Emitir certificado ──────────────────────────────────────
echo ""
echo "==> [4/5] Emitindo certificado Let's Encrypt para ${DOMAIN}..."
certbot --nginx \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  --redirect \
  -d "$DOMAIN"
echo "   Certificado emitido com sucesso."

# ── 5. Testar renovação automática ─────────────────────────────
echo ""
echo "==> [5/5] Testando renovação automática..."
certbot renew --dry-run
echo "   Renovação automática OK."

echo ""
echo "======================================================"
echo "  Configuração concluída!"
echo "  Acesse: https://${DOMAIN}"
echo "======================================================"

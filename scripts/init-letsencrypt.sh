#!/usr/bin/env bash
#
# Issues the first Let's Encrypt certificate for $DOMAIN.
#
# Solves a chicken-and-egg problem: the https nginx config won't start without a
# certificate, but certbot needs nginx running to answer the ACME challenge. So
# we stage a throwaway self-signed cert, start nginx, let certbot replace it with
# the real one, then reload.
#
# Run once, from the repo root, on the server that owns the domain:
#   ./scripts/init-letsencrypt.sh
#
# Prerequisites:
#   - .env exists with DOMAIN, CERTBOT_EMAIL, CERTBOT_STAGING
#   - the domain's A/AAAA record already points at this server
#   - ports 80 and 443 are open
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "error: .env not found. Copy .env.docker.example to .env and fill it in." >&2
  exit 1
fi

set -a; . ./.env; set +a

: "${DOMAIN:?DOMAIN must be set in .env}"
: "${CERTBOT_EMAIL:?CERTBOT_EMAIL must be set in .env}"
STAGING="${CERTBOT_STAGING:-1}"

if [ "$DOMAIN" = "localhost" ]; then
  echo "error: DOMAIN is still 'localhost'. Let's Encrypt cannot issue for it." >&2
  echo "       Set a real domain in .env, or just run the stack over HTTP." >&2
  exit 1
fi

# The certbot service sits behind the "tls" profile so small hosts do not pull it
# until HTTPS is actually being set up — which is exactly now.
compose() { docker compose --profile tls "$@"; }

echo "==> Domain: $DOMAIN"
if [ "$STAGING" != "0" ]; then
  echo "==> Using Let's Encrypt STAGING (certs will not be trusted by browsers)."
  echo "    Set CERTBOT_STAGING=0 in .env and re-run to get a real certificate."
fi

CERT_PATH="/etc/letsencrypt/live/$DOMAIN"

echo "==> Downloading recommended TLS parameters..."
compose run --rm --entrypoint "sh -c '\
  mkdir -p /etc/letsencrypt && \
  [ -f /etc/letsencrypt/options-ssl-nginx.conf ] || \
    wget -qO /etc/letsencrypt/options-ssl-nginx.conf https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf; \
  [ -f /etc/letsencrypt/ssl-dhparams.pem ] || \
    wget -qO /etc/letsencrypt/ssl-dhparams.pem https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem'" certbot

echo "==> Staging a temporary self-signed certificate so nginx can start..."
compose run --rm --entrypoint "sh -c '\
  mkdir -p $CERT_PATH && \
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout $CERT_PATH/privkey.pem \
    -out $CERT_PATH/fullchain.pem \
    -subj \"/CN=localhost\"'" certbot

echo "==> Starting nginx with the temporary certificate..."
NGINX_TEMPLATE=https compose up -d --force-recreate nginx api web

# Give nginx a moment to bind before the ACME server probes it.
sleep 5

echo "==> Deleting the temporary certificate..."
compose run --rm --entrypoint "rm -rf /etc/letsencrypt/live/$DOMAIN /etc/letsencrypt/archive/$DOMAIN /etc/letsencrypt/renewal/$DOMAIN.conf" certbot

echo "==> Requesting the real certificate..."
STAGING_FLAG=""
[ "$STAGING" != "0" ] && STAGING_FLAG="--staging"

compose run --rm --entrypoint "certbot certonly --webroot -w /var/www/certbot \
  $STAGING_FLAG \
  --email $CERTBOT_EMAIL \
  -d $DOMAIN \
  --rsa-key-size 4096 \
  --agree-tos \
  --no-eff-email \
  --force-renewal" certbot

echo "==> Reloading nginx..."
compose exec nginx nginx -s reload

echo
echo "Done. Certificate issued for $DOMAIN."
echo
echo "Next:"
echo "  1. Set NGINX_TEMPLATE=https in .env so the whole stack uses TLS."
if [ "$STAGING" != "0" ]; then
  echo "  2. Set CERTBOT_STAGING=0 in .env and re-run this script for a trusted cert."
fi
echo "  3. docker compose up -d"

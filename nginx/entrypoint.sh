#!/bin/sh
# Custom nginx entrypoint.
#
# The stock image only runs its /docker-entrypoint.d/ scripts — including the
# envsubst templating that renders our conf — when the container command starts
# with "nginx". We need a periodic `nginx -s reload` so renewed certificates are
# picked up without a restart, and that means the command is a shell loop, so the
# templating has to be invoked explicitly here.
set -e

# Drop the stock welcome-page config; otherwise it competes with ours for
# requests on port 80 and silently wins for some server_name values.
rm -f /etc/nginx/conf.d/default.conf

# Renders /etc/nginx/templates/*.template -> /etc/nginx/conf.d/*
/docker-entrypoint.d/20-envsubst-on-templates.sh

nginx -t

# Reload every 6h so a certificate renewed by the certbot container takes effect.
(while :; do sleep 6h; nginx -s reload 2>/dev/null || true; done) &

exec nginx -g 'daemon off;'

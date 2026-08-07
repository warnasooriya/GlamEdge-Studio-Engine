# syntax=docker/dockerfile:1
#
# WhatsApp Web bridge — a separate service (not bundled into apps/api) so
# Chromium's memory footprint and crash risk can't take down bookings,
# payments, or anything else the core API does. See README.md for why this
# exists alongside the Cloud API and the memory budget it assumes.
#
# Debian rather than Alpine on purpose: puppeteer's own Chromium download is a
# glibc binary and does not run on Alpine's musl libc at all. We skip that
# download anyway and use Debian's own `chromium` package instead, which is
# lighter to keep patched and matches how apps/api already avoids musl.

FROM node:20-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
# Chromium plus the shared libraries it needs to actually render — a bare
# slim image has none of these, and whatsapp-web.js needs a real (headless)
# browser, not just the puppeteer JS bindings.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       chromium ca-certificates fonts-liberation \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

# Skip puppeteer's own Chromium download at install time — the apt package
# above is what actually runs, so downloading a second copy would just waste
# build time and image size.
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# --- dependencies ------------------------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/whatsapp-web/package.json apps/whatsapp-web/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter whatsapp-web...

# --- build -------------------------------------------------------------------
FROM deps AS build
COPY apps/whatsapp-web apps/whatsapp-web
RUN pnpm --filter whatsapp-web build

# --- production dependencies --------------------------------------------------
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/whatsapp-web/package.json apps/whatsapp-web/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter whatsapp-web... --prod

# --- runtime -----------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/whatsapp-web/node_modules ./apps/whatsapp-web/node_modules
COPY --from=build /app/apps/whatsapp-web/dist ./apps/whatsapp-web/dist
COPY --from=build /app/apps/whatsapp-web/package.json ./apps/whatsapp-web/package.json
COPY package.json pnpm-workspace.yaml ./

WORKDIR /app/apps/whatsapp-web

# LocalAuth's session data — docker-compose mounts a named volume over this so
# a redeploy doesn't force the salon owner to rescan the QR code.
RUN mkdir -p .wwebjs_auth && chown -R node:node .wwebjs_auth /app
USER node

EXPOSE 5000
CMD ["node", "dist/index.js"]

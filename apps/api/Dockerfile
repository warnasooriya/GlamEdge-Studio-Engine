# syntax=docker/dockerfile:1
#
# API image. Built from the repo root so the pnpm workspace (lockfile + both
# package manifests) is available — see the `context: .` in docker-compose.yml.
#
# Debian rather than Alpine on purpose: both sharp and Prisma's query engine ship
# prebuilt glibc binaries, so this avoids musl-specific build steps.

FROM node:20-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
# openssl is required by Prisma's query engine at runtime. fontconfig +
# fonts-liberation/fonts-dejavu-core are required by sharp's SVG rasterization
# (librsvg/pango) — receiptGenerator.ts renders <text> elements, and a bare
# slim image ships zero fonts, so every glyph came out as an empty box on the
# server while working fine on any dev machine with system fonts already
# installed. fonts-liberation carries Arial/Helvetica-compatible aliases,
# matching the "Helvetica, Arial, sans-serif" font-family the SVG requests.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       openssl ca-certificates fontconfig fonts-liberation fonts-dejavu-core \
    && fc-cache -f \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

# --- dependencies ------------------------------------------------------------
# Only the manifests are copied first so this layer caches until a dependency
# actually changes.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter api...

# --- build -------------------------------------------------------------------
FROM deps AS build
COPY apps/api apps/api
# Generate the Prisma client for this platform, then compile TS -> dist.
# The build script also runs tsc-alias, which rewrites the "@/*" path aliases
# into relative requires so plain `node dist/index.js` can resolve them.
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build

# --- production dependencies -------------------------------------------------
# A second, --prod install — starting from `base`, NOT `deps`. Branching off
# `deps` would inherit its already-populated node_modules (installed WITHOUT
# --prod for the build stage's sake), and `pnpm install --prod` only skips
# adding devDependencies, it does not prune ones already on disk. Starting clean
# is what actually keeps typescript/tsx/tsc-alias/@types out of the image.
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/api/prisma apps/api/prisma
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter api... --prod \
    && pnpm --filter api exec prisma generate

# --- runtime -----------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production

# Runtime dependencies only. Includes the generated Prisma client and the Prisma
# CLI, which the entrypoint needs for `migrate deploy`.
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

WORKDIR /app/apps/api

# Uploads live here when no S3 bucket is configured; docker-compose mounts a
# named volume over it so media survives container replacement.
RUN mkdir -p uploads && chown -R node:node uploads
USER node

EXPOSE 4000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]

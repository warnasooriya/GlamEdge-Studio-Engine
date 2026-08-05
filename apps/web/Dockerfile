# syntax=docker/dockerfile:1
#
# Web image: builds the Vite bundle, then serves it as static files from nginx.
# Built from the repo root (see `context: .` in docker-compose.yml).

FROM node:20-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter web...

FROM deps AS build
COPY apps/web apps/web

# Vite inlines VITE_* values at build time, so they are build args rather than
# runtime env. The defaults are same-origin relative paths: the edge nginx serves
# the app and proxies /api and /socket.io to the API, so one image works on any
# domain without a rebuild. Override only when the API lives elsewhere.
ARG VITE_API_URL=/
ARG VITE_SOCKET_URL=/
ARG VITE_GOOGLE_MAPS_API_KEY=
ENV VITE_API_URL=$VITE_API_URL \
    VITE_SOCKET_URL=$VITE_SOCKET_URL \
    VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY

RUN pnpm --filter web build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

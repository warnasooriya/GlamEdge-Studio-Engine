# whatsapp-web

Sends bills and booking updates from the salon's own WhatsApp number via
[whatsapp-web.js](https://wwebjs.dev/), which drives a real WhatsApp Web
session through a headless Chromium browser. This is the primary send path;
`apps/api`'s Cloud API integration (`WHATSAPP_CLOUD_API_TOKEN`) is kept as a
fallback for when this service is unreachable, crash-looping, or not yet
logged in — see `sendWhatsAppText`/`sendWhatsAppImage` in
`apps/api/src/services/whatsapp/whatsappService.ts`.

## Why a separate service

Chromium is heavy (~280–450MB observed) and this is an unofficial automation
library — not something Meta supports, and it can crash or get the account
banned in ways a real API integration wouldn't. Both risks are isolated here,
in their own container with their own memory limit, specifically so neither
can take down bookings, payments, or anything else `apps/api` does.

## Memory budget

This needs roughly **450MB** of its own (see `WHATSAPP_WEB_MEM_LIMIT` in
`docker-compose.yml`), on top of whatever the rest of the stack already uses.
**Do not enable this on the 1GB instance the stack was originally tuned
for** — check free memory first (`free -h` on the server) and size the
instance accordingly (a 2GB+ instance, e.g. t3.small, is the realistic
floor). Leaving `WHATSAPP_WEB_INTERNAL_SECRET` unset keeps this service
disabled (it crash-loops harmlessly, and the API falls straight through to
the Cloud API) if you're not ready to size up yet.

## First-time login (QR scan)

1. Generate a secret and set it in the server's `.env`:
   ```bash
   openssl rand -hex 32   # → WHATSAPP_WEB_INTERNAL_SECRET
   ```
2. Deploy. The container starts logged out and generates a QR code.
3. Open the admin portal → **WhatsApp** tab. It polls the service and shows
   the QR code once one is pending.
4. On the salon's phone: WhatsApp → Settings → Linked Devices → Link a
   Device → scan the code shown in the admin portal.
5. Once scanned, status flips to `authenticated` then `ready`. The session
   persists in the `whatsapp_web_session` Docker volume — a redeploy does
   **not** require rescanning, but deleting that volume does.

If the salon's phone is later unlinked (from the phone itself, or after ~14
days without the phone connecting to the internet, per WhatsApp's own
session rules), the service reports `disconnected` and needs a fresh scan.

## Endpoints

Internal-only — reachable from `api` over the Docker network, never exposed
publicly. Every route but `/health` requires an `x-internal-secret` header
matching `WHATSAPP_WEB_INTERNAL_SECRET`.

| Route | Purpose |
|---|---|
| `GET /health` | `{ state, hasQr }` — no secret required, used for the compose healthcheck |
| `GET /qr` | Current QR code as a data URL, or 404 if none is pending |
| `POST /send/text` | `{ phone, message }` |
| `POST /send/image` | `{ phone, imageUrl, caption }` |

`apps/api`'s admin routes (`/api/admin/whatsapp/status`, `/api/admin/whatsapp/qr`)
proxy the first two so the browser never talks to this service — or its
secret — directly.

## Local development

```bash
pnpm --filter whatsapp-web dev
```

Puppeteer downloads its own Chromium on `pnpm install` for local dev (no
`PUPPETEER_EXECUTABLE_PATH` needed). In Docker, the image installs Debian's
`chromium` package instead and points puppeteer at it — puppeteer's own
downloaded Chromium is a glibc binary and works fine on the `node:20-bookworm-slim`
base this image uses, but using the system package keeps the image smaller
and easier to keep patched.

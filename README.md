# GlamEdge Studio Engine

Multi-tenant salon SaaS: booking, POS billing with WhatsApp e-receipts, staff/ledger management, and a
social showcase feed with verified reviews. Built from the spec in
[`Enterprise Implementation Plan Gl.md`](Enterprise%20Implementation%20Plan%20Gl.md) and
[`GlamEdge_Salon_SaaS_Business_Proposal.pdf`](GlamEdge_Salon_SaaS_Business_Proposal.pdf).

## Stack

- **Frontend** (`apps/web`): React 18 + TypeScript + Vite, Tailwind CSS with the brand design tokens,
  hand-rolled shadcn-style UI primitives, Redux Toolkit (auth/tenant context), TanStack Query, Socket.io
  client, PWA (offline POS ledger cache).
- **Backend** (`apps/api`): Node 20 + Express + TypeScript, Prisma ORM on MySQL 8 (tenants, services,
  staff, appointments, ledger, reviews), Mongoose on MongoDB (social feed posts/likes/comments), Socket.io
  (live booking grid), Redis (OTP codes + rate limiting).
- **Pluggable integrations**, each behind an interface so the app runs fully offline in dev and swaps to
  real providers via env vars only:
  - OTP SMS: console dev-stub (default) or Notify.lk (Sri Lanka)
  - Media storage: local disk (default) or AWS S3
  - E-billing: WhatsApp Cloud API, degrades to console logging without credentials

## Prerequisites

- Node.js 20+
- pnpm (`corepack enable && corepack prepare pnpm@9 --activate`)
- Docker Desktop (for local MySQL/MongoDB/Redis)

## First-time setup

```bash
pnpm install
docker compose up -d          # MySQL (host port 3307), MongoDB, Redis
cp apps/api/.env apps/api/.env.local   # optional: keep the docker defaults, or edit apps/api/.env directly
pnpm db:migrate                # prisma migrate dev
pnpm db:seed                   # creates a demo tenant with services & staff
pnpm dev                       # runs api (:4000) and web (:5173) together
```

Open http://localhost:5173. The seed script creates a demo tenant (phone `0771234567`). Request an OTP
from the login screen — in dev mode (`OTP_PROVIDER=console`) the 6-digit code is printed to the **API
server's terminal**, not sent by SMS.

The public client-facing salon page is at `http://localhost:5173/salon/demo-salon` — no login required
(booking, portfolio feed, reviews).

## Environment variables

`.env.example` (repo root) documents every variable for both apps. `apps/api/.env` and `apps/web/.env`
are already populated with working **local dev defaults** (the docker-compose services, console OTP,
local disk storage, WhatsApp logging stub) so the app runs immediately after `pnpm install`.

To go to production / use your real infrastructure, edit `apps/api/.env`:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Your managed MySQL 8 instance (e.g. AWS RDS) |
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `REDIS_URL` | A managed Redis instance (or leave as the local container) |
| `OTP_PROVIDER=notifylk` + `NOTIFYLK_*` | Sends real SMS OTPs via Notify.lk |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` / `AWS_S3_BUCKET` | Switches media/invoice storage to S3 |
| `WHATSAPP_CLOUD_API_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` | Sends real WhatsApp invoice messages |

No code changes are needed — each integration checks for its env vars at startup and picks the real
provider automatically when they're present (see `apps/api/src/config/env.ts` and the `services/*`
folders).

## Project structure

```
apps/
  api/
    prisma/schema.prisma        # MySQL schema: Tenant, Service, Staff, Appointment, Ledger, Review
    src/
      config/                   # env, prisma, mongo, redis clients
      middlewares/               # tenantResolver (multi-tenant isolation), requireAuth, errorHandler
      modules/                   # auth, tenant, services, staff, appointments, ledger, billing, feed, reviews
      models/                    # Mongoose models for the social feed (Post, Comment, Like)
      services/                  # otp/, storage/, whatsapp/, pdf/ — swappable provider interfaces
      realtime/socket.ts         # Socket.io gateway, per-tenant rooms
  web/
    src/
      pages/                    # auth, dashboard (owner), pos, public (client-facing)
      components/               # ui/ (shadcn-style primitives), booking/, feed/, shared/
      store/                    # Redux Toolkit auth/tenant slice
      lib/                      # api client, socket client, utils
```

## What's verified working end-to-end

Register/login via OTP → studio setup (services/staff) → public client booking → live update on the
owner's booking grid (Socket.io) → mark confirmed → one-tap POS billing (generates a PDF invoice, creates
a ledger entry, logs/sends the WhatsApp receipt) → EOD reconciliation totals update → verified review
(rejected until the appointment is completed & billed, accepted after) → showcase feed upload/like/comment
→ multi-tenant isolation (a second tenant cannot see or modify the first tenant's data).

## What's intentionally not done

Per the plan, actual cloud provisioning was left out of this build since it requires real infrastructure
credentials and has real-world side effects I don't take without explicit direction:

- AWS EC2/ECS + RDS MySQL provisioning, S3 bucket creation and bucket policy setup
- Domain routing, subdomain wildcard DNS, and SSL certificate issuance
- WhatsApp Business template message approval (the `salon_invoice_receipt` template must be
  created/approved in Meta Business Manager before real sends will succeed)
- Notify.lk account setup (the integration code is ready — just needs `NOTIFYLK_USER_ID`/`NOTIFYLK_API_KEY`)

## Known simplifications vs. the original spec

- UI primitives (button, input, card, dialog, toast, badge) are hand-written Tailwind/Radix components in
  the shadcn style, rather than generated via the `shadcn` CLI (same approach, no CLI network dependency).
- The booking calendar is a lightweight custom list/grid rather than pulling in the full FullCalendar
  library, to keep the bundle small — it still gets live Socket.io updates.
- Toasts use a small custom context instead of Radix Toast, for simplicity.

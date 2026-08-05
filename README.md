# GlamEdge Studio Engine

Multi-tenant salon SaaS: booking, POS billing with WhatsApp e-receipts, staff/ledger management, a social
showcase feed with verified reviews, and an administrator portal for salon approval and subscription
billing. Built from the spec in
[`Enterprise Implementation Plan Gl.md`](Enterprise%20Implementation%20Plan%20Gl.md) and
[`GlamEdge_Salon_SaaS_Business_Proposal.pdf`](GlamEdge_Salon_SaaS_Business_Proposal.pdf).

## Stack

- **Frontend** (`apps/web`): React 18 + TypeScript + Vite, Tailwind CSS with the brand design tokens,
  hand-rolled shadcn-style UI primitives, Redux Toolkit (three auth slices: owner, client, admin),
  TanStack Query, Recharts, Socket.io client, PWA (offline POS ledger cache).
- **Backend** (`apps/api`): Node 20 + Express + TypeScript, Prisma ORM on MySQL 8 (tenants, services,
  staff, appointments, ledger, reviews, subscriptions, payments), Mongoose on MongoDB (social feed
  posts/likes/comments, booking chat), Socket.io (live booking grid), Redis (OTP codes + rate limiting).
- **Infrastructure**: the whole stack runs under Docker Compose behind an nginx reverse proxy with
  Let's Encrypt TLS — see [Running the whole stack in Docker](#running-the-whole-stack-in-docker).
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

This runs the app on your host with only the datastores in Docker. To run
*everything* in containers instead, skip to
[Running the whole stack in Docker](#running-the-whole-stack-in-docker).

```bash
pnpm install
cp .env.docker.example .env                 # compose reads this; set JWT_SECRET
docker compose up -d mysql mongo redis      # just the datastores for host dev
pnpm db:migrate                # prisma migrate dev
pnpm db:seed                   # creates a demo tenant with services & staff
pnpm dev                       # runs api (:4000) and web (:5173) together
```

Open http://localhost:5173. The seed script creates a demo tenant (phone `0771234567`). Request an OTP
from the login screen — in dev mode (`OTP_PROVIDER=console`) the 6-digit code is printed to the **API
server's terminal**, not sent by SMS.

The public client-facing salon page is at `http://localhost:5173/salon/demo-salon` — no login required
(booking, portfolio feed, reviews).

### Development commands

```bash
pnpm dev                       # api (:4000) + web (:5173)
pnpm build                     # build both apps
pnpm lint                      # typecheck both apps
pnpm db:migrate                # prisma migrate dev
pnpm db:seed                   # reseed demo data
```

> **Typecheck the web app with `pnpm lint` (`tsc -b`), not `tsc --noEmit`.**
> `apps/web/tsconfig.json` is a solution-style config (`"files": []` plus project references), so a bare
> `tsc --noEmit` checks **zero files** and exits 0 no matter what is broken. Only `tsc -b` walks the
> referenced projects. The API is unaffected.

## Components

### Application surfaces

The frontend is one SPA serving four distinct audiences, each with its own layout, routes, and auth.

| Surface | Routes | Who | Auth |
|---|---|---|---|
| **Public marketplace** | `/`, `/salon/:slug` | Anyone | None |
| **Client account** | `/account`, `/account/history`, `/account/notifications`, `/account/profile` | Customers | Client OTP |
| **Owner dashboard** | `/dashboard/*`, `/pos` | Salon owners | Owner OTP |
| **Administrator portal** | `/admin/login`, `/admin`, `/admin/tenants`, `/admin/payments` | Platform staff | Admin email + password |

**Public marketplace** — salon directory with search, location and distance filters; per-salon page with
portfolio feed, services, reviews, and booking. Only salons that are `APPROVED` with a live subscription
appear here (enforced centrally in `utils/publicTenant.ts`).

**Client account** — booking history, appointment chat, reschedule accept/decline, notifications, profile.

**Owner dashboard** — Overview (daily ledger), Analytics (revenue, peak booking times), Reports (revenue,
cancellations, missed appointments, staff commission), Bookings, Customers, Reviews, Services, Staff,
Showcase Feed, Profile, plus the POS billing screen.

**Administrator portal** — platform stats, salon grid with approve / reject / suspend / reactivate,
subscription plan and fee editing, and payment recording with per-salon and platform-wide history.

### Three auth realms

Owners, clients, and admins are separate identities with **separate JWT secrets**, so a token from one
realm is worthless in another.

| Realm | Login | Token secret | Middleware |
|---|---|---|---|
| Owner | Phone OTP | `JWT_SECRET` | `requireAuth` |
| Client | Phone OTP | `JWT_SECRET:client` | `requireClientAuth` |
| Admin | Email + bcrypt password | `JWT_SECRET:admin` | `requireAdminAuth` |

`requireAuth` re-checks the tenant's status in the database on every request, so suspending a salon
revokes access immediately rather than waiting for its JWT to expire. `requireAppointmentParty` accepts
either an owner or a client token, for the endpoints both sides of a booking share (chat, messages).

### Backend modules

Each module under `apps/api/src/modules/` owns a route file, a controller, and a Zod schema.

| Module | Mounted at | Responsibility |
|---|---|---|
| `auth` | `/api/auth` | Owner OTP request/verify, approval gate on login |
| `clientAuth` | `/api/client-auth` | Customer OTP request/verify, profile |
| `admin` | `/api/admin` | Admin login, tenant approval lifecycle, subscriptions, payments, stats |
| `tenant` | `/api/tenants` | Salon profile, logo upload, public directory and salon page |
| `services` / `staff` | `/api/services`, `/api/staff` | Service catalogue and stylists |
| `appointments` | `/api/appointments` | Booking CRUD, availability, walk-ins, reschedule negotiation, chat |
| `billing` | `/api/billing` | POS checkout, PDF invoice, PNG receipt, WhatsApp send |
| `ledger` | `/api/ledger` | Income/expense entries, EOD reconciliation |
| `reviews` | `/api/reviews` | Verified reviews (only after a completed, billed appointment) |
| `feed` | `/api/feed` | Portfolio posts, likes, comments (MongoDB) |
| `clients` | `/api/clients` | Owner's customer list and history |
| `notifications` | `/api/notifications` | Client-facing notification inbox |
| `notifications` (owner) | `/api/owner-notifications` | Owner notification bell |
| `analytics` | `/api/analytics` | Dashboard aggregates, peak booking heatmap |
| `reports` | `/api/reports` | Date-ranged revenue, cancellation, no-show, commission reports |

### Pluggable services

Everything under `apps/api/src/services/` sits behind an interface and picks its implementation from env
vars at startup — no code change to switch, and every one has a working offline default.

| Service | Default | Production |
|---|---|---|
| `otp/` | Console (code printed to API logs) | Notify.lk SMS |
| `storage/` | Local disk → `/uploads` | AWS S3 (+ optional CloudFront) |
| `whatsapp/` | Logs to console | WhatsApp Cloud API |
| `pdf/` | PDFKit invoices — always on | — |
| `image/` | sharp receipt rendering — always on | — |
| `notifications/` | In-app rows + Socket.IO emit — always on | — |

### Background work

- **Subscription expiry checker** (`services/subscriptionExpiryChecker.ts`) — runs on boot then hourly.
  Notifies salons whose subscription lapses within 7 days, in-app and over WhatsApp, deduplicated by
  `expiryNotifiedAt` so exactly one reminder goes out per cycle.
- **Admin bootstrap** (`services/adminBootstrap.ts`) — creates the first admin on first boot if none
  exists, generating and logging a password when `ADMIN_PASSWORD` is unset.
- **Socket.IO gateway** (`realtime/socket.ts`) — per-tenant and per-client rooms for live booking,
  message, review, and notification events.

### Data stores

| Store | Holds |
|---|---|
| **MySQL** (Prisma) | `Tenant`, `Admin`, `Client`, `Service`, `Staff`, `Appointment`, `AppointmentService`, `Ledger`, `Review`, `Notification`, `OwnerNotification`, `SubscriptionPayment` |
| **MongoDB** (Mongoose) | `Post`, `Comment`, `Like`, `AppointmentMessage` — high-volume, schema-flexible social and chat data |
| **Redis** | OTP codes with TTL, rate limiting |

### Directory layout

```
apps/
  api/
    prisma/schema.prisma        # MySQL schema + migrations
    src/
      config/                   # env, prisma, mongo, redis clients
      middlewares/              # requireAuth, requireClientAuth, requireAdminAuth,
                                #   requireAppointmentParty, tenantResolver, errorHandler
      modules/                  # one folder per domain (routes + controller + schema)
      models/                   # Mongoose models (Post, Comment, Like, AppointmentMessage)
      services/                 # otp/, storage/, whatsapp/, pdf/, image/, notifications/
      realtime/socket.ts        # Socket.IO gateway, per-tenant/client rooms
      utils/                    # jwt (x3 realms), pagination, publicTenant, slug
    Dockerfile, docker-entrypoint.sh
  web/
    src/
      pages/                    # public/, auth/, client/, dashboard/, pos/, admin/
      components/               # ui/ primitives + analytics/, appointments/, booking/,
                                #   dashboard/, feed/, pos/, reports/, shared/
      store/                    # authSlice, clientAuthSlice, adminAuthSlice
      lib/                      # api / clientApi / adminApi clients, socket, chart colors
    Dockerfile, nginx.conf
nginx/                          # edge proxy: templates/http, templates/https, includes/
scripts/init-letsencrypt.sh     # first-time certificate issuance
docker-compose.yml
```

## Environment configuration

### Which file is read when

There are **two separate configurations**, and mixing them up is the most common setup mistake:

| Running | File | Template |
|---|---|---|
| On your host (`pnpm dev`) | `apps/api/.env` and `apps/web/.env` | `.env.example` |
| In Docker (`docker compose`) | `.env` at the repo root | `.env.docker.example` |

Docker Compose does **not** read `apps/api/.env` — the container environment is built entirely from the
root `.env` plus the defaults baked into `docker-compose.yml`. All files are gitignored.

### Required

| Variable | Notes |
|---|---|
| `JWT_SECRET` | Signs all three token realms. Compose refuses to start without it. Generate with `openssl rand -base64 48`. Changing it invalidates every existing session. |
| `DATABASE_URL` | MySQL 8 connection string. Under Docker it is assembled from the `MYSQL_*` values. |

### Deployment identity

| Variable | Default | Purpose |
|---|---|---|
| `DOMAIN` | `localhost` | Hostname nginx serves; also the certificate's subject |
| `PUBLIC_URL` | `http://localhost` | Origin users actually visit. Sets CORS **and** the base URL baked into stored upload paths — a mismatch here is what breaks images behind a proxy |
| `NGINX_TEMPLATE` | `http` | `http` (no TLS) or `https` (TLS + redirect). Selects which config set nginx mounts |
| `PORT` | `4000` | API listen port |
| `CORS_ORIGIN` | `PUBLIC_URL` | Browser origin allowed to call the API |

### Datastores

| Variable | Default |
|---|---|
| `MYSQL_ROOT_PASSWORD` / `MYSQL_DATABASE` / `MYSQL_USER` / `MYSQL_PASSWORD` | `glamedge_root` / `glamedge` / `glamedge` / `glamedge_pw` — **change before any real deployment** |
| `MONGODB_URI` | `mongodb://mongo:27017/glamedge_feed` |
| `REDIS_URL` | `redis://redis:6379` |
| `MYSQL_HOST_PORT` / `MONGO_HOST_PORT` / `REDIS_HOST_PORT` | `3307` / `27017` / `6379`, bound to `127.0.0.1` for local admin tools only |

### Integrations

Each is inert until its variables are present, so the app runs fully offline by default.

| Variable(s) | Effect when set |
|---|---|
| `OTP_PROVIDER=notifylk` + `NOTIFYLK_USER_ID` / `NOTIFYLK_API_KEY` / `NOTIFYLK_SENDER_ID` | Real SMS OTPs. Default `console` prints codes to the API logs |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` / `AWS_S3_BUCKET` | Switches media storage from the local volume to S3. All four required; `AWS_CLOUDFRONT_URL` optional |
| `WHATSAPP_CLOUD_API_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` | Sends real WhatsApp receipts and notifications instead of logging them |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | First admin account, created only if no admin exists. Leave the password blank and one is generated and printed to the API logs |
| `CERTBOT_EMAIL` / `CERTBOT_STAGING` | Used by `scripts/init-letsencrypt.sh`. Keep staging at `1` until the flow works, then `0` for a trusted certificate |

### Frontend variables are build-time, not runtime

Vite inlines `VITE_*` values into the bundle when it builds. Setting them in the container environment
does nothing — they must be passed as **build args**, and changing one requires
`docker compose build web`, not a restart.

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `/` | API base. `/` keeps the bundle same-origin, so one image works on any domain |
| `VITE_SOCKET_URL` | `/` | Socket.IO endpoint, same reasoning |
| `VITE_GOOGLE_MAPS_API_KEY` | *(blank)* | Enables the salon location picker. Blank shows a "not configured" message instead |

### Switching to managed infrastructure

Point `DATABASE_URL`, `MONGODB_URI`, and `REDIS_URL` at your managed instances (RDS, Atlas, ElastiCache)
and drop the `mysql`, `mongo`, and `redis` services from `docker-compose.yml`. No code changes — every
integration resolves its provider from env at startup (see `apps/api/src/config/env.ts`).

## Running the whole stack in Docker

Everything — MySQL, MongoDB, Redis, the API, the built frontend, and an nginx reverse proxy — runs from
one `docker-compose.yml`. Config comes from a `.env` file next to it (`.env.docker.example` documents
every value). This is separate from `apps/api/.env`, which is only used when running on the host.

### Local

```bash
cp .env.docker.example .env     # then set JWT_SECRET (openssl rand -base64 48)
docker compose up -d --build
```

The app is on **http://localhost**. The first boot applies all Prisma migrations and creates an admin
account, printing the generated password:

```bash
docker compose logs api | grep -A3 "First admin"
```

The datastore ports (3307 / 27017 / 6379) are published on `127.0.0.1` only, for local admin tools. If
you already run the datastores for host development, stop those first or change the `*_HOST_PORT` values
in `.env` — otherwise the ports collide.

### Production with HTTPS

On a server whose DNS already points at it, with ports 80 and 443 open:

```bash
# 1. Configure
cp .env.docker.example .env
#    DOMAIN=app.example.com
#    PUBLIC_URL=https://app.example.com
#    CERTBOT_EMAIL=you@example.com
#    JWT_SECRET=<a long random string>

# 2. Build and start over HTTP so the ACME challenge can be answered
docker compose up -d --build

# 3. Issue the certificate (staging first — CERTBOT_STAGING=1)
./scripts/init-letsencrypt.sh

# 4. Set CERTBOT_STAGING=0 in .env, re-run the script for a trusted certificate,
#    then set NGINX_TEMPLATE=https in .env and bring the stack up on TLS
docker compose up -d
```

The `certbot` service then renews automatically (checks twice daily), and nginx reloads every 6 hours to
pick up a renewed certificate.

### How it fits together

| Service | Role |
|---|---|
| `nginx` | Public entrypoint. TLS termination, routes `/` → web, `/api` `/uploads` `/socket.io` `/health` → api |
| `web` | nginx serving the built Vite bundle, with SPA history fallback |
| `api` | Express. Applies migrations on start, then serves the API and Socket.IO |
| `mysql` / `mongo` / `redis` | Datastores, on named volumes, not exposed publicly |
| `certbot` | Issues and renews Let's Encrypt certificates over the webroot challenge |

Two things worth knowing:

- **Frontend env vars are baked in at build time.** `VITE_API_URL` and `VITE_SOCKET_URL` default to `/`,
  so the bundle is same-origin and the *same image works on any domain*. Changing them needs
  `docker compose build web`, not just a restart.
- **Uploads.** With no S3 credentials, media is written to the `api_uploads` volume and served through
  nginx at `/uploads`. `PUBLIC_URL` sets the origin baked into stored URLs, so it must match the domain
  users actually visit. Setting the four `AWS_*` vars switches to S3 with no code change.

Useful commands:

```bash
docker compose logs -f api          # follow API logs (OTP codes land here in console mode)
docker compose ps                   # health of every service
docker compose exec api sh          # shell in the API container
docker compose down                 # stop (volumes and data survive)
docker compose down -v              # stop and DELETE all data
```

## What's verified working end-to-end

**Core flow.** Register/login via OTP → studio setup (services/staff) → public client booking → live update
on the owner's booking grid (Socket.io) → mark confirmed → one-tap POS billing (generates a PDF invoice,
creates a ledger entry, logs/sends the WhatsApp receipt) → EOD reconciliation totals update → verified
review (rejected until the appointment is completed & billed, accepted after) → showcase feed
upload/like/comment → multi-tenant isolation (a second tenant cannot see or modify the first tenant's data).

**Booking negotiation.** Owner proposes a new time/staff → customer sees an accept/decline banner →
accepting rewrites the appointment and notifies the owner. Both sides share a per-booking chat thread with
3 MB attachments.

**Approval lifecycle.** A new salon registers → sees a "pending approval" screen and gets no token →
appears in the admin's Pending tab → admin approves → the salon can now log in. Suspending revokes access
on the *next request*, not at token expiry, and rejected/suspended/expired salons are hidden from the public
directory, 404 on their public page, and cannot take new bookings.

**Subscription billing.** Admin edits plan/cycle/fee → records a payment → the subscription window advances
by exactly one cycle and the expiry reminder flag resets. Payments aggregate correctly per salon and
platform-wide.

**Containerised stack.** `docker compose up -d --build` from a clean volume: all migrations apply, the admin
bootstraps, and the app serves through nginx with the Socket.IO WebSocket upgrade returning `101 Switching
Protocols`.

## What's intentionally not done

Per the plan, actual cloud provisioning was left out of this build since it requires real infrastructure
credentials and has real-world side effects I don't take without explicit direction:

- AWS EC2/ECS + RDS MySQL provisioning, S3 bucket creation and bucket policy setup
- Registering a domain and pointing its DNS at a server. The SSL side *is* wired up — see
  [Running the whole stack in Docker](#running-the-whole-stack-in-docker) — but issuing a real
  certificate needs a domain that already resolves to the host.
- WhatsApp Business template message approval (the `salon_invoice_receipt` template must be
  created/approved in Meta Business Manager before real sends will succeed)
- Notify.lk account setup (the integration code is ready — just needs `NOTIFYLK_USER_ID`/`NOTIFYLK_API_KEY`)

## Known simplifications vs. the original spec

- UI primitives (button, input, card, dialog, toast, badge) are hand-written Tailwind/Radix components in
  the shadcn style, rather than generated via the `shadcn` CLI (same approach, no CLI network dependency).
- The booking calendar is a lightweight custom list/grid rather than pulling in the full FullCalendar
  library, to keep the bundle small — it still gets live Socket.io updates.
- Toasts use a small custom context instead of Radix Toast, for simplicity.

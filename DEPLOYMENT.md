# Deployment

Production runs at **https://glamedge.beauty** (`52.220.21.151`, ap-southeast-1, EC2). Every push to
`main` builds images in GitHub Actions, publishes them to GitHub Container Registry, and restarts the
stack on the box.

> ## ⚠️ The instance is undersized
>
> `t3.micro`: **1 GB RAM**. The EBS volume was resized once already (8 GB → 20 GB) and the swapfile
> enlarged (1 GB → 2 GB) to get through this — current headroom, measured on the box:
>
> | Resource | Reality |
> |---|---|
> | Disk | 20 GB volume, ~9 GB free. Comfortable for now; a deploy briefly needs both the old and new image on disk, and database growth eats into this over time. |
> | RAM | 908 MB physical + a 2 GB swapfile (`vm.swappiness=10`). All 7 services (MySQL, MongoDB, Redis, API, web, nginx, certbot) fit, but lean on swap under load — expect it to show non-trivial `Swap: used` in `free -h` at rest, not just under spikes. |
>
> Mitigations already applied: per-container memory limits summing to 896 MB, `innodb-buffer-pool-size=64M`,
> `wiredTigerCacheSizeGB=0.25`, Redis on alpine, certbot behind the `tls` profile, and a prod-only-dependency
> API image (was 647MB with a broken prune, is 141MB now).
>
> **These buy headroom, they do not fix it.** Before real customer traffic, move to `t3.small` (2 GB RAM) —
> stop the instance, change the type, start it. The Elastic IP stays; a plain public IP does not, so attach
> one first if this instance doesn't have one. If disk fills again:
>
> ```bash
> # AWS Console -> EC2 -> Volumes -> Modify -> new size, then on the box:
> sudo growpart /dev/nvme0n1 1 && sudo resize2fs /dev/nvme0n1p1 && df -h /
> ```
>
> With more RAM, raise the limits in `.env`: `MYSQL_MEM_LIMIT=768M`, `MONGO_MEM_LIMIT=512M`,
> `API_MEM_LIMIT=512M`.

```
push to main
  → GH Actions builds api + web images
  → pushes to ghcr.io/warnasooriya/glamedge-studio-engine/{api,web}
  → rsyncs docker-compose.yml + nginx/ to /opt/glamedge
  → ssh: docker compose pull && up -d
  → polls /health until it answers, or fails the run with the API logs
```

Images are built on the runner, not the server. `pnpm install` plus the Vite build needs more memory than
a small instance has, and building there would take the site down during every deploy.

---

## One-time setup

### 1. On the server

SSH in and run:

```bash
curl -fsSL https://raw.githubusercontent.com/warnasooriya/GlamEdge-Studio-Engine/main/scripts/server-bootstrap.sh | bash
```

This creates `/opt/glamedge`, generates `.env` with a strong `JWT_SECRET` and random database passwords,
and points `PUBLIC_URL` at the instance's public IP. It is safe to re-run — **an existing `.env` is never
overwritten**, so secrets and credentials survive.

### 2. Security group

Allow inbound **80** (and **443** once you have a domain) from `0.0.0.0/0`, and **22** from your own IP.
Nothing else needs to be open — MySQL, MongoDB and Redis bind to `127.0.0.1` inside the box.

### 3. GitHub repository secrets

*Settings → Secrets and variables → Actions → New repository secret*

| Secret | Value |
|---|---|
| `EC2_HOST` | `52.220.21.151` |
| `EC2_USER` | `ubuntu` (Ubuntu AMI) or `ec2-user` (Amazon Linux) |
| `EC2_SSH_KEY` | The **entire** private key you SSH with, including the `-----BEGIN…` and `-----END…` lines |
| `VITE_GOOGLE_MAPS_API_KEY` | *Optional.* Enables the salon location picker |

`GITHUB_TOKEN` is injected automatically — it authenticates the image push, and is piped to the server
for the pull. It expires when the run ends, so no long-lived registry credential is stored on the box.

> The key in `EC2_SSH_KEY` grants shell access to production. Use a dedicated deploy key rather than your
> personal one, so it can be revoked without disrupting your own access.

### 4. Deploy

Push to `main`, or trigger **Actions → Deploy to EC2 → Run workflow** to redeploy the current `main`
without a new commit.

---

## Everyday operations

All commands run from `/opt/glamedge` on the server.

```bash
docker compose ps                    # health of every service
docker compose logs -f api           # follow API logs (login OTP codes appear here)
docker compose logs api | grep -A3 "First admin"   # the generated admin password
docker compose restart api           # restart one service
docker compose down                  # stop everything (data volumes survive)
```

### Retrieving the admin password

On first boot the API creates one admin account and prints the generated password. To set a known one
instead, put `ADMIN_PASSWORD` in `.env` **before** the first deploy. Afterwards, change it in the app —
the bootstrap only runs while no admin exists.

### Database access

Nothing is exposed publicly. Tunnel over SSH:

```bash
ssh -L 3307:127.0.0.1:3307 ubuntu@52.220.21.151
mysql -h 127.0.0.1 -P 3307 -u glamedge -p glamedge   # password is in /opt/glamedge/.env
```

### Backups

The compose volumes (`glamedge_mysql_data`, `glamedge_mongo_data`, `glamedge_api_uploads`) hold everything
that matters. A minimal MySQL dump:

```bash
docker compose exec -T mysql mysqldump -u root -p"$(grep '^MYSQL_ROOT_PASSWORD=' .env | cut -d= -f2)" \
  glamedge | gzip > "backup-$(date +%F).sql.gz"
```

There is **no automated backup yet** — worth adding before real customer data lands.

---

## HTTPS

**Done.** `glamedge.beauty` has a Let's Encrypt certificate (expires 2026-11-04, auto-renews). This is the
sequence that got there, kept here for the next domain or a rebuild from scratch:

```bash
cd /opt/glamedge

# 1. Point the config at the domain
sed -i 's|^DOMAIN=.*|DOMAIN=app.example.com|'            .env
sed -i 's|^PUBLIC_URL=.*|PUBLIC_URL=https://app.example.com|' .env
sed -i 's|^CERTBOT_EMAIL=.*|CERTBOT_EMAIL=you@example.com|'   .env

# 2. Issue a staging certificate first (CERTBOT_STAGING=1, the .env default) to
#    prove the flow without touching Let's Encrypt's real rate limits
./init-letsencrypt.sh

# 3. Switch to a real certificate
sed -i 's|^CERTBOT_STAGING=.*|CERTBOT_STAGING=0|' .env
./init-letsencrypt.sh

# 4. Turn on the TLS config for good, and make it survive future deploys
sed -i 's|^NGINX_TEMPLATE=.*|NGINX_TEMPLATE=https|' .env
grep -q '^COMPOSE_PROFILES=' .env && sed -i 's|^COMPOSE_PROFILES=.*|COMPOSE_PROFILES=tls|' .env \
  || echo 'COMPOSE_PROFILES=tls' >> .env
docker compose up -d
```

Two things worth knowing about that last step:

- **`COMPOSE_PROFILES=tls` is not optional.** The `certbot` renewal container sits behind the `tls`
  profile (so small instances don't pull a 288MB image before there's a domain to certify). Without this
  var in `.env`, the very next deploy's `docker compose up -d --remove-orphans` in
  `.github/workflows/deploy.yml` treats `certbot` as an orphan and removes it — silently killing renewal
  until someone notices the cert is about to expire. `COMPOSE_PROFILES` in `.env` is read by every plain
  `docker compose` invocation automatically, so this one line is what makes the workflow safe without
  editing it.
- Renewal itself needs nothing further: the `certbot` container checks twice daily, and nginx reloads
  every six hours to pick up whatever it renewed.

`PUBLIC_URL` matters beyond cosmetics — it is baked into the URLs of uploaded media, so leaving it as
`http://<ip>` after moving to a domain gives you mixed-content warnings and broken images.

If `init-letsencrypt.sh` complains about the recommended TLS parameters, note it copies
`options-ssl-nginx.conf` and `ssl-dhparams.pem` out of the `certbot/certbot` image itself rather than
fetching from GitHub — a previous version of this script used raw GitHub URLs that 404'd once certbot
restructured its repo. If a future certbot image version moves those paths again, `docker run --rm
--entrypoint sh certbot/certbot:latest -c 'find / -xdev -iname "options-ssl-nginx.conf" -o -iname
"ssl-dhparams.pem"'` finds the new location.

---

## Rolling back

Every build is tagged with its commit SHA, so a rollback is a pull of the older tag:

```bash
cd /opt/glamedge
sed -i 's|^IMAGE_TAG=.*|IMAGE_TAG=<known-good-sha>|' .env
docker compose pull api web && docker compose up -d
```

Re-running the workflow on a good commit (**Run workflow** from that commit) achieves the same thing.

Note that **database migrations do not roll back**. If the bad deploy migrated the schema, restore from a
backup rather than only reverting images.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Workflow fails: `.env is missing` | `server-bootstrap.sh` hasn't been run on the server yet |
| Workflow fails at the SSH step | `EC2_SSH_KEY` truncated (needs the BEGIN/END lines), wrong `EC2_USER`, or port 22 closed to GitHub's runners |
| Health check times out | `docker compose logs api` — usually a bad `DATABASE_URL` or a migration failing |
| Site loads but API calls 502 | API container is unhealthy or still applying migrations; check `docker compose ps` |
| Images look broken | `PUBLIC_URL` doesn't match the hostname you're browsing |
| `denied` pulling from ghcr.io | The package is private and the token lacked `read:packages`. The workflow logs in for you; a manual pull needs `docker login ghcr.io` with a PAT |
| Out of disk | `docker system prune -af --volumes` — **check what it will remove first**, it deletes unused volumes |

---

## Known gaps

Worth closing before this carries real customer data:

- **No automated backups.** Volumes are the only copy of the data.
- **No staging environment.** `main` goes straight to production.
- **Single instance, no redundancy.** Losing the box loses the service until it is rebuilt.
- **Datastores share the instance.** Fine at low volume; move to RDS/Atlas as usage grows — see the
  README's "Switching to managed infrastructure".

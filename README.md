# SmoothStream Event System

A production-style MVP web application for managing virtual and hybrid event operations. Built for event production teams who run high-stakes live streams.

## Features

- **Public Event Intake Form** — No login required. Collects all event details from external organizers and automatically creates a production checklist.
- **Internal Operations Dashboard** — Summary metrics, filterable event table, search, status/priority badges.
- **Event Detail Page** — Full event management with checklist, notes, assets, activity log, and AI drafting tools.
- **Checklist System** — 14 default production tasks automatically generated for every event.
- **AI Helper Drafts** — Generate Run of Show and Client Reminder Email drafts from event data.
- **Admin Settings** — Configure event types, platforms, default checklist template, and team members.

## Tech Stack

- **Frontend:** React + Vite, Tailwind CSS, Radix UI, TanStack React Query, Wouter
- **Backend:** Express 5, Drizzle ORM, PostgreSQL
- **API:** OpenAPI 3.1 spec with generated TypeScript client + Zod schemas

## Database Schema

| Table | Description |
|-------|-------------|
| `organizations` | Client companies/organizations |
| `profiles` | Internal team members |
| `events` | Event records with all intake data |
| `event_tasks` | Production checklist tasks per event |
| `event_notes` | Internal team notes per event |
| `event_assets` | Asset tracking per event |
| `activity_log` | Audit trail of all changes |
| `settings` | Admin-configurable options |

## Self-Hosting

SmoothStream runs as a single Node.js process that serves both the API (`/api`) and the built React frontend, backed by PostgreSQL. No platform-specific services are required.

### Option A — Docker Compose (recommended)

Requires Docker with the Compose plugin.

```bash
cp .env.example .env        # set POSTGRES_PASSWORD at minimum
docker compose up -d --build
```

This starts Postgres 16, applies the database schema, then starts the app on `http://127.0.0.1:8080`. Data persists in the `pgdata` volume. Re-running `docker compose up -d --build` after pulling changes rebuilds the app and applies any schema changes.

By default the app port is bound to `127.0.0.1` so it can sit behind a reverse proxy on the same host. Set `APP_BIND=0.0.0.0` in `.env` to expose it directly on your network.

### Option B — Bare metal / VM

Prerequisites: Node.js 22.9+, pnpm 10 (`corepack enable`), PostgreSQL 14+.

```bash
pnpm install
cp .env.example .env        # set DATABASE_URL
pnpm db:push                # create/update tables
pnpm build:app              # build frontend + API bundle
pnpm start                  # serves everything on :8080
```

Run `pnpm start` under systemd, pm2, or similar to keep it up. The server shuts down gracefully on `SIGTERM`.

### Reverse proxy and HTTPS

Put any reverse proxy in front of port 8080 and terminate TLS there. Example Caddyfile:

```
smoothstream.example.com {
    reverse_proxy 127.0.0.1:8080
}
```

The same works with nginx, Traefik, or a Cloudflare Tunnel pointed at `http://localhost:8080`.

### Configuration

All settings are environment variables; see `.env.example` for the full list.

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | — (required) | PostgreSQL connection string |
| `PORT` / `HOST` | `8080` / `0.0.0.0` | API server listen address |
| `STATIC_DIR` | `artifacts/smoothstream/dist/public` | Built frontend to serve |
| `CORS_ORIGIN` | unset (same-origin only) | Allowlist if the UI is hosted on another origin |
| `TRUST_PROXY` | private/loopback ranges | Proxies trusted for `X-Forwarded-*` |
| `LOG_LEVEL` | `info` | Pino log level |

### Development

```bash
pnpm install
cp .env.example .env        # point DATABASE_URL at a dev database
pnpm db:push
pnpm dev                    # API on :8080, Vite on :5173 (proxies /api to the API)
```

Open `http://localhost:5173`. To reach the dev server from another device, add its hostname to `ALLOWED_HOSTS`.

After changing `lib/api-spec/openapi.yaml`, regenerate the client and schemas:

```bash
pnpm run --filter @workspace/api-spec codegen
```

### Health check

`GET /api/healthz` returns `{"status":"ok"}`; the Docker image uses it for its built-in `HEALTHCHECK`.

### Security note

Authentication is currently demo-only: the login page navigates to the dashboard without verifying anyone, and the internal API routes are unauthenticated. Until real auth is added, do not expose a self-hosted instance to the public internet. Keep it on a private network or VPN, or put it behind an authenticating proxy (e.g. Cloudflare Access, Authelia, oauth2-proxy).

## User Roles

| Role | Access |
|------|--------|
| Public | Event intake form only (no login required) |
| Team Member | Dashboard, event detail, notes, tasks |
| Admin | All above + settings, team management |

## Event Statuses

- `new` — Just submitted via intake form
- `in_progress` — Team is actively working on it
- `awaiting_assets` — Waiting for client to deliver assets
- `ready_for_tech_check` — Ready for speaker tech rehearsal
- `ready_for_live` — All systems go
- `completed` — Event finished
- `cancelled` — Event cancelled

## Default Checklist Tasks

Every new event automatically gets these 14 tasks:

1. Intake received
2. Owner assigned
3. Client confirmation sent
4. Assets requested
5. Assets received
6. Platform configured
7. Speaker tech check scheduled
8. Speaker tech check completed
9. Captions configured
10. Translations configured
11. Dry run completed
12. Go-live ready
13. Recording delivered
14. Post-event review completed

## API Endpoints

The API runs at `/api` and follows the OpenAPI spec at `lib/api-spec/openapi.yaml`.

Key endpoints:
- `GET /api/dashboard/summary` — Dashboard metrics
- `GET/POST /api/events` — List/create events
- `GET/PATCH /api/events/:id` — Get/update event
- `GET/PATCH /api/events/:id/tasks/:taskId` — Task management
- `GET/POST /api/events/:id/notes` — Notes
- `GET/POST/PATCH /api/events/:id/assets` — Asset management
- `GET /api/events/:id/activity` — Activity log
- `POST /api/events/:id/ai/run-of-show` — Generate Run of Show draft
- `POST /api/events/:id/ai/client-reminder` — Generate client reminder email
- `GET/PATCH /api/settings` — Admin settings
- `GET/POST/PATCH/DELETE /api/profiles` — Team member management

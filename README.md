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

## Local Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment variables

Create a `.env` file or set these environment variables:

```
DATABASE_URL=postgresql://user:password@localhost:5432/smoothstream
```

### 3. Push database schema

```bash
pnpm --filter @workspace/db run push
```

### 4. Run codegen (generates API client from OpenAPI spec)

```bash
pnpm run --filter @workspace/api-spec codegen
```

### 5. Seed demo data

Run the SQL seed script from `scripts/seed.sql` against your database, or use the API to create sample events via the intake form.

### 6. Start development servers

In separate terminals:

```bash
# API server (Express)
pnpm --filter @workspace/api-server run dev

# Frontend (React + Vite)
pnpm --filter @workspace/smoothstream run dev
```

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

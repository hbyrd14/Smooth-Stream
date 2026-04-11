# SmoothStream Event System

## Project Overview

A production-style MVP web application for managing virtual and hybrid event operations. Built for event production teams who run high-stakes live streams.

## Architecture

This is a pnpm monorepo with:
- **`artifacts/smoothstream`** — React + Vite frontend (served at `/`)
- **`artifacts/api-server`** — Express 5 backend (served at `/api`)
- **`lib/api-spec`** — OpenAPI 3.1 spec (source of truth for all API contracts)
- **`lib/api-client-react`** — Generated TanStack React Query hooks (from codegen)
- **`lib/api-zod`** — Generated Zod validation schemas (from codegen)
- **`lib/db`** — Drizzle ORM schema and PostgreSQL client

## Key Commands

```bash
# Install all dependencies
pnpm install

# Run API server (development)
pnpm --filter @workspace/api-server run dev

# Run frontend (development)
pnpm --filter @workspace/smoothstream run dev

# Push DB schema changes
pnpm --filter @workspace/db run push

# Regenerate API client after OpenAPI spec changes
pnpm run --filter @workspace/api-spec codegen

# Type check everything
pnpm run typecheck
```

## Database Schema

Tables: `organizations`, `profiles`, `events`, `event_tasks`, `event_notes`, `event_assets`, `activity_log`, `settings`

## Pages

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Home/marketing page | No |
| `/intake` | Public event intake form | No |
| `/intake/confirmation` | Submission confirmation | No |
| `/login` | Internal team login | No |
| `/dashboard` | Operations dashboard | Yes (demo) |
| `/events/:id` | Event detail page | Yes (demo) |
| `/settings` | Admin settings | Yes (demo) |

## API Routes

All routes are in `artifacts/api-server/src/routes/`:
- `health.ts` — Health check
- `dashboard.ts` — Summary metrics
- `organizations.ts` — Organization CRUD
- `events.ts` — Event CRUD with auto checklist generation
- `tasks.ts` — Checklist task management
- `notes.ts` — Event notes
- `assets.ts` — Asset management
- `activity.ts` — Activity log
- `profiles.ts` — Team member management
- `settings.ts` — Admin settings
- `ai.ts` — AI draft generation (Run of Show, Client Reminder)

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (automatically set by Replit DB)
- `PORT` — Server port (automatically set per artifact)
- `BASE_PATH` — Frontend base path (automatically set per artifact)

## Important Notes

- After changing `lib/api-spec/openapi.yaml`, run codegen to update the client
- The checklist system generates 14 default tasks for every new event
- AI draft endpoints are templates using event data (no external AI API needed)
- Authentication is demo-only (login navigates to dashboard without real auth)

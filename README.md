# OpenClaw Mission Control (Foundation)

Local-first control-plane overlay for OpenClaw.

This project is intentionally **not** a replacement for the native OpenClaw dashboard. It is a proactive operations layer for organization, insights, and workflow management.

## Guiding Architecture

- **OpenClaw API** = source of truth for OpenClaw-native entities (sessions, cron jobs, status, routing, etc.)
- **Convex** = source of truth for Mission Control app-domain entities (task items, notes, event annotations, decision logs)
- **Auth model (v1)** = localhost-only access guard

## Stack

- Next.js (App Router, TypeScript, Tailwind)
- Convex (schema + function stubs for app-domain data)
- Local middleware guard for localhost-only access

## Current Foundation

- Delightful shell UI scaffold (sidebar + overview cards)
- OpenClaw typed client + API proxy route (`/api/openclaw/status`)
- Sidebar-routed views: Overview, Timeline, Calendar, Tasks
- Live task board with owner + status workflow (Operator/Agent)
- Calendar module with real calendar views (month/week/day/list via FullCalendar)
- Live OpenClaw cron sync (`openclaw cron list --all --json`) with stale-while-refresh cache invalidation for fast calendar loads
- Parsed cron occurrences rendered across history (from `createdAtMs`) and upcoming horizon
- Calendar item create/edit/delete UI for mission-control scheduled tasks (click-away modals)
- Cron event details modal (timing, schedule, raw job payload)
- Drag-and-drop interactions:
  - move task events in calendar to reschedule
  - drag tasks between board columns to change status
- Local task API endpoints:
  - `GET /api/tasks`
  - `POST /api/tasks`
  - `PATCH /api/tasks/:id`
- Local calendar API endpoint:
  - `GET /api/calendar`
- Convex schema (next-layer app domain):
  - `taskItems`
  - `missionEvents`
- Convex function stubs:
  - `tasks.list`, `tasks.create`
  - `events.recent`, `events.append`
- Docs for system boundaries and extension strategy

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open: http://localhost:3000

## Environment

Create `.env.local`:

```env
NEXT_PUBLIC_APP_NAME=Mission Control
OPENCLAW_BASE_URL=http://127.0.0.1:18789
OPENCLAW_TOKEN=your_gateway_token_here
```

## Convex Setup (when ready)

> Convex auth/deployment is intentionally left explicit for operator control.

```bash
npx convex dev
```

This generates `convex/_generated/*` and starts Convex dev workflow.

## Scripts

- `npm run dev` – start Next.js dev server
- `npm run build` – production build
- `npm run lint` – lint

## Design Intent

Mission Control should feel:
- calm under pressure,
- high-signal,
- operationally trustworthy,
- easy to extend without architecture rewrites.

## Next Feature Prompts

Good first slices (for follow-up prompts):
1. real-time event timeline and alerting semantics
2. cron mission planner with objective metadata
3. task extraction from digest outputs
4. intervention console (pause/retry/reroute) with audit logs

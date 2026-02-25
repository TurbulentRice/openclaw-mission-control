# AGENTS.md — OpenClaw Mission Control Dev Guide

Use this guide when building features or wiring bots/agents to Mission Control.

## 1) What Mission Control is (and is not)

Mission Control is a **local-first operations layer** for OpenClaw.
It is **not** a replacement for the native OpenClaw dashboard.

### Source-of-truth boundaries
- **OpenClaw-owned state:** sessions/subagents, cron jobs/runs, routing, gateway/runtime status
- **Mission Control-owned state:** task workflow metadata, notes, operator context, annotations

Rule: avoid duplicating OpenClaw-owned entities into app-owned persistence unless there is a clear annotation/overlay need.

## 2) Stack + important paths

- Next.js App Router + TypeScript + Tailwind
- Local JSON stores in `data/*.json` for v1 modules
- Convex scaffolding for future app-domain persistence

Key paths:
- `src/app/*` pages + API routes
- `src/components/*` view modules (`task-board`, `timeline-board`, `calendar-board`)
- `src/lib/openclaw/*` OpenClaw integration adapters
- `src/lib/tasks/*`, `src/lib/calendar/*`, `src/lib/timeline/*` domain logic
- `docs/architecture.md` system boundary reference

## 3) Practical coding standards

1. **Type-first changes**
   - Update `src/lib/**/types.ts` before touching handlers/UI.
   - No `any` unless explicitly unavoidable.
2. **Backward-compatible data evolution**
   - Normalize optional fields in store read-paths (e.g. `active`, `comments`, `prUrl`).
   - Old JSON rows must keep working.
3. **Thin routes, logic in lib/**
   - API routes validate and dispatch.
   - Business rules and normalization live in `src/lib/**`.
4. **Operational UX over novelty**
   - Keep UI calm, high-signal, and scannable.
   - Prefer explicit labels over hidden interactions.
5. **No hidden side effects**
   - Observation screens should not mutate state.
   - Intervention actions must be explicit and auditable.
6. **Small, focused diffs**
   - One feature/fix per commit where possible.
   - Do not include unrelated local changes.

## 4) Agent integration workflow (task loop)

Recommended heartbeat cadence: every 15–30s.

1. `GET /api/tasks` (`cache: no-store`)
2. Focus tasks where:
   - `owner="agent"`
   - `status in ["selected", "doing", "blocked"]`
3. Execute next step
4. Persist state via `PATCH /api/tasks/:id`

Status conventions:
- Start work → `status="doing"`, `active=true`
- Waiting on operator → `status="blocked"` + concrete unblock request in comments
- Finished → `status="done"`, `active=false` + short completion summary
- Reassign to human → `owner="operator"` + handoff context in comments

## 5) PR link field on tasks

Task cards support optional `prUrl`.

When a task maps to code delivery:
1. Add PR URL in Task Details (`prUrl`).
2. Keep status lifecycle accurate (`doing/blocked/done`).
3. Add a comment summarizing implementation and review status.

This keeps Mission Control aligned with real engineering progress.

## 6) API quick reference

- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`

Example PATCH:

```json
{
  "status": "doing",
  "active": true,
  "prUrl": "https://github.com/org/repo/pull/123",
  "comments": [
    {
      "id": "task-123-comment-1",
      "body": "Started implementation.",
      "author": "agent",
      "createdAt": 1761075400000,
      "updatedAt": 1761075400000
    }
  ]
}
```

## 7) Validation before handoff

Run before commit:

```bash
npm run lint
npm run build
```

If anything fails, include exact error output in your handoff.

## 8) Git/PR handoff contract

Always provide:
- branch name
- commit hash
- concise summary
- exact PR creation command

Example:

```bash
gh pr create --base main --head <branch> --title "<title>" --body "<summary>"
```

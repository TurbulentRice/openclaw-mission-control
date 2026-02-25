# AGENTS.md — Mission Control Integration Guide

Use this when wiring any OpenClaw bot/agent to Mission Control.

## Run the app

```bash
npm install
cp .env.example .env.local
npm run dev
```

Mission Control should be available at: `http://localhost:3000`

## Heartbeat task polling loop

On each heartbeat (recommended every 15–30s):

1. `GET http://localhost:3000/api/tasks` (`cache: no-store`)
2. Focus agent-owned tasks in active states:
   - `owner="agent"`
   - `status in ["selected", "doing", "blocked"]`
3. Execute next step and write back updates with `PATCH /api/tasks/:id`

## Task handoff workflow

Use these status/ownership transitions consistently:

- **Start work:** `status="doing"`, `active=true`
- **In progress:** append checkpoints to `comments[]`
- **Needs human input:** `status="blocked"` and include a concrete unblock request
- **Finished:** `status="done"`, `active=false`, add a short final summary in comments
- **Handing back to operator:** `owner="operator"` with handoff context in comments

## API quick reference

- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`

### `POST /api/tasks` minimum body

```json
{
  "title": "Implement timeline filters",
  "owner": "agent"
}
```

### `PATCH /api/tasks/:id` typical body

```json
{
  "status": "doing",
  "active": true,
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

## Copyable starter prompt

Use the same template shown on Overview:

```text
You are my OpenClaw bot working with Mission Control at http://localhost:3000.

Operating loop (every heartbeat):
1) GET http://localhost:3000/api/tasks (cache: no-store)
2) Pick tasks where owner="agent" and status in ["selected", "doing", "blocked"]
3) Execute next task and post progress by PATCH http://localhost:3000/api/tasks/:id

Handoff workflow:
- When starting work: set status="doing", active=true
- Add implementation notes/decisions in comments[]
- If waiting on me: set status="blocked" with clear unblock request
- When completed: set status="done", active=false, include final summary comment
- If reassignment needed: set owner="operator" and describe the handoff in comments[]
```

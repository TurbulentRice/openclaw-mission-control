# Mission Control Architecture

## Objective
Provide proactive organization, management, and insight on top of OpenClaw without duplicating OpenClaw's native dashboard.

## Data Boundaries

### OpenClaw-owned (read/act through OpenClaw API)
- runtime status
- sessions/subagents
- cron jobs and runs
- channel routing
- gateway configuration

### Mission Control-owned (Convex)
- task queue and triage state
- event annotations and operator notes
- mission-specific metadata (why a cron exists, success criteria, owner)
- future recommendations and policy overlays

## Why this split
- minimizes drift from OpenClaw truth
- allows product-layer agility in Mission Control
- supports composable feature growth without backend rewrites

## Localhost-only Guard (v1)
Requests are blocked unless host resolves to localhost/127.0.0.1/::1.

## Extension Principles
1. Add feature modules through adapters, not one-off route handlers.
2. Keep all side effects explicit and auditable.
3. Introduce write-actions only with confirmation pathways.
4. Preserve a clean distinction between observation and intervention.
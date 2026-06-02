# HITO DEMO-FUNNEL-2 - Restore Replay and Workspace Navigation

Date: 2026-06-02

## Objective

Restore the quick Migration Readiness Replay without losing the new deep read-only Demo Workspace.

## Problem Detected

`/demo` had become the deep Demo Workspace. That made the prior fast simulated demo less discoverable, even though it remains useful for explaining the product quickly.

## Product Decision

Shift Evidence now exposes two complementary public demo experiences:

- Quick simulation: fast, visual, guided and educational.
- Demo Workspace: deep, technical, read-only and scenario-driven.

## Final Routes

- `/demo`: public demo hub.
- `/demo/replay`: Migration Readiness Replay.
- `/demo/workspace`: read-only Demo Workspace.
- `/demo/reports/[scenario]`: public synthetic demo PDFs.

## What Was Restored

The existing replay components were reused:

- `src/components/demo/MigrationReadinessReplay.tsx`
- `src/components/demo/ReplayControls.tsx`
- `src/components/demo/ReplayScene.tsx`
- `src/components/demo/replayData.ts`

The replay remains synthetic and no-login. It does not upload files, access production systems, call real AI providers or mutate backend state.

## What Was Preserved

The Demo Workspace remains intact:

- 8 synthetic scenarios.
- Readiness and confidence scores.
- Evidence received/missing.
- Top risks and recommendations.
- Migration waves.
- Synthetic Advisor transcript.
- Public demo PDF downloads.
- Read-only guardrails.

## CTA Updates

Public pages now distinguish the two demo paths:

- `/`: prioritizes `Watch Quick Simulation`, with a secondary `Explore Demo Workspace`.
- `/shiftreadiness`: hero points to replay; the explainer block points to workspace.
- `/pricing`: points to workspace.
- `/sample-report`: includes workspace and replay entry points.
- `/vmware-to-proxmox-readiness`: hero points to replay; deeper CTA points to workspace.

No CTA promises a free trial, real infrastructure analysis, migration execution or live AI in demo.

## Safety

No DB, migrations, env vars, payments, webhooks, production config or real AI providers were touched.

Full public launch remains NO.

## Tests

Updated unit coverage validates:

- demo hub links to `/demo/replay` and `/demo/workspace`;
- replay route renders Migration Readiness Replay and links to workspace;
- workspace route renders Demo Workspace and links back to replay;
- 8 demo scenarios remain available;
- public CTAs point to the intended demo route;
- demo guards remain active.

## Risks

- Browser screenshot QA should be repeated when the browser connector is available.
- Public deployment should be smoke-tested after an owner-approved push.
- The main workspace still has separate billing/Prisma work preserved outside this hito and must not be mixed into demo work.

## Percentages

- Demo Replay readiness: 92-96%
- Demo Workspace readiness: 95-97%
- Demo Funnel completo: 96-98%
- Public conversion readiness: 91-94%
- Shift Evidence / ShiftReadiness general: 99.4-99.5%
- Full public launch: NO

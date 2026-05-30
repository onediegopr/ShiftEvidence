# HITO ADVISOR-SMOKE-1D — Enabled Senior Advisor Real Message, Persistence & Usage Tracking

## Objective

Validate the full production smoke for `Senior Migration Advisor` after the QA entitlement resolver fix in commit `8cbda34`.

The intended smoke was:

- confirm the production runtime includes `8cbda34` or later;
- validate the QA user sees `Internal QA`;
- validate the message counter shows a non-zero allowance;
- send a real QA message;
- validate response or controlled fallback;
- validate history persistence after reload;
- validate `AiUsageEvent.operationType = senior_advisor_message`;
- validate the request-credits placeholder.

## Context

`ADVISOR-ENTITLEMENT-QA-2` fixed the Advisor entitlement resolver by adding `internal_qa` as a first-class Advisor plan key.

Expected post-deploy behavior for the QA entitlement:

- plan label: `Internal QA`;
- counter: `0 / 25 used` or equivalent;
- textarea enabled;
- suggested prompts enabled;
- send button enabled when text is present;
- Starter / Free users remain locked.

QA target:

- user: `vivianafernandez@gmail.com`;
- entitlement: `advisor-qa-20260530-viviana`;
- `planKey`: `internal_qa`;
- `aiEnabled`: `true`;
- expiry: `2026-06-06T23:59:59.000Z`.

## Git / Runtime

Local Git state before documentation:

- branch: `main`;
- HEAD: `8cbda34 fix: resolve Senior Advisor QA entitlement unlock`;
- local and `origin/main`: synchronized;
- working tree before documentation: clean;
- stash preserved.

Runtime status:

- deployed commit: not confirmed;
- `8cbda34` applied in production: not confirmed;
- build status: not visible from the available channel.

## Public Smoke

Public HTTP smoke was executed with `curl.exe`.

| Route | Result |
| --- | --- |
| `https://shiftevidence.com/` | 200 |
| `https://shiftevidence.com/shiftreadiness` | 200 |
| `https://shiftevidence.com/sign-in` | 200 |
| `https://shiftevidence.com/sign-up` | 200 |
| `https://shiftevidence.com/sample-report` | 200 |

No public 500 or Hostinger 404 was detected in this smoke.

## Authenticated Advisor Smoke

Authenticated Advisor smoke was not executed.

Reason:

- Chrome authenticated automation did not become available from Codex in this run.
- Two lightweight Chrome connection attempts timed out.
- No password, token or manual login data was requested.
- No authenticated message was sent.

Because the core objective of this hito is a real authenticated Advisor message, this hito remains blocked for the functional Advisor path.

## UI Enabled State

Not validated in this run.

Pending checks:

- tab `Senior Advisor` visible after runtime update;
- plan label `Internal QA`;
- counter `0 / 25` or equivalent;
- textarea enabled;
- suggested prompts clickable;
- send button enabled when text is present;
- request credits placeholder visible.

If production still shows `Plan locked`, `Starter / Free Preview` or `0 / 0 used`, the likely causes are:

- runtime has not deployed `8cbda34`;
- session needs refresh;
- authenticated user is not the QA entitlement user;
- runtime is not reading the active entitlement;
- server/page cache has stale state.

## Message Send

Not executed.

Required QA prompt for the next attempt:

```text
What should I complete next in this assessment?
```

Pending validation:

- message appears in chat;
- loading state appears;
- response or controlled fallback appears;
- no 500;
- no provider crash;
- no visible Prisma error.

## Response Quality

Not evaluated.

Required checks:

- response refers to the current assessment;
- explains practical next steps;
- mentions missing evidence if applicable;
- does not invent data;
- does not guarantee migration success;
- does not approve production migration;
- does not override Ceph, Licensing or readiness engines.

## Persistence

Not tested.

Pending validation:

- reload page;
- reopen the same assessment;
- reopen `Senior Advisor`;
- user message persists;
- assistant response or fallback persists;
- counter updates;
- no duplicate conversation;
- no cross-assessment leakage.

## Usage Tracking / Logs

Not verified because no Advisor message was sent.

Pending validation:

- `AiUsageEvent.operationType = senior_advisor_message`;
- status is correct;
- estimated tokens/cost are recorded if provider is used;
- metadata is safe;
- no full prompt is stored in metadata;
- no secrets;
- no raw file contents.

## Request Credits

Not tested.

Pending validation:

- click `Request more advisor credits`;
- no billing real;
- no purchase flow;
- safe placeholder/audit event only.

## Security

This run did not:

- apply migrations;
- mutate DB;
- use `db push`;
- use `migrate reset`;
- change env vars;
- touch pricing;
- deploy Hostinger;
- declare full public launch;
- start ADVISOR-2.

No secrets were requested or printed.

## Final Status

Status: BLOCKED for the functional authenticated Advisor smoke.

Public smoke is OK, but the real Advisor message, persistence and usage tracking path remains pending.

## Next Step

Run a manual or browser-authenticated `ADVISOR-SMOKE-1D` retry after confirming the production runtime has `8cbda34` or later.

Minimum acceptance criteria for closure:

- QA user sees `Internal QA`;
- counter shows non-zero allowance;
- input is enabled;
- QA message sends;
- response or controlled fallback appears;
- history persists after reload;
- `senior_advisor_message` usage is recorded.

# Neon Preview DB And Vercel Preview Env Smoke

Date: 2026-06-04

## Objective

Validate a protected Vercel Preview deployment using a real Neon preview/staging database URL, R2 preview storage environment, public routes, PDFs, private-route auth gating, and safe billing/manual-invoice surfaces without touching production systems or exposing secrets.

## Scope

- Repository branch: `main`
- Commit deployed: `efca33806f0c7f639bdaef2b55a130f26784fdbf`
- Vercel project: `infrashift-r2-recovery`
- Vercel deployment: `dpl_8Be7w6b6crmKKnhzHwuTncdaEtT7`
- Preview URL: `https://infrashift-r2-recovery-l9ouu5d5g-shift-evidence.vercel.app`
- Deployment state: `READY`
- Deployment target: Preview
- Preview Protection: enabled

## Safety Boundaries

- No production database was intentionally used.
- No database reset, delete, migration deploy, or `db push` was run.
- No production R2 bucket was used.
- No Stripe live payments were enabled.
- No Stripe checkout session was created.
- No webhook was triggered.
- No entitlement was granted.
- No Wise transfer was executed.
- No Hostinger, DNS, email, custom domain, or production deploy action was taken.
- No secrets were printed into this document.
- No local env files were committed.

## Neon Database

- A real Neon preview/staging `DATABASE_URL` was supplied from a local operator note.
- The exact connection string is intentionally not documented.
- Prisma migration status was checked against that database.
- Prisma reported the schema as up to date with all local migrations applied.
- No migration was applied in this hito.
- Neon MCP branch inventory was not available because the connector required reauthentication, so the database classification is based on the operator-provided local note and the non-destructive Prisma status check.

## Vercel Environment

The deployment was created with runtime/build environment supplied for this Preview deploy only.

Loaded categories:

- Neon `DATABASE_URL`
- Better Auth preview secret and app/auth URL values
- R2 preview storage configuration
- R2 preview bucket: `shift-evidence-preview-evidence`
- R2 production bucket name for completeness only; it was not used
- `STORAGE_DRIVER=r2`
- Stripe checkout explicitly disabled
- Stripe mode kept test/safe
- Stripe live approval explicitly false
- Wise automation left disabled/unconfigured

Important operational note:

- Because `main` is the production branch in Vercel, Vercel did not allow branch-scoped Preview variables specifically for `main`.
- The successful smoke used per-deployment environment values through the Preview deploy.
- Future Preview redeploys should persist equivalent Preview env through a dedicated non-production branch or a stable Preview workflow.
- One-off Preview URLs change per deploy, so full auth-origin fidelity should use a stable Preview URL/alias or a follow-up origin-policy hito.

## R2 Preview Storage

- Preview bucket configured for this deploy: `shift-evidence-preview-evidence`.
- Production bucket was not used.
- R2 preview credentials were sourced from local ignored env only.
- R2 secrets were not printed or committed.
- Runtime R2 upload/download was not re-executed in this hito because there was no safe authenticated browser session/API fixture in scope.
- Prior direct and service-level R2 preview smokes remain the storage baseline.

## Smoke Results

All smoke requests were made through an authorized Vercel Preview Protection access path. The temporary access URL is not documented.

### Public Routes

All returned `200 OK`:

- `/`
- `/shiftreadiness`
- `/vmware-to-proxmox-readiness`
- `/demo`
- `/demo/replay`
- `/demo/workspace`
- `/sample-report`
- `/pricing`
- `/support`
- `/security`

### Private Route

- `/dashboard`: `200 OK`, rendered the sign-in gate instead of a server error.

### Billing Checkout

All checkout pages returned `200 OK` and stayed safely blocked with no Stripe hosted checkout session:

- `/billing/checkout/starter`
- `/billing/checkout/professional`
- `/billing/checkout/msp`

Observed safe state:

- Stripe checkout not configured
- No payment active
- No live checkout
- No order created
- No entitlement created

### Manual Invoice / Bank Transfer

All manual bank-transfer pages returned `200 OK`:

- `/billing/bank-transfer/starter`
- `/billing/bank-transfer/professional`
- `/billing/bank-transfer/msp`

No Wise automation or transfer was executed.

### PDFs

All PDF routes returned `200 OK`, `application/pdf`, and a valid `%PDF` header:

- `/demo/reports/balanced-mid-market`
- `/sample-reports/proxmox-migration-readiness-sample-report.pdf`
- `/sample-reports/proxmox-migration-readiness-premium-sample-report-v2.pdf`

## Build / Logs Review

- Deployment reached `READY`.
- Build ran `prisma generate && next build`.
- Prisma Client generated successfully.
- No blocking build errors were observed.
- Warnings observed:
  - Vercel Node engine warning for `>=22`.
  - Prisma major-version update notice.

No secret values were observed in the reviewed build output.

## Local Files / Git Safety

- `.env.local` remained local and ignored.
- `.env.r2-smoke.local` remained local and ignored.
- No env file was tracked.
- No secrets were added to documentation.

## Result

Status: completed with operational caveat.

The Preview deployment successfully served public routes, public PDFs, auth-gated private routing, safe disabled checkout pages, and manual bank-transfer pages using the supplied Neon/R2 preview environment.

The caveat is that the env was supplied to this specific Preview deploy because branch-scoped Preview env for `main` was blocked by Vercel's production-branch rule. A stable non-production branch or stable Preview alias should be used before relying on repeated redeploys.

## Recommended Next Hito

`PREVIEW-ORIGIN-POLICY-1`

Alternative after origin policy is stable:

`R2-AUTHENTICATED-UPLOAD-DOWNLOAD-SMOKE-VERCEL-PREVIEW`

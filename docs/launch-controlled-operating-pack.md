# Launch Controlled Operating Pack

## Purpose

This operating pack defines how ShiftReadiness should be operated during controlled production launch.

Production launched: SÍ.

Launch type: controlled production launch.

Public launch: NO.

Adaptive Migration Context Intake: implemented locally in CONTEXT-1, pending authorized push/deploy validation.

## AI-OPS-1 — Gemini Runtime Monitoring

Date: 2026-05-27.

AI Advisory now has a minimum operational layer for controlled launch:

- Safe runtime status helper.
- Admin-protected status endpoint for future Spanish admin console.
- In-memory success/error/timeout/fallback counters.
- Local fallback drill via `npm run ai:fallback-drill`.
- Rollback path remains `AI_ADVISORY_ENABLED=false` or `AI_ADVISORY_PROVIDER=disabled`.

Operational rules:

- Do not print or store provider secrets.
- Do not log prompts or raw AI responses.
- Do not send raw uploaded files to AI.
- Keep deterministic readiness/confidence scores as source of truth.
- Do not activate OpenAI unless explicitly approved in a later hito.

## What Controlled Launch Means

Controlled launch means limited, supervised production usage.

Allowed:

- Pilot users.
- Supervised demos.
- Manual entitlement flow.
- Synthetic or approved customer data.
- Manual account support.

Not allowed yet:

- Public launch at scale.
- Mass marketing/ads.
- Self-service paid checkout.
- Claims of full public launch readiness before remaining public launch blockers are reviewed.
- Untracked deletion of QA data.

## Daily Checklist

- Public `/` returns OK.
- `/shiftreadiness` returns OK.
- `/sign-in` returns OK.
- `/dashboard` redirects without session.
- QA/admin login works if tested.
- Dashboard loads for authenticated user.
- Admin queue loads for admin.
- Pending requests are reviewed.
- Visible errors are captured.

## Workflow

1. Pilot user creates account.
2. Pilot user creates assessment.
3. Pilot user completes intake and assumptions.
4. Pilot user completes Quick Context and any known Advanced Context.
5. Pilot user uploads evidence.
6. Pilot user reviews preview.
7. Pilot user requests full report.
8. Admin reviews and fulfills.
9. Pilot user generates/downloads full report.
10. Issues are documented with assessment ID and screenshots.

## Adaptive Migration Context Operating Rule

- Quick Context should be encouraged early because it improves report confidence.
- Advanced Context can be completed progressively.
- `Unknown`, `Not applicable` and `Skip for now` are valid user states.
- Missing context is treated as evidence gap, not as a blocking form error.
- Advanced context does not block evidence upload.
- Context coverage should be reviewed before using the report/PDF as an advisory artifact.
- CONTEXT-1 prepares a structured payload for future Gemini advisory, but no AI call is active yet.
- CONTEXT-1-PROD-QA is closed by user-attested authenticated browser evidence for save/refresh/report/PDF behavior.

## Escalation

Escalate immediately if:

- Public routes fail.
- Private routes expose data.
- Upload stores files publicly.
- Report download is accessible without session.
- Admin route exposes data to non-admin.
- PDF generation repeatedly fails.
- Hostinger returns persistent `503/504`.

## ADMIN-3 Commercial/Ops Console Update

Date: 2026-05-28.

ADMIN-3 is migrated in production and available inside `/dashboard/admin` for admin users only.

Operational capabilities:

- Estimated AI budget and informational limits.
- Manual user entitlements and access plans.
- Commercial opportunities with deterministic score and next-best-action.
- Admin audit events for budget, entitlement and opportunity changes.
- Users and assessments enriched with plan/opportunity/AI consumption signals.

Operating rules:

- Do not edit provider secrets from admin.
- Do not expose API keys or DB URLs.
- Do not use hard delete or impersonation.
- Treat AI budget limits as informational until ADMIN-4.
- Keep QA actions clearly marked, for example `QA ADMIN-3 smoke`.

## ADMIN-4 Runtime Enforcement Update

Date: 2026-05-28.

ADMIN-4 adds operational runtime controls without editing Hostinger env vars:

- AI runtime mode can be controlled by DB setting: `env`, `disabled`, `mock`, `gemini`.
- AI budget/entitlement blocks return safe AI fallback and keep preview/PDF available.
- PDF generation and report downloads can be paused by admin setting.
- New assessment creation can be paused by admin setting.
- Admin changes require confirmation and are audited.

Operating rules:

- Use runtime settings for temporary operational pauses.
- Do not store provider secrets in `SystemSetting`.
- Do not use runtime settings as billing automation yet.
- Keep full public launch as NO until public-launch criteria close.

Production ops smoke:

- Authenticated admin user-attested QA passed.
- AI runtime was changed to `disabled`, then `mock`, then restored to `env/gemini`.
- Preview/test did not crash during disabled/mock states.
- Audit recorded actions.
- No secrets were visible.
- Final state: AI `env/gemini`, PDF/download enabled, assessment creation enabled.

## PRE-LAUNCH-1 Controlled Beta Acceptance

Date: 2026-05-28.

Controlled beta acceptance hardening was completed without new features:

- Public production routes returned healthy responses.
- Private/admin routes redirected unauthenticated users to `/sign-in`.
- Build, lint, typecheck, AI guardrails and Prisma validation passed.
- Public HTML did not expose secret/error patterns in the sampled routes.
- ADMIN-4 authenticated production evidence remains accepted.
- QA/demo data was reviewed, not deleted.
- Runtime settings final state is operational.

Decision:

- Controlled beta accepted: YES.
- Limited beta usage: YES, still controlled/low-volume/invitation-only.
- Full public launch: NO.

## QA-CLEANUP-ARCHIVE-1 Review

Date: 2026-05-28.

QA/demo data was inventoried without deletion:

- 25 QA/demo assessments.
- 14 `safe to delete` assessments.

## DEMO-1 Migration Readiness Replay

Date: 2026-05-28.

The public route `/demo` is available as a simulated Migration Readiness Replay for pre-onboarding education.

Operating rules:

- Demo uses synthetic ACME data only.
- Demo does not require login.
- Demo does not use backend, DB, Gemini, uploads or customer data.
- Demo must be described as simulated.
- Demo must not be presented as migration automation, zero-downtime assurance, cutover automation or 100% success guarantee.
- CTAs may send users to `/sign-up`, `/contact` or back to `/`.

Post-deploy rule:

- If Hostinger/HCDN serves stale HTML with missing `_next` assets, purge cache before inviting prospects to `/demo`.

DEMO-1.1 visual QA:

- Mobile layout and long technical strings were tightened.
- Sound control is explicitly visual-only.
- Public marketing copy was adjusted away from execution/cutover language.
- `/demo` remains simulated and suitable for pre-onboarding education, not full public launch.

## SAMPLE-REPORT-1 Public Sample Report Foundation

Date: 2026-05-28.

The public route `/sample-report` is available as a synthetic sample readiness report foundation.

Operating rules:

- Sample uses synthetic ACME data only.
- Sample does not require login.
- Sample does not use backend, DB, Gemini, uploads, lead capture or customer data.
- Downloadable PDF is not published yet and must be described as coming soon.
- Sample must not be presented as migration automation, zero-downtime assurance or 100% success guarantee.
- Use it with `/demo`: replay explains the process, sample report explains the deliverable.

## SAMPLE-REPORT-2 Public Synthetic PDF

Date: 2026-05-28.

The public sample report now includes a downloadable synthetic PDF:

- Public URL: `/sample-reports/proxmox-migration-readiness-sample-report.pdf`.
- 15 pages.
- Generated from local synthetic ACME data with `npm run sample-report:generate`.
- No backend, DB, Gemini call, upload, lead capture or customer data.
- `/sample-report` is the preferred entry point before PDF download.

Operating rules:

- Present the PDF as a synthetic commercial sample, not a customer report.
- Do not use it to claim migration automation, zero downtime or 100% success.
- Regenerate only from synthetic data unless a separate approved sample-report hito changes the process.

SAMPLE-REPORT-2.1 visual QA:

- PDF rendered locally at 15 pages for visual review.
- `/sample-report` mobile overflow was corrected.
- `npm run sample-report:generate` now normalizes non-sensitive PDF metadata for reproducible output.
- Sample remains synthetic, commercial and non-executing.

## SALES-PAGE-1 Standalone Readiness Offer Page

Date: 2026-05-28.

The public route `/vmware-to-proxmox-readiness` is available as a standalone VMware -> Proxmox readiness offer page.

Operating rules:

- The page is linked only from `/demo` and `/sample-report`.
- Home `/`, global navigation and `/shiftreadiness` were not modified.
- The page uses no backend, DB, Gemini call, upload, checkout, lead capture or customer data.
- Pricing is a preview only; beta payments remain manual.
- The page must not be presented as full public launch approval.
- Claims remain limited to readiness, planning, evidence gaps, risk and decision support.

SALES-PAGE-1.1 visual QA:

- Desktop and mobile local screenshots were reviewed.
- Production routes for sales page, demo and sample report returned healthy responses.
- Hero copy now clarifies planning assessment vs. migration execution.
- Pricing copy now reinforces manual beta access and no instant purchase.
- 2 synthetic assessments.
- 1 `internal_qa` entitlement.
- 1 QA commercial opportunity.
- 1 `admin_test` AI usage event.
- 31 reports associated with QA assessments.

Operating rule:

- Do not hard-delete QA/demo records during controlled beta without a separate reviewed cleanup hito.
- Prefer archive/mark/filter workflows over destructive deletion.
- Treat QA/demo usage as non-commercial when interpreting metrics.

## PUBLIC-LAUNCH-READINESS-2

Date: 2026-05-28.

Final readiness review result:

- Public production routes healthy.
- Private/admin routes redirect unauthenticated users.
- User authenticated flow PASS by user-attested evidence.
- Admin authenticated flow PASS by user-attested evidence.
- Gemini advisory/PDF/report preview healthy in the validated user flow.
- Admin sections load: system health, AI consumption, access plans, opportunities, operational settings and audit.
- No visible secrets.
- QA/demo data identified and documented.

Decision:

- Controlled beta: accepted.
- Broader invited beta: accepted.
- Full public launch: NO until explicit owner/commercial decision.

## LAUNCH-DECISION-1 Broader Invited Beta

Date: 2026-05-28.

Broader invited beta is approved under these operating conditions:

- 3 to 10 controlled customers initially.
- Known VMware customers, MSPs or consultants only.
- Manual invitation and manual entitlement.
- 1 to 3 assessments per customer by default.
- 3 to 5 PDFs per customer by default.
- Gemini enabled with fallback.
- PDF/download/assessment creation enabled for entitled users.
- Manual payments only.
- No public checkout.
- No broad ads or mass self-service launch.

Full public launch remains NO.

## MANUAL-FINAL-v1.2

Date: 2026-05-28.

The current internal operating manual for broader invited beta is:

- `docs/shiftreadiness-functional-operational-manual-v1-2-broader-invited-beta.md`

It consolidates:

- customer onboarding and assessment operation;
- context, upload, preview, PDF and Gemini Advisory rules;
- Spanish admin console operation;
- AI consumption, budgets, entitlements and opportunities;
- runtime controls and enforcement;
- incident handling and rollback;
- manual pricing/payment operating rules;
- full public launch criteria.

DOCX export remains pending until a repo-safe generator/render verification path is available.

Full public launch remains NO.

## FUNCTIONAL-READINESS-1B Authenticated Smoke

Date: 2026-05-28.

Fresh authenticated evidence was received for the real product flow:

- User flow PASS: login, dashboard, assessments, controlled QA assessment, Context Intake, report preview, Gemini Advisory, readiness/confidence scores, PDF generation/download/open and AI Advisory in PDF.
- Admin flow PASS: admin dashboard, system status, users, evaluations, AI consumption, access plans, opportunities, operational settings and audit.
- Localhost PASS.
- Local Gemini smoke PASS with `providerStatus=success` and model `gemini-flash-lite-latest`.
- No raw JSON, no `[object Object]`, no visible secrets and no visible storage paths were reported.

Decision:

- Product is functional for broader invited beta and first controlled real-client usage.
- Full public launch remains NO.
- Strict synthetic Gemini/PDF report success remains separate under `AI-REPORT-SYNTHETIC-HARDENING`.

## UX-HARDENING-1 Pre-Real-Use Polish

Date: 2026-05-28.

Pre-real-use UX/UI hardening was completed without adding features or changing production settings.

Implemented polish:

- Removed `transition: all` and `outline: none` from source CSS.
- Added explicit `:focus-visible` treatment for key controls.
- Replaced public `alert()` flows with inline status messages.
- Added basic `role="status"` / `role="alert"` semantics to dynamic banners.
- Tightened admin Spanish microcopy and readiness-oriented public footer copy.

Decision:

- Product remains ready for broader invited beta / first controlled real-client usage.
- Full public launch remains NO.

## Rollback / Pause

If launch must be paused:

- Do not delete production data.
- Do not run Prisma reset.
- Preserve logs.
- Document reason.
- Revert launch decision documentation if needed.
- Notify pilot users manually.

## Accepted Risks

- Password recovery migrated and deployed; Resend provider and valid-token mailbox smoke passed by user-attested validation.
- Hostinger logs not reviewed from Codex.
- QA cleanup pending.
- Admin UX gap cross-owner.
- Browser multi-assessment replay not automated by Codex.

## AUTH-1 Account Support Update

The application now includes password recovery code and UI:

- `/sign-in` includes `Forgot password?`.
- `/forgot-password` accepts recovery requests with a neutral response.
- `/reset-password?token=...` accepts single-use reset tokens.
- Reset requests are stored with hashed tokens.
- Resend email delivery is configured by user report with `RESEND_API_KEY` and `EMAIL_FROM`.
- If provider delivery regresses, recovery requests fall back to manual support.

Production use has completed controlled migration and deploy. Do not run `prisma migrate reset`.

AUTH-1-PROD status:

- Production migration applied.
- Code pushed and deployed on Hostinger.
- `/forgot-password` and `/reset-password` live.
- Invalid token handling is controlled.
- Password recovery is operational in production.

## Public Launch Readiness Review Update

Date: 2026-05-27.

Decision:

- Public launch: NO.
- Controlled production launch remains active: YES.
- Limited public beta / limited public access may proceed only with controlled operating conditions.

Reasons full public launch is not yet approved:

- Hostinger runtime/build/error logs were not reviewed from Codex.
- QA cleanup/retention is documented but not executed.
- Authenticated browser QA for multi-assessment, upload, report and PDF was not replayed in this review.
- Admin cross-owner report UX gap remains.
- Public support/SLA and entitlement/commercial operating model need final definition.

Operational rule:

- Treat any public users as limited beta users until `PUBLIC-LAUNCH-2` closes the remaining blockers.

## PUBLIC-LAUNCH-2 Operating Update

Date: 2026-05-27.

Limited public beta remains approved under these conditions:

- Low-volume selected users only.
- Manual support.
- Manual entitlement.
- No paid self-service checkout.
- No broad public launch language.
- QA data retained only with `safe to delete` marking.
- Issues captured with screenshots and assessment/report IDs.

Full public launch remains NO until logs, QA cleanup, authenticated browser QA, admin UX and support/SLA are closed.

## PUBLIC-BETA-OPS-1 Follow-up

Date: 2026-05-27.

Operational status:

- Limited beta may continue under controlled / low-volume / invitation-only usage.
- Password recovery regression passed.
- Public/private routes remain healthy.
- No production data cleanup was executed.

Operator reminders:

- Review Hostinger logs manually when available.
- Capture browser QA evidence with screenshots and assessment IDs.
- Keep QA data named `QA Public Beta Ops - safe to delete`.
- Do not hard-delete DB/storage data during beta without inventory and approval.

## PUBLIC-BETA-OPS-2 Follow-up

Date: 2026-05-27.

Operator action still required:

- Export or summarize Hostinger runtime/build/deploy logs without secrets.
- Capture browser QA evidence for multi-assessment and product flow.
- Inventory QA data marked `QA Public Beta Ops 2 - safe to delete`.
- Archive/soft-delete only after item ownership and metadata are confirmed.

## PUBLIC-BETA-OPS-3 Follow-up

Date: 2026-05-27.

Operational status:

- Limited public beta remains operational under controlled, low-volume, invitation-only conditions.
- Public production routes are healthy.
- Password recovery regression passed.
- Full public launch remains NO.

Operator action still required:

- Provide Hostinger deployment/runtime/build log summary without secrets.
- Execute authenticated browser QA with a QA user.
- Execute authenticated upload/parser/report/PDF replay.
- Inventory and archive/retain QA data marked `QA Public Beta Ops 3 - safe to delete`.

## PUBLIC-BETA-OPS-3A Follow-up

Date: 2026-05-27.

Operator status:

- Limited public beta remains operational.
- Full public launch remains NO.
- Manual evidence import did not include Hostinger logs, browser QA, product-flow replay or QA cleanup/archive.

Required operator action:

- Provide evidence without secrets/cookies/tokens.
- Use `QA Public Beta Ops 3A - safe to delete` naming for any new QA data.

## PUBLIC-BETA-OPS-4 Follow-up

Date: 2026-05-27.

Operator status:

- Limited public beta remains operational.
- Full public launch remains NO.
- No new manual evidence was imported.

Rule:

- Do not rerun final evidence closure until Hostinger logs and browser/product-flow checklist are available.

## AI-1 Safe Advisory Layer

Date: 2026-05-27.

Operational status:

- AI Advisory architecture is implemented behind feature flags.
- Default behavior is disabled/no-op.
- Mock provider can be used for safe validation without external calls.
- Real Gemini/OpenAI provider calls are not enabled in AI-1.
- Report preview and PDF must continue working if AI is disabled, unavailable or errors.

Operator rules:

- Do not enable a real AI provider without a separate approved hito.
- Do not send raw uploaded files, secrets, cookies, tokens, reset tokens or private storage paths to AI.
- Treat AI notes as advisory only; deterministic readiness/confidence scores remain source of truth.
- Full public launch remains NO.

## AI-1.1 Real Provider Guardrails

Date: 2026-05-27.

Implementation status:

- Gemini/OpenAI real-provider code path is implemented.
- Provider calls are server-side only.
- No production keys were printed.
- No Hostinger config was changed by Codex.
- Real production activation requires Hostinger env vars and smoke evidence.

Required rollback:

- Set `AI_ADVISORY_ENABLED=false`.
- Or switch `AI_ADVISORY_PROVIDER=mock`.
- Or switch `AI_ADVISORY_PROVIDER=disabled`.

Full public launch remains NO.

## AI-1.3 Production Gemini QA

Date: 2026-05-27.

Operational status:

- Gemini AI Advisory main production visual flow passed by user-attested QA.
- Report preview and PDF both showed AI Advisory.
- Deterministic scores remained visible.
- No raw JSON, `[object Object]`, secrets or raw file content were reported visible.
- OpenAI remains inactive.

Full public launch remains NO.

## AI-1.2 Gemini Production Activation Attempt

Date: 2026-05-27.

Operational status:

- Gemini provider code is present.
- Gemini production activation remains blocked.
- Codex did not have Google AI Studio / Gemini MCP access.
- Codex did not have Hostinger runtime-env write access.
- No Gemini key was printed, stored in docs or committed.
- OpenAI remains inactive.
- Public production routes remain healthy without session.

Target env vars when a secure Hostinger path is available:

```bash
AI_ADVISORY_ENABLED=true
AI_ADVISORY_PROVIDER=gemini
AI_ADVISORY_MODEL=gemini-1.5-flash
AI_ADVISORY_TIMEOUT_MS=15000
AI_ADVISORY_MAX_INPUT_CHARS=24000
AI_ADVISORY_MAX_OUTPUT_CHARS=6000
# Gemini API key is configured in Hostinger runtime and must never be documented here.
```

Rollback remains:

```bash
AI_ADVISORY_ENABLED=false
```

or:

```bash
AI_ADVISORY_PROVIDER=disabled
```

Do not approve full public launch until authenticated Gemini preview/PDF smoke passes with no leaks and no raw JSON / `[object Object]`.

## ADMIN-1 Spanish Admin Console

Date: 2026-05-27.

Operational status:

- Internal Spanish admin console exists at `/dashboard/admin`.
- Access uses the same product login.
- Admin authorization uses `ADMIN_EMAILS`.
- Non-admin authenticated users receive a Spanish no-permission screen.
- Normal customers do not see admin navigation.
- The console shows operational summary, system health, Gemini status, safe config health, read-only users, read-only assessments, audit placeholders and the existing unlock queue.

Operational rules:

- Do not expose secrets, API keys, database URLs, cookies, tokens or private storage paths.
- Keep user/assessment actions read-only until ADMIN-2 explicitly adds safe operations.
- Do not use the admin console as evidence for full public launch by itself.
- Full public launch remains NO.

## ADMIN-2A AI Consumption Panel

Date: 2026-05-28.

Operational status:

- The Spanish admin console now has a stronger `IA y Consumo` panel.
- It uses in-memory runtime metrics only.
- It shows Gemini status, provider/model, safe key configured states, recent memory events and operational alerts.
- Tokens, cost estimates, per-user usage and per-assessment usage remain pending for ADMIN-2B.

Rules:

- Do not treat in-memory metrics as billing evidence.
- Do not edit provider secrets from the admin console.
- Do not activate OpenAI.
- Full public launch remains NO.

## ADMIN-2B Persistent AI Usage

Date: 2026-05-28.

Operational status:

- `AiUsageEvent` persists safe AI usage metadata.
- Admin `IA y Consumo` shows estimated tokens/costs, recent events, errors, and usage by user/assessment.
- Preview and PDF calls are tracked separately.
- Prompt text, raw AI responses, secrets, raw uploaded files and private storage paths are not persisted.

Rules:

- Treat cost as estimated, not billing authority.
- Do not use admin usage metrics to trigger automatic billing yet.
- Do not edit provider secrets from the admin console.
- Full public launch remains NO.

## ADMIN-2B Production Migration Smoke

Date: 2026-05-28.

Status: PARTIAL.

- `npm run prisma:deploy` could not apply the migration from the Codex runtime because `DATABASE_URL` was not available.
- No secrets were printed.
- No Prisma reset was executed.
- Public unauthenticated production smoke passed.
- Authenticated admin usage smoke remains pending until the migration is applied from the secure production runtime.

Required closeout:

1. Run `npm run prisma:deploy` where production `DATABASE_URL` is configured securely.
2. Verify `/dashboard/admin` as admin.
3. Generate a Gemini preview/PDF event.
4. Confirm `IA y Consumo` shows persisted usage without secrets.

## ADMIN-2B Production Migration User-Attested Attempt

Date: 2026-05-28.

Status: BLOCKED.

- The runtime still did not expose production `DATABASE_URL`.
- `NODE_ENV` and production app URL markers were not available in shell env.
- Migration was not executed.
- No secrets were printed.
- Public/private no-session production smoke remained healthy.

Do not mark persistent AI usage production-ready until `prisma migrate deploy` runs in the secure production runtime and an authenticated admin confirms `IA y Consumo` plus at least one persisted AI event.

## ADMIN-3 Budgets, Entitlements and Opportunities

Date: 2026-05-28.

Operational status:

- Internal admin can configure estimated AI budgets and informational limits.
- Manual user entitlements are available for internal access control.
- Commercial opportunity scoring and next-best-action guidance are visible.
- Admin actions are audited through safe `AuditEvent` entries.

Rules:

- Budget/cost data is estimated, not billing authority.
- Limits are informational until ADMIN-4.
- Do not edit API keys or Hostinger env vars from admin.
- Do not activate OpenAI.
- Full public launch remains NO.

## DB-ACCESS-ADMIN-2B Production Migration Closeout

Date: 2026-05-28.

Status: COMPLETE.

- `DATABASE_URL` was found in existing unversioned `.env.local` and loaded only into the command process.
- The value was not printed.
- The DB target was confirmed against Neon `InfraShift` read-write compute metadata before migration.
- `npm run prisma:deploy` applied `20260528103000_admin_2b_ai_usage_events`.
- `AiUsageEvent` exists and safe count increased from `0` to `1`.
- Production no-session smoke passed for `/`, `/shiftreadiness`, `/sign-in`, `/sign-up`, `/dashboard`, `/dashboard/admin` and `/api/admin/ai/usage`.
- Authenticated `/dashboard/admin` loaded `IA y Consumo` with persisted usage visible.
- One safe synthetic `admin_test` event is visible with provider/model/status/tokens/cost.
- No secrets, raw files, prompts, raw responses or private storage paths were printed or persisted.
- OpenAI remains inactive.
- Full public launch remains NO.

# Shift Evidence / ShiftReadiness

Shift Evidence is the public brand. ShiftReadiness is the first product module.

Tagline:
Infrastructure readiness before you migrate.

Status:
Controlled production launch active. Broader invited beta is approved for controlled, low-volume or invitation-only operating conditions. Full public launch is not approved yet; it still requires an explicit owner/commercial decision, public support/SLA, final pricing or checkout process, QA/demo archive/filter decision and final public launch checklist closure. AUTH-1 password recovery is operational in production by user-attested mailbox/token validation and regression smoke. The Antigravity post-landing UX/UI update was audited by Codex in HITO UX-AUDIT-1; local production-like serving, build, lint, typecheck and unauthenticated route smoke passed.

Current manual:
`docs/shiftreadiness-functional-operational-manual-v1-2-broader-invited-beta.md`

The previous v1.1 Limited Public Beta manual is superseded by v1.2 and retained as historical controlled launch documentation.

PUBLIC-BETA-OPS-3A attempted to import manual Hostinger logs and authenticated browser QA evidence. No user/Claude evidence was provided in that hito, so full public launch remains blocked by logs, browser QA, product-flow replay and QA cleanup/archive.

PUBLIC-BETA-OPS-4 repeated final evidence closure without new manual evidence. Codex validations remained healthy, but confidence percentages did not increase and full public launch remains NO.

CONTEXT-1 adds an Adaptive Migration Context Intake in the assessment workspace. It captures human migration context that RVTools cannot infer, stores it without a schema change in `CostRiskAssumptions.assumptionsJson`, calculates context coverage, feeds missing evidence/confidence, appears in report preview/PDF, and prepares the structured payload for future AI advisory. It does not block evidence upload and does not call Gemini yet.

CONTEXT-1-PROD-QA is closed by user-attested authenticated browser evidence: Context Intake save/refresh, coverage, report preview and PDF were reported OK. AI-1 is unblocked as a separate next hito with guardrails.

AI-1 adds a safe advisory layer architecture for future context-aware migration recommendations. It is feature-flagged, disabled by default, supports a mock provider for safe validation, sanitizes payloads, excludes raw uploaded files/secrets/cookies/tokens/storage paths, and does not call external AI providers in this hito.

AI-1-MOCK-QA validated the mock advisory path locally with temporary process flags, typecheck, lint, build and guardrail smoke. Browser-authenticated visual QA with mock advisory visible remains optional/pending.

AI-1-MOCK-QA-BROWSER received user-attested local authenticated evidence: AI Advisory Notes appeared in report preview and PDF, PDF downloaded/opened, no raw JSON or `[object Object]` was visible, and no visible errors were reported.

AI-1.1-PROD adds guarded real-provider support for Gemini/OpenAI through server-side environment variables. Code-level provider integration is implemented, but production activation requires secure Hostinger env var configuration and authenticated smoke evidence. Full public launch remains NO.

AI-1.2 attempted Gemini production activation, but Codex did not have a Hostinger runtime-env configuration tool. Production activation remains pending until `AI_ADVISORY_*` vars and `GEMINI_API_KEY` are set securely in Hostinger and smoke-tested.

AI-1.2-PROD-GEMINI-SMOKE and the follow-up MCP activation attempt remained blocked because Google AI Studio / Gemini access, a secure Gemini API key path and Hostinger runtime env write access were not available to Codex. Hostinger config was not changed, OpenAI was not activated, and Gemini real preview/PDF smoke remains pending.

AI-1.3 production Gemini user-attested QA reported PASS for the main visual flow: AI Advisory appears in preview and PDF, scores remain visible, PDF downloads/opens, and no raw JSON, `[object Object]`, secrets or raw file content were visible. Full public launch remains NO.

ADMIN-1 adds the first Spanish internal admin console at `/dashboard/admin`: protected by the same product login and `ADMIN_EMAILS`, with operational summary, system health, Gemini status, safe config health, read-only users/assessments, audit placeholders and Spanish unlock-request administration. Full public launch remains NO.

ADMIN-2A improves the Spanish admin `IA y Consumo` panel without DB schema or migrations. It shows Gemini/provider status, safe credential booleans, memory metrics, recent in-memory AI events, operational alerts and honest placeholders for persistent tokens/costs in ADMIN-2B.

ADMIN-2B adds persistent AI usage metrics through `AiUsageEvent`, estimated tokens/costs, admin `GET /api/admin/ai/usage`, usage by user/assessment and AI error visibility in the Spanish admin console. It does not store prompts, raw responses, raw files, secrets or private storage paths.

ADMIN-2B-PROD-MIGRATION-SMOKE and USER-ATTESTED are superseded by DB-ACCESS-ADMIN-2B. `DATABASE_URL` was found in unversioned `.env.local`, validated against Neon `InfraShift` read-write compute metadata without printing the value, and `npm run prisma:deploy` applied `20260528103000_admin_2b_ai_usage_events`.

DB-ACCESS-ADMIN-2B confirms `AiUsageEvent` exists in production, safe count increased from `0` to `1` after a synthetic `admin_test` event, production no-session smoke passed, authenticated `/dashboard/admin` `IA y Consumo` rendered calls/tokens/costs/events/by-user/by-assessment without visible secret patterns, and full public launch remains NO.

ADMIN-3 adds internal Spanish admin controls for estimated AI budget, informative operating limits, manual entitlements, commercial opportunities, next-best-action tracking and advanced admin audit events. It adds only safe non-secret operational data and does not implement automatic billing, impersonation, hard delete, OpenAI activation or full public launch.

ADMIN-3-PROD-MIGRATION-SMOKE applied the ADMIN-3 migration in the production Neon database via `npm run prisma:deploy`, validated `SystemSetting`, `UserEntitlement`, `CommercialOpportunity`, `AuditEvent` and `AiUsageEvent` with safe counts, confirmed production public/private smoke, and completed authenticated admin smoke for budget, QA entitlement, QA commercial opportunity and audit visibility without exposing secrets. Full public launch remains NO.

ADMIN-4 adds runtime operational settings and enforcement without a new schema migration. Admin can control AI runtime mode (`env`, `disabled`, `mock`, `gemini`), budget blocking, PDF generation/downloads and assessment creation through non-secret `SystemSetting` overrides. AI/PDF/assessment enforcement returns safe fallbacks or Spanish block messages, records audit/usage events, and does not edit Hostinger env vars or secrets. Full public launch remains NO.

ADMIN-4-PROD-OPS-SMOKE received user-attested authenticated production evidence: admin console and operational settings load, AI runtime toggles `disabled`, `mock` and `env/gemini` work without crashes, audit records actions, no secrets are visible, and final production state is operational with AI `env/gemini`, PDF/download enabled and assessment creation enabled. Full public launch remains NO.

PRE-LAUNCH-1 completed full controlled beta acceptance hardening without new features: public production routes are healthy, private/admin routes redirect unauthenticated users, base validations pass, public HTML does not expose secret/error patterns, ADMIN-4 authenticated evidence is accepted, QA/demo data was reviewed without deletion, and launch docs were updated. Controlled beta is accepted; full public launch remains NO.

QA-CLEANUP-ARCHIVE-1 reviewed QA/demo data without hard-delete: 25 QA/demo assessments, 14 `safe to delete` assessments, 2 synthetic assessments, 1 `internal_qa` entitlement, 1 QA opportunity, 1 `admin_test` AI usage event and 31 QA-associated reports were inventoried. No production data was deleted or modified. Full public launch remains NO.

PUBLIC-LAUNCH-READINESS-2 completed final readiness review with user-attested authenticated user and admin smoke PASS. Public production routes are healthy, private/admin routes redirect unauthenticated users, Gemini/PDF/report preview are healthy in user flow, admin operational sections load, no secrets were visible, and settings are correct. Controlled beta and broader invited beta are approved; full public launch remains NO pending explicit owner/commercial launch decision.

LAUNCH-DECISION-1 formally approves broader invited beta for 3 to 10 controlled customers/MSPs/consultants with manual entitlements, supervised support, Gemini enabled, PDF/report flow enabled, manual payments only and no mass traffic or public checkout. Full public launch remains NO pending owner/commercial decision, support/SLA, QA/demo filtering/archive and final public launch checklist.

MANUAL-FINAL-v1.2 creates the final internal operational and functional manual for broader invited beta. It documents customer flow, admin flow, Gemini/PDF/report operations, runtime controls, entitlements, budgets, opportunities, incident handling, manual payments and full public launch criteria. The source of truth is `docs/shiftreadiness-functional-operational-manual-v1-2-broader-invited-beta.md`. Full public launch remains NO.

LOCAL-GEMINI-1 adds a safe local Gemini smoke workflow. Local `.env.local` now carries the developer-only Gemini config outside Git, `npm run ai:smoke-local-gemini` validates the real Gemini provider without printing keys or responses, and local route smoke passes. The strict synthetic PDF generator still needs hardening before it returns `providerStatus=success` locally.

FUNCTIONAL-READINESS-1B closes the fresh authenticated smoke gap by user-attested evidence. User flow PASS: dashboard, assessments, Context Intake, report preview, Gemini Advisory, deterministic scores, PDF generation/download/open, AI Advisory in PDF, no raw JSON, no `[object Object]`, no visible secrets/storage paths. Admin flow PASS: `/dashboard/admin`, Estado del Sistema, Usuarios, Evaluaciones, IA y Consumo, Accesos y Planes, Oportunidades, Configuracion Operativa and Auditoria load; Gemini appears active/runtime env-gemini and AI usage/consumption state is visible. Localhost PASS and `npm run ai:smoke-local-gemini` returns `providerStatus=success` with `gemini-flash-lite-latest`. Full public launch remains NO.

UX-HARDENING-1 applies a pre-real-use UX/accessibility polish pass without new features: source CSS no longer uses `transition: all` or `outline: none`, focus-visible states are explicit, public `alert()` calls were replaced by inline status messages, key success/error banners now expose basic ARIA roles, admin microcopy remains Spanish, and dangerous migration/full-launch claims remain controlled. Full public launch remains NO.

DEMO-1 adds the public `/demo` Migration Readiness Replay: a fully simulated, synthetic, no-login walkthrough showing how a VMware/RVTools-style export becomes a Proxmox readiness decision pack. It uses no backend, no DB, no Gemini call, no real upload and no customer data. CTAs were added from home and `/shiftreadiness`; full public launch remains NO.

DEMO-1.1 completes visual QA and conversion polish for `/demo`: mobile layout was tightened, long technical strings now wrap safely, the sound control is clarified as visual-only, and public marketing copy was adjusted away from execution/cutover language. Production `/demo` remains healthy; full public launch remains NO.

SAMPLE-REPORT-1 adds the public `/sample-report` foundation: a synthetic Northbridge sample readiness report page showing the expected deliverable structure, executive summary, scores, evidence matrix, top risks, VM classification, migration waves, Proxmox sizing and AI Advisory notes. SAMPLE-REPORT-2 adds the downloadable synthetic PDF at `/sample-reports/proxmox-migration-readiness-sample-report.pdf`. The public sample has no backend, DB, Gemini call, upload, lead capture or real customer data. Full public launch remains NO.

SAMPLE-REPORT-2 adds a public synthetic downloadable PDF at `/sample-reports/proxmox-migration-readiness-sample-report.pdf`. The PDF is generated from local synthetic Northbridge data via `npm run sample-report:generate`, has 15 pages, uses no backend, DB, Gemini call or customer data, and is linked from `/sample-report`. Full public launch remains NO.

SAMPLE-REPORT-2.1 completes visual PDF QA and marketing polish: the 15-page PDF was rendered locally for review, `/sample-report` mobile overflow was corrected, and the PDF generator now normalizes non-sensitive metadata so regenerated output is reproducible. Full public launch remains NO.

SALES-PAGE-1 adds a standalone VMware -> Proxmox readiness offer page at `/vmware-to-proxmox-readiness`. It is linked only from `/demo` and `/sample-report`, does not modify home, global navigation or `/shiftreadiness`, uses no backend/DB/Gemini/customer data, and keeps checkout, automatic billing and full public launch disabled.

SALES-PAGE-1.1 completes visual QA and conversion polish for `/vmware-to-proxmox-readiness`: desktop/mobile screenshots were reviewed, pricing copy was tightened around manual beta access, and the hero now states the offer is a planning assessment, not migration execution. Full public launch remains NO.

EVIDENCE-7 adds the separate premium Migration Recommendation Plan deliverable. It uses parsed evidence, deterministic gates and plan levels to produce a light print-friendly PDF through existing private report history; AI narrative remains deterministic fallback only and cannot override gates. Full public launch remains NO.

## Stack
- Next.js App Router
- React 19
- TypeScript
- CSS global existing from the original landing
- Prisma + Neon Postgres
- Better Auth

## Public routes
- `/`
- `/shiftreadiness`
- `/demo`
- `/sample-report`
- `/vmware-to-proxmox-readiness`
- `/contact`

## Auth routes
- `/sign-in`
- `/sign-up`
- `/forgot-password`
- `/reset-password`

## Private routes
- `/dashboard`
- `/dashboard/assessments`
- `/dashboard/assessments/new`
- `/dashboard/assessments/[id]`

## Current assessment capabilities
- Persistent multi-assessment workspace.
- Manual infrastructure intake.
- Cost / Risk assumptions.
- Adaptive Migration Context Intake with partial save, unknown/not applicable/skip states and coverage scoring.
- Private evidence upload and secure download.
- RVTools parser and inventory/risk scoring.
- Report preview and PDF generation.
- Optional AI Advisory Notes architecture with Gemini real provider support and safe fallback.
- Manual admin unlock/entitlement flow.
- Spanish internal admin console at `/dashboard/admin` for operational status, AI health, users and assessments.
- AI consumption panel with memory metrics plus persistent estimated tokens/costs by user and assessment.
- Admin budgets, manual entitlements, commercial opportunities and advanced audit events.
- Runtime operational settings and basic enforcement for AI, PDF/report downloads and assessment creation.
- Public synthetic Migration Readiness Replay at `/demo`.
- Public synthetic sample readiness report page at `/sample-report`.
- Public synthetic sample PDF at `/sample-reports/proxmox-migration-readiness-sample-report.pdf`.
- Standalone VMware -> Proxmox readiness offer page at `/vmware-to-proxmox-readiness`, linked only from `/demo` and `/sample-report`.
- Separate premium Migration Recommendation Plan PDF with deterministic evidence gates and admin visibility.

## Scripts
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`
- `npm run prisma:validate`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:deploy`
- `npm run prisma:studio`
- `npm run deploy:check`
- `npm run storage:check`
- `npm run ai:guardrails`
- `npm run sample-report:generate`

## Environment variables
Required:
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `HOSTINGER_STORAGE_ROOT`
- `MAX_UPLOAD_SIZE_MB`
- `ADMIN_EMAILS`

Optional for future work:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `AI_ADVISORY_ENABLED`
- `AI_ADVISORY_PROVIDER`
- `AI_ADVISORY_MODEL`
- `AI_ADVISORY_TIMEOUT_MS`
- `AI_ADVISORY_MAX_INPUT_CHARS`
- `AI_ADVISORY_MAX_OUTPUT_CHARS`
- `GEMINI_API_KEY`
- `OPENAI_API_KEY`

## Prisma
- Schema: `prisma/schema.prisma`
- Better Auth schema is generated into Prisma format.
- Use `npm run prisma:validate` before migrations.

## Notes
- The landing page and `/shiftreadiness` are preserved.
- The dashboard and assessment shell are foundation work for the next milestone.
- RVTools evidence upload, secure local storage, secure download and basic RVTools parsing are implemented.
- The parser is preliminary and stores inventory rows plus a summary.
- Inventory-driven cost/risk findings, readiness scores and the VM risk matrix are implemented as preliminary signals.
- Report Preview, locked sections and upgrade intent tracking are implemented as preview UX only.
- PDF Preview v1 is implemented with private storage and secure download.
- Manual unlock requests, protected admin review and entitlement grants are implemented without checkout.
- Admin unlock hardening validates `ADMIN_EMAILS`, fail-closed behavior, non-admin blocking and entitlement idempotency.
- Password recovery/account support is implemented in code with hashed reset tokens and one-time use; production recovery is operational by user-attested mailbox/token validation.
- Antigravity post-landing UX/UI changes are accepted for limited public beta after Codex audit; admin read access to assessment/report pages is now explicit for admin users, while write actions remain ownership-scoped.
- PUBLIC-BETA-OPS-3 did not create or delete QA production data; full public launch remains blocked until Hostinger logs, authenticated browser QA and product-flow replay are captured.
- Hostinger deployment hardening adds runtime env checks, storage permission checks, `prisma:deploy`, Node engine guidance and production smoke runbooks.
- Hostinger production smoke is prepared but still requires real Hostinger access, production domain, runtime logs and storage validation before it can be marked OK.
- Hito 9.2 remains gated until the Hostinger Production Access Gate is completed with real access details.
- Pricing checkout is not implemented yet.

## Documentation
- `docs/hito-ai-ops-1-gemini-runtime-monitoring-fallback.md`
- `docs/hito-ai-report-1-full-synthetic-gemini-readiness-report.md`
- `docs/hito-ai-report-1b-full-synthetic-gemini-success-report.md`
- `docs/hito-admin-1-spanish-admin-console-foundation.md`
- `docs/hito-admin-2a-ai-consumption-panel-no-db.md`
- `docs/hito-admin-2b-persistent-ai-usage-cost-audit.md`
- `docs/hito-admin-2b-prod-migration-smoke.md`
- `docs/hito-admin-2b-prod-migration-user-attested.md`
- `docs/hito-admin-3-budgets-entitlements-opportunities.md`
- `docs/hito-admin-3-prod-migration-smoke.md`
- `docs/hito-admin-4-runtime-settings-enforcement-commercial-hardening.md`
- `docs/hito-admin-4-prod-ops-smoke.md`
- `docs/hito-pre-launch-1-full-controlled-beta-acceptance.md`
- `docs/hito-qa-cleanup-archive-1.md`
- `docs/hito-public-launch-readiness-2.md`
- `docs/hito-launch-decision-1-broader-invited-beta.md`
- `docs/hito-demo-0-readiness-replay-audit-plan.md`
- `docs/hito-demo-1-migration-readiness-replay.md`
- `docs/hito-sample-report-1-public-sample-report-foundation.md`
- `docs/hito-sample-report-2-public-synthetic-pdf.md`
- `docs/hito-sample-report-2-1-visual-pdf-qa.md`
- `docs/shiftreadiness-functional-operational-manual-v1-2-broader-invited-beta.md`
- `docs/hito-1-technical-foundation.md`
- `docs/hito-1-1-stabilization-neon-auth-smoke-test.md`
- `docs/hito-2-assessment-crud-manual-intake-cost-risk.md`
- `docs/hito-3-rvtools-upload-secure-local-storage.md`
- `docs/assessment-crud-v1.md`
- `docs/manual-infrastructure-intake-v1.md`
- `docs/cost-risk-assumptions-v1.md`
- `docs/preliminary-risk-scoring-v1.md`
- `docs/storage-readiness-optional-v1.md`
- `docs/evidence-file-model-v1.md`
- `docs/local-storage-security-v1.md`
- `docs/evidence-upload-flow-v1.md`
- `docs/evidence-7-migration-recommendation-plan.md`
- `docs/secure-download-delete-v1.md`
- `docs/hostinger-storage-runbook-v1.md`
- `docs/hito-4-rvtools-parser-basic-inventory.md`
- `docs/rvtools-parser-architecture-v1.md`
- `docs/parsed-inventory-data-model-v1.md`
- `docs/rvtools-sheet-column-mapping-v1.md`
- `docs/parser-error-handling-v1.md`
- `docs/inventory-ui-v1.md`
- `docs/hito-5-inventory-driven-cost-risk-vm-risk-matrix.md`
- `docs/risk-findings-engine-v1.md`
- `docs/vm-risk-matrix-v1.md`
- `docs/readiness-confidence-scoring-v1.md`
- `docs/inventory-driven-cost-risk-v1.md`
- `docs/locked-insights-upgrade-hooks-v1.md`
- `docs/hito-6-report-preview-locked-sections-upgrade-ux.md`
- `docs/report-preview-v1.md`
- `docs/report-sections-visibility-v1.md`
- `docs/upgrade-ux-v1.md`
- `docs/report-entitlements-v1.md`
- `docs/upgrade-events-v1.md`
- `docs/hito-7-pdf-report-generation-v1.md`
- `docs/report-generation-service-v1.md`
- `docs/pdf-report-template-v1.md`
- `docs/report-storage-download-v1.md`
- `docs/report-status-lifecycle-v1.md`
- `docs/pdf-limitations-v1.md`
- `docs/hito-8-manual-payment-unlock-flow.md`
- `docs/hito-8-1-admin-unlock-hardening.md`
- `docs/hito-9-hostinger-deployment-hardening.md`
- `docs/hito-9-1-production-smoke-hostinger.md`
- `docs/unlock-request-model-v1.md`
- `docs/manual-unlock-admin-v1.md`
- `docs/entitlements-unlock-flow-v1.md`
- `docs/admin-emails-configuration-runbook.md`
- `docs/admin-unlock-smoke-test-results.md`
- `docs/unlock-idempotency-checks-v1.md`
- `docs/hostinger-deployment-runbook-v1.md`
- `docs/hostinger-env-vars-v1.md`
- `docs/hostinger-storage-persistence-v1.md`
- `docs/prisma-neon-production-migrations-v1.md`
- `docs/production-smoke-test-checklist-v1.md`
- `docs/hostinger-production-smoke-results.md`
- `docs/hostinger-runtime-logs-review.md`
- `docs/hostinger-storage-live-validation.md`
- `docs/hostinger-auth-domain-validation.md`
- `docs/hostinger-post-deploy-rollback-notes.md`
- `docs/hostinger-production-access-gate.md`
- `docs/hostinger-rollback-runbook-v1.md`
- `docs/production-runtime-hardening-v1.md`
- `docs/commercial-status-v1.md`
- `docs/report-unlock-behavior-v1.md`
- `docs/migration-vite-to-next-notes.md`
- `docs/auth-dashboard-assessment-shell.md`
- `docs/auth-smoke-test-results.md`
- `docs/assessment-shell-smoke-test-results.md`
- `docs/data-model-v1.md`
- `docs/neon-prisma-migration-runbook.md`
- `docs/preserved-public-pages-hito-1.md`
- `docs/public-pages-smoke-test-hito-1-1.md`
- `docs/hostinger-foundation-notes.md`
- `docs/hito-ux-audit-1-antigravity-post-landing-review.md`
- `docs/public-beta-ops-3-authenticated-browser-qa-evidence.md`
- `docs/shiftreadiness-functional-operational-manual-v1-1-limited-public-beta.md`
- `docs/manuals-index.md`
- `docs/public-beta-ops-3a-user-attested-browser-logs-evidence.md`
- `docs/public-beta-ops-4-manual-browser-qa-logs-evidence.md`
- `docs/shiftreadiness-functional-operational-manual-v1-2-broader-invited-beta.md`

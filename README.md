# Shift Evidence / ShiftReadiness

Shift Evidence is the public brand. ShiftReadiness is the first product module.

Tagline:
Infrastructure readiness before you migrate.

Status:
Controlled production launch active; public launch pending password recovery provider smoke, logs review and QA cleanup. AUTH-1 password recovery migration is applied and deployed, with manual fallback active.

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
- Password recovery/account support is implemented in code with hashed reset tokens, one-time use and manual fallback; production use requires controlled migration/deploy and provider smoke.
- Hostinger deployment hardening adds runtime env checks, storage permission checks, `prisma:deploy`, Node engine guidance and production smoke runbooks.
- Hostinger production smoke is prepared but still requires real Hostinger access, production domain, runtime logs and storage validation before it can be marked OK.
- Hito 9.2 remains gated until the Hostinger Production Access Gate is completed with real access details.
- Pricing checkout is not implemented yet.

## Documentation
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

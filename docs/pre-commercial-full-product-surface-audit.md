# Pre-Commercial Full Product Surface Audit

Date: 2026-06-02

Scope: Shift Evidence / ShiftReadiness full product surface audit and
preservation baseline before commercial, landing, pricing, report-quality or
admin-ops changes.

This audit is intentionally non-implementing. No product code, copy, routes,
pricing, billing behavior, Prisma schema, migrations, database data, Hostinger,
Vercel, environment variables, storage or payment systems were modified.

## 1. Executive Summary

Shift Evidence / ShiftReadiness currently has a broad, coherent controlled-sales
surface: public landing pages, a two-lane demo funnel, pricing, sample report,
Stripe/Wise billing foundation, private dashboard, admin operations, evidence
expansion, storage/licensing/context modules, Senior Advisor and PDF/report
generation.

The most important preservation finding is that the quick demo replay and the
deep Demo Workspace now coexist correctly:

- `/demo` is a hub.
- `/demo/replay` is the quick Migration Readiness Replay.
- `/demo/workspace` is the deep read-only Demo Workspace.
- `/demo/reports/[scenario]` serves synthetic demo PDFs.

Production smoke confirms the central public routes render and the demo funnel
is live. The codebase also validates locally with typecheck, lint, build and
full unit suite.

The main pre-commercial risk is not a missing core feature. It is commercial
clarity: the product surface is rich, but some copy/docs still reflect older
manual-entitlement or pre-billing states while current code includes Stripe
checkout routes and Wise/manual invoice requests. That should be cleaned up in a
dedicated commercial copy hardening hito, without removing existing content.

## 2. General State

Overall state:

- Product base: strong controlled-beta platform.
- Demo funnel: production-ready for controlled sales demos.
- Billing: Stripe + Wise/manual invoice foundation present; controlled payment
  readiness requires careful copy and live-payment gates.
- Report/PDF quality: broad content coverage, needs premium visual/polish pass.
- Admin: operationally rich, Spanish/English mixed, needs internal ops polish.
- Full public launch: not declared and not recommended yet.

## 3. Git Baseline

Worktree used:

`C:\Users\diego\OneDrive\PERSONAL\INFRASHIFT\infrashift-demo-funnel-2`

Branch:

`feature/demo-funnel-2`

HEAD:

`026848b6d4e3407116ae79c0476ec215712c613b`

Recent commits:

- `026848b docs: record demo funnel production smoke`
- `06d40d5 docs: update demo funnel post-push smoke`
- `2831a3d docs: record demo funnel checksum QA`
- `e99cb6a test: lock evidence artifact line endings`
- `7558efc feat: restore demo replay and workspace navigation`
- `0880c4b docs: document Stripe and Wise billing model`
- `722b671 feat: update admin billing provider console`
- `adf816e feat: add Wise bank transfer invoice flow`
- `1a0a4be feat: add Stripe and Wise billing model`
- `c75eef1 refactor: remove Lemon payment provider`

Versioned files:

- `980`

## 4. Working Tree And Stash Status

Initial working tree:

- clean before this audit document.

Stashes:

- multiple billing/Prisma/demo-preservation stashes remain preserved.
- none were applied.
- none were modified.

No local billing/Prisma WIP, logos, env files or untracked product assets were
mixed into this audit.

## 5. Validations Executed

Passed:

- `npm run typecheck`
- `npm run lint`
- `npx prisma validate` with local placeholder `DATABASE_URL`
- `npx prisma generate`
- `npm run build` with local placeholder env
- `npm run test:run` after rerun: 114 files / 580 tests passed

Build warning:

- Known Turbopack/NFT warning through
  `src/server/evidence/localStorageService.ts` and the private file download
  route. Non-blocking in this audit.

Tooling note:

- One first `npm run test:run` attempt failed because it was run in parallel
  with `npm run build`, and `prisma generate` rewrote the local Prisma client
  while Vitest imported it. Rerunning tests alone passed. This is local tooling
  interference, not a product regression.

Not executed:

- `npx prisma migrate status`.

Reason:

- This audit explicitly does not touch the database. Running migrate status
  against a real `DATABASE_URL` would connect to a DB, while running it against a
  placeholder URL would be meaningless.

## 6. Route Map

| Route | Exists in code | Expected render | Local smoke | Production smoke | Recommendation |
|---|---:|---|---|---|---|
| `/` | yes | public landing | 200 | 200 | conserve, improve commercial clarity |
| `/shiftreadiness` | yes | public product page | 200 | 200 | conserve, improve CTA priority |
| `/vmware-to-proxmox-readiness` | yes | public offer page | 200 | 200 | conserve, improve conversion copy |
| `/demo` | yes | public demo hub | 200 | 200 | protect |
| `/demo/replay` | yes | quick simulation | 200 | 200 | protect |
| `/demo/workspace` | yes | deep read-only workspace | 200 | 200 | protect |
| `/demo/reports/[scenario]` | yes | synthetic PDF route | 200 PDF | 200 PDF | protect |
| `/sample-report` | yes | public sample report page | 200 | 200 | protect, improve visual proof |
| `/pricing` | yes | public pricing | 200 | 200 | protect, harden billing copy |
| `/partners` | yes | public partner/MSP page | 200 | 200 | conserve |
| `/support` | yes | public support page | 200 | 200 | conserve, link ops model |
| `/security` | yes | public trust/security page | 200 | 200 | conserve |
| `/how-it-works` | no | not present | not applicable | not applicable | optional future route only |
| `/start` | no | not present | not applicable | not applicable | optional future route only |
| `/sign-in` | yes | public auth | 200 | 200 | protect |
| `/sign-up` | yes | public auth | 200 | 200 | protect |
| `/forgot-password` | yes | public auth support | 200 | 200 | protect |
| `/reset-password` | yes | token-dependent auth support | 200 local | not separately tested | protect |
| `/dashboard` | yes | private redirect without session | redirect to `/sign-in` | redirect to `/sign-in` | protect |
| `/dashboard/assessments` | yes | private redirect without session | redirect to `/sign-in` | not separately tested | protect |
| `/dashboard/admin` | yes | admin-only redirect without session | redirect to `/sign-in` | redirect to `/sign-in` | protect |
| `/dashboard/admin/billing` | yes | admin-only redirect without session | redirect to `/sign-in` | not separately tested | protect |
| `/billing/checkout/[plan]` | yes | Stripe checkout status/start surface | 200 | 200 | preserve, clarify gated/live state |
| `/billing/bank-transfer/[plan]` | yes | Wise/manual invoice request | 200 | 200 | preserve, clarify manual invoice |
| `/api/webhooks/stripe` | yes | API webhook | API | API | protect, audit config before live |
| `/api/admin/*` | yes | admin APIs | private/API | not directly tested | protect |
| `/api/assessments/*/reports/*` | yes | private report APIs | private/API | not directly tested | protect |

## 7. Demo Funnel Audit

Status:

- OK.

`/demo`:

- works as a hub.
- offers two explicit paths:
  - quick simulation.
  - deep Demo Workspace.
- explains that both are synthetic and require no production access.

`/demo/replay`:

- preserves Migration Readiness Replay.
- positioned around a fast simulation.
- contains a CTA to the full Demo Workspace.

`/demo/workspace`:

- preserves the deep read-only workspace.
- includes cross-link back to the quick replay.
- demonstrates evidence, scores, scenario detail, report depth and demo PDFs.

Demo reports:

- `/demo/reports/balanced-mid-market` returns `application/pdf`.
- demo PDF route remains dynamic through `[scenario]`.

Visibility:

- quick replay is visible from Home.
- quick replay is visible from `/shiftreadiness`.
- quick replay is visible from `/vmware-to-proxmox-readiness`.
- quick replay is visible from `/sample-report`.
- pricing currently prioritizes sample workspace rather than replay. This is
  acceptable but can be improved with a secondary replay link.

Risk:

- Low. The quick demo is no longer replaced by workspace.

Recommendation:

- Preserve both paths.
- In future commercial polish, ensure every major page has a clear "Watch
  90-second simulation" option plus a deeper "Explore Demo Workspace" option.

## 8. Landing / Commercial Positioning Audit

Audited surfaces:

- `/`
- `/shiftreadiness`
- `/vmware-to-proxmox-readiness`
- `/pricing`
- `/sample-report`
- `/partners`
- `/support`

Strengths:

- evidence-based positioning is strong.
- no mandatory credentials/no production access message is present across the
  product.
- storage, licensing, Senior Advisor, Project Memory and report outputs are
  visible.
- demo and sample report are now central.

Risks:

- The Home surface is very feature-rich and can feel dense for first-time
  commercial visitors.
- Some sections are more product-complete than commercially sequenced.
- Technical audience is served well, but conversion path can be tightened:
  demo -> sample -> pricing -> checkout/invoice.
- Some docs and older route copy still say "checkout not active" while current
  code has Stripe/Wise surfaces. This needs consistency hardening.

Recommendation:

- Next hito should harden commercial sequencing, not remove sections.
- Keep technical/senior tone. Do not pivot entirely to CFO/CIO messaging.

## 9. Pricing Audit

Current pricing source:

- `src/config/billing.ts`
- `src/lib/pricingPlans.ts`
- `src/app/pricing/page.tsx`

Expected prices confirmed:

- Starter Readiness: `USD 490`
- Professional Assessment: `USD 1,500`
- Migration Blueprint: `From USD 3,500`
- MSP Partner: `From USD 399/month`

Billing path:

- card checkout routes exist for configured fast-start plans.
- bank transfer/manual invoice routes exist for business purchasing.

Risks:

- Pricing copy must be explicit that Wise is a manual invoice/bank transfer
  request, not automated Wise checkout.
- Stripe live-payment state must remain gated by configuration and approval.
- Avoid copy that implies guaranteed instant fulfillment unless the entitlement
  path is validated for that plan.

Recommendation:

- Preserve prices and plan structure.
- Run a pricing-copy hardening hito to align plan promises with entitlement,
  checkout and manual invoice behavior.

## 10. Billing Stripe / Wise Audit

Current state:

- Stripe is present as card checkout provider.
- Wise/manual invoice is present as manual bank transfer request flow.
- Billing admin console exists at `/dashboard/admin/billing`.
- Stripe webhook route exists at `/api/webhooks/stripe`.
- Billing models exist in Prisma including `BillingOrder`,
  `BillingInvoiceRequest`, `BillingPayment` and entitlement grants.

Lemon state:

- Lemon appears in historical docs, removal docs and legacy enum/schema context.
- No active public Lemon checkout route was found in `src/app`.
- No public UI should reintroduce Lemon as an active provider.

Risks:

- Some older docs still describe "no checkout" states from pre-pivot milestones.
- Schema enum contains historical `lemon_squeezy`. This may be acceptable for
  historical compatibility, but should not be surfaced publicly.
- Admin actions include powerful fulfillment/match surfaces and need careful
  Spanish warnings/confirmations before broader operator use.

Recommendation:

- Keep Stripe/Wise foundation.
- Do not remove historical billing docs yet.
- Add a billing-current-state doc or update docs index in a later hito to reduce
  confusion.

## 11. PDF / Report Quality Audit

Relevant code/docs:

- `src/server/reports/reportPdfRenderer.ts`
- `src/app/demo/reports/[scenario]/route.ts`
- `src/components/sample-report/SampleReportPage.tsx`
- `docs/sample-premium-readiness-report.md`
- report preview routes under `/dashboard/assessments/[id]/report`

Coverage present:

- cover/report branding.
- executive summary.
- readiness/evidence confidence.
- VM risk matrix.
- storage destination readiness.
- licensing & cost exposure.
- business continuity risk.
- migration recommendation plan.
- Senior Advisor / AI advisory examples.
- Project Memory concepts.
- assumptions/disclaimers.

Commercial quality assessment:

- Content depth is strong enough to justify Professional/Migration Blueprint
  direction.
- Visual premium polish should be improved before aggressive commercial use.
- Public sample report page is good, but the PDF/report system deserves a
  dedicated premium QA pass for visual hierarchy, page breaks, density and
  "would I pay USD 1,500+" impression.

Recommendation:

- Do not regenerate PDFs in this audit.
- Run `REPORT-QUALITY-1` after commercial copy hardening.

## 12. Sample Report Strategy Audit

Status:

- `/sample-report` exists and renders.
- public PDF/sample surfaces exist.
- demo workspace and replay CTAs are connected.
- sample report content exposes the premium deliverable structure.

Risk:

- The sample page is rich, but a buyer may need a clearer "this is what you get
  for Professional" bridge from pricing.

Recommendation:

- Preserve sample report route and PDF.
- Add future commercial polish linking plan tiers to exact report sections.

## 13. Admin Spanish / Operations Audit

Admin routes:

- `/dashboard/admin`
- `/dashboard/admin/billing`
- `/dashboard/admin/pricing`
- `/dashboard/admin/unlock-requests`
- `/api/admin/*`

Admin areas found:

- users.
- assessments.
- entitlements/access plans.
- opportunities.
- AI usage.
- audit events.
- runtime/settings.
- billing orders.
- Stripe diagnostics.
- invoice requests.
- manual fulfillment/matching.

Language:

- Admin is mixed Spanish/English.
- Core labels like "Invoice enviado" and "No hay solicitudes..." are Spanish,
  while provider/status/checkout terminology is mixed.

Operational risks:

- Billing/admin actions are powerful and should have Spanish operator warnings.
- Fulfillment/match/payment states should visually separate read-only review
  from irreversible/manual grant actions.
- Filters/search/pagination should be reviewed before frequent internal use.

Recommendation:

- Preserve admin.
- Run `ADMIN-OPS-ES-1` for Spanish copy, warnings, status lights and safe action
  UX. Do not do this in the commercial copy hito.

## 14. Language Consistency Audit

Rule:

- Public commercial: English.
- Internal admin: Spanish.

Findings:

- Public pages are mostly English.
- Admin remains mixed.
- Docs are mixed Spanish/English, acceptable historically but confusing for
  operational handoff.

Recommendation:

- Do not bulk-translate.
- Translate admin/operator surfaces in a dedicated hito.
- Keep public commercial copy in English.

## 15. Claims / Credibility Audit

Search terms included:

- guaranteed migration.
- zero downtime.
- fully automated migration.
- no risk.
- 100% accurate.
- complete diagnosis.
- replace consultant.
- production safe.

Result:

- Public/product code mentions "zero downtime" mainly as a negative boundary:
  "does not guarantee zero downtime".
- Advisor prompts explicitly forbid automatic migration, zero downtime,
  guaranteed savings and production safety claims.
- Methodology KB includes forbidden examples for evaluation.

No critical dangerous public claim was found in the audited routes.

Risk:

- Some docs include dangerous phrases as negative examples; future search audits
  should distinguish negative guardrails from active claims.

Recommendation:

- Preserve conservative boundaries.
- When polishing public copy, keep "readiness before migration" and avoid
  "migration automation" framing.

## 16. Content Preservation Baseline

| Protected block | File/route | Why it matters | State | Risk | Preservation recommendation |
|---|---|---|---|---|---|
| Hero principal | `src/components/Hero.tsx`, `/` | primary commercial entry | present | medium density | preserve, polish sequencing only |
| Quick demo replay | `/demo/replay`, `MigrationReadinessReplay.tsx` | fast buyer comprehension | present/live | low | protect |
| Demo hub | `/demo`, `DemoHubPage.tsx` | chooser between quick/deep demo | present/live | low | protect |
| Demo Workspace | `/demo/workspace`, `DemoWorkspacePage.tsx` | depth/proof | present/live | low | protect |
| Demo PDFs | `/demo/reports/[scenario]` | downloadable proof | present/live | low | protect |
| Sample report | `/sample-report` | premium output proof | present/live | medium polish | protect |
| Pricing | `/pricing`, billing config | commercial conversion | present/live | medium copy | protect |
| Partners/MSP | `/partners` | channel sales | present/live | low | preserve |
| Security/trust | `/security` | trust boundary | present/live | low | preserve |
| Stripe checkout | `/billing/checkout/[plan]` | card payment path | present | medium gating | preserve, clarify |
| Wise manual invoice | `/billing/bank-transfer/[plan]` | business purchasing path | present | medium operator QA | preserve, clarify |
| Admin billing | `/dashboard/admin/billing` | ops control | present | high action safety | preserve, polish |
| PDF generator | `reportPdfRenderer.ts` | paid deliverable | present | medium polish | preserve |
| Senior Advisor | `SeniorMigrationAdvisorPanel`, advisor services | premium technical guidance | present | medium entitlement/copy | preserve |
| Evidence Expansion | `EvidenceExpansionCenter`, collectors/templates | confidence/proof | present | low | preserve |
| Migration Plan | report and evidence docs | premium planning | present | medium QA | preserve |
| Storage Readiness | storage panel/services | differentiator | present | medium release state | preserve |
| Licensing & Cost | licensing panel/services | business value | present | medium claims | preserve |
| Business Continuity Risk | report/risk modules | risk language | present | low | preserve |
| Customer Context | context panel/services | advisory nuance | present | low | preserve |
| Project Memory | advisor memory panel/services | premium governance | present | medium ops clarity | preserve |

## 17. CTA / Link Graph

Desired funnel:

Home / landing -> quick simulation -> deep workspace -> sample report -> pricing
-> Stripe checkout or Wise manual invoice request -> admin visibility and manual
ops.

Observed:

- Home links to quick simulation and Demo Workspace.
- `/shiftreadiness` links to quick simulation and sample/deep demo.
- `/vmware-to-proxmox-readiness` links to 90-second simulation and sample
  assessment.
- `/sample-report` links to replay/workspace and pricing path.
- `/pricing` links to Demo Workspace and billing routes.
- `/partners` links to MSP plan/invoice path.
- dashboard/private routes redirect without session.

Risk:

- Pricing could expose both "Watch quick simulation" and "Explore sample
  assessment" more clearly.
- Some report/private dashboard CTAs still say checkout/billing not active in
  older contexts; reconcile with current Stripe/Wise foundation.

Recommendation:

- Do not remove CTAs.
- In `COMMERCIAL-1`, tighten CTA hierarchy and copy consistency.

## 18. Existing Docs And Risks

Docs are extensive and valuable, but there are historical contradictions because
the product evolved from manual entitlement/no-checkout to Stripe/Wise billing
foundation.

Current useful docs include:

- demo funnel docs.
- billing Stripe/Wise docs.
- Lemon removal docs.
- PDF/sample report docs.
- evidence expansion docs.
- storage/licensing/advisor/project memory docs.
- production readiness docs.

Risks:

- Older docs still say no checkout/payment implementation.
- Some docs mention Lemon in historical contexts.
- Some docs mark work pending that has since advanced.
- Docs index may confuse future operators unless "current commercial state" is
  promoted above historical milestone docs.

Recommendation:

- Do not delete historical docs.
- Add/update an index or "current operating state" doc in a future hito.

## 19. Findings

### PC-AUDIT-001

- Area: Demo funnel
- Severity: Low
- Type: conservar
- File/route: `/demo`, `/demo/replay`, `/demo/workspace`
- Description: Quick replay and deep workspace coexist and are production-live.
- Impact: Positive commercial foundation.
- Recommendation: Preserve both; do not collapse one into the other.
- Can change next hito without extra approval: no, preservation-sensitive.

### PC-AUDIT-002

- Area: Billing/docs consistency
- Severity: High
- Type: incoherente
- File/route: docs and public/private billing copy
- Description: Historical docs and some older private report/dashboard copy still
  describe no checkout/automatic billing while current code has Stripe checkout
  and Wise/manual invoice routes.
- Impact: Operators or commercial reviewers may misunderstand billing readiness.
- Recommendation: Create a current billing operating state doc and harden public
  copy without deleting historical docs.
- Can change next hito without extra approval: yes, if copy/docs only and no
  provider behavior changes.

### PC-AUDIT-003

- Area: Pricing
- Severity: Medium
- Type: mejorar
- File/route: `/pricing`, `src/config/billing.ts`, `src/lib/pricingPlans.ts`
- Description: Price points are correct, but copy must clearly distinguish card
  checkout from manual invoice request and live-payment gating.
- Impact: Avoids buyer/operator confusion.
- Recommendation: Pricing copy hardening in `COMMERCIAL-1`.
- Can change next hito without extra approval: yes, copy only.

### PC-AUDIT-004

- Area: Report/PDF quality
- Severity: Medium
- Type: mejorar
- File/route: `/sample-report`, PDF/report renderer
- Description: Report content coverage is broad, but premium visual polish should
  be validated against USD 1,500+ expectation.
- Impact: Sales confidence.
- Recommendation: Run `REPORT-QUALITY-1`.
- Can change next hito without extra approval: yes, if no data/model changes.

### PC-AUDIT-005

- Area: Admin operations
- Severity: High
- Type: riesgoso
- File/route: `/dashboard/admin`, `/dashboard/admin/billing`
- Description: Admin contains powerful billing, fulfillment and entitlement
  operations; language and warnings are mixed.
- Impact: Operator mistakes if used under pressure.
- Recommendation: Run `ADMIN-OPS-ES-1` for Spanish labels, warnings, status
  lights and safe-action UX.
- Can change next hito without extra approval: yes for copy/UX; no for behavior.

### PC-AUDIT-006

- Area: Public claims
- Severity: Low
- Type: conservar
- File/route: public pages, advisor prompts, docs
- Description: Dangerous claims appear primarily as negative boundary statements.
- Impact: Good credibility posture.
- Recommendation: Preserve conservative language.
- Can change next hito without extra approval: no for claim expansion.

### PC-AUDIT-007

- Area: Docs
- Severity: Medium
- Type: duplicado/incoherente
- File/route: `/docs`
- Description: Historical milestone docs are extensive but can obscure the
  current commercial baseline.
- Impact: Slower handoff and increased risk of reviving obsolete assumptions.
- Recommendation: Create a "current state first" docs index later.
- Can change next hito without extra approval: yes, docs only.

### PC-AUDIT-008

- Area: Tooling
- Severity: Low
- Type: riesgoso
- File/route: local validation workflow
- Description: Running build and tests in parallel can race on Prisma client
  generation.
- Impact: False negative tests.
- Recommendation: Run `npm run build` and `npm run test:run` sequentially.
- Can change next hito without extra approval: yes, docs/process only.

## 20. Critical Risks

No Critical product-surface risk was confirmed in this audit.

High risks:

- Billing commercial/docs consistency.
- Admin billing/manual fulfillment operator safety.

## 21. Quick Wins Proposed

No quick wins were implemented.

Suggested future quick wins:

- Add a current billing state banner in docs.
- Add pricing microcopy clarifying Stripe card checkout vs Wise manual invoice.
- Add stronger secondary CTA to quick replay from pricing.
- Add admin Spanish warnings for irreversible/manual actions.
- Improve sample report "what you get in Professional" bridge.

## 22. Changes Not Recommended

Do not:

- remove `/demo/replay`;
- replace replay with workspace;
- remove `/demo/workspace`;
- remove sample report/PDF;
- remove historical docs without archival plan;
- reintroduce Lemon;
- imply Wise automatic checkout;
- promise zero downtime, automatic migration or guaranteed savings;
- translate public commercial pages to Spanish as the main language;
- collapse admin/internal ops into public commercial flows.

## 23. Proposed Next Hitos

### HITO COMMERCIAL-1 - Landing / Positioning / Pricing Copy Hardening

Objective:

- Improve commercial sequencing and copy clarity while preserving all content.

Scope:

- `/`, `/shiftreadiness`, `/vmware-to-proxmox-readiness`, `/pricing`,
  `/sample-report`, `/partners`.

Risks:

- accidentally hiding deep technical value;
- overpromising billing/live payment state.

Likely files:

- `src/components/Hero.tsx`
- `src/views/ShiftReadinessPage.tsx`
- `src/app/vmware-to-proxmox-readiness/page.tsx`
- `src/app/pricing/page.tsx`
- `src/components/sample-report/SampleReportPage.tsx`
- `src/config/billing.ts`
- `src/lib/pricingPlans.ts`

Validations:

- typecheck, lint, tests, build, public route smoke.

Rollback point:

- current HEAD `026848b`.

Protected content:

- demo replay, workspace, sample report, pricing, Stripe/Wise foundation.

Do not touch:

- DB, migrations, payment behavior, env vars.

### HITO REPORT-QUALITY-1 - Premium PDF / Report Polish

Objective:

- Make sample and generated report output feel premium enough for Professional
  and Blueprint sales.

Scope:

- sample report page, sample PDF strategy, report renderer visual hierarchy.

Risks:

- breaking PDF generation or over-densifying output.

Likely files:

- `src/server/reports/reportPdfRenderer.ts`
- `src/components/sample-report/SampleReportPage.tsx`
- demo report route.

Validations:

- PDF generation QA, smoke PDF download/open, typecheck, build.

Rollback point:

- current report renderer state.

Protected content:

- all current report sections and disclaimers.

Do not touch:

- DB/payment/entitlements unless explicitly scoped.

### HITO ADMIN-OPS-ES-1 - Spanish Admin Operations Hardening

Objective:

- Make internal admin operations safer, clearer and Spanish-first.

Scope:

- admin dashboard, admin billing, unlock requests, entitlements, audit/status
  UI.

Risks:

- changing behavior instead of labels/warnings.

Likely files:

- `src/app/dashboard/admin/page.tsx`
- `src/app/dashboard/admin/billing/page.tsx`
- admin action files.

Validations:

- admin route smoke, typecheck, lint, tests.

Rollback point:

- current admin console.

Protected content:

- all existing admin sections and actions.

Do not touch:

- live payments, DB migrations, destructive actions.

### HITO CONTROLLED-SALES-SMOKE-1 - End-to-End Controlled Sales Smoke

Objective:

- Validate the funnel: demo -> sample -> pricing -> Stripe test-gated checkout
  or Wise manual invoice request -> admin visibility -> manual entitlement path.

Scope:

- public routes, billing routes, admin billing, entitlement/manual ops.

Risks:

- accidental real payment or entitlement grant.

Likely files:

- no code expected; QA/documentation hito unless bug found.

Validations:

- production/authenticated smoke, read-only reconciliation, no real payments.

Rollback point:

- no-code QA.

Protected content:

- Stripe/Wise separation and manual safety gates.

Do not touch:

- live payments, Wise transfers, DB destructive operations, env vars.

## 24. Recommended Execution Order

1. `COMMERCIAL-1`
2. `REPORT-QUALITY-1`
3. `ADMIN-OPS-ES-1`
4. `CONTROLLED-SALES-SMOKE-1`

If any critical production issue appears before `COMMERCIAL-1`, pause and run a
dedicated hotfix hito instead.

## 25. Estimated Percentages

- Platform base: 99.5%
- Demo funnel: 97-98%
- Billing readiness: 86-90%
- PDF/report quality: 82-88%
- Landing/pricing commercial readiness: 84-89%
- Admin internal ops readiness: 82-88%
- Overall controlled sales readiness: 88-92%
- Full public launch: NO

## 26. Final Verdict

Shift Evidence is ready for preservation-safe commercial hardening. The product
surface is broad and valuable; the next risk is not missing content but changing
too much without a clear preservation baseline.

Proceed with commercial copy and pricing hardening only after explicitly
preserving:

- quick demo replay;
- deep Demo Workspace;
- sample report/PDF;
- Stripe/Wise billing separation;
- admin manual operations;
- evidence-based conservative claims.

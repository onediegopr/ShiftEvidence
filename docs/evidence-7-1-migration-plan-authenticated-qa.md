# HITO EVIDENCE-7.1 - Migration Recommendation Plan Authenticated QA

Date: 2026-06-02
Status: partial authenticated/browser QA, automated QA complete
Scope: Migration Recommendation Plan generation behavior, PDF validation, entitlement checks, admin visibility review
Production impact: none
Hostinger touched: no
Billing touched: no
Landing touched: no
Public launch decision: unchanged, full public launch remains NO

## Objective

Validate the EVIDENCE-7 Migration Recommendation Plan flow after commit `58d7e85 feat: add migration recommendation plan`.

The hito focused on:

- User-facing plan panel behavior.
- Deterministic plan levels and gates.
- Separate PDF generation behavior.
- Report history/download/ownership constraints.
- Entitlement behavior.
- Admin visibility.
- Security and no-leak checks.
- Regression validations.

## Environment

- Environment: local development / production-like local.
- Branch: `main`.
- Initial HEAD: `58d7e8581596d76750b83522ee5f4505de3693fb`.
- Local app route smoke: `http://127.0.0.1:3000/sign-in` returned 200.
- Production touched: no.
- Database schema changed: no.
- Hostinger config changed: no.

Unrelated untracked files were preserved:

- `images/shift-evidence-logo-transparent-1024.png`
- `images/shift-evidence-logo-transparent-512.png`

## QA data

No real customer data was used.

Automated and PDF QA used synthetic `AssessmentDetail`-shape data covering:

- No RVTools/base inventory.
- RVTools-only / preliminary behavior.
- Partial technical evidence with Proxmox Target and Backup Evidence.
- Advanced synthetic evidence with VMware Enrichment, Proxmox Target, Backup Evidence, Storage/SAN and Application Dependency Mapping.

Generated non-versioned QA artifacts:

- `qa-artifacts/evidence-7-1/migration-recommendation-plan-synthetic.pdf`
- `qa-artifacts/evidence-7-1/migration-recommendation-plan-summary.json`
- `qa-artifacts/evidence-7-1/migration-recommendation-plan-text.txt`

These artifacts are intentionally not committed.

## Cases validated

### Case A - No RVTools/base inventory

Automated test result: pass.

Expected and observed:

- Plan level is `plan_not_available`.
- Base inventory gate fails.
- No advanced-plan claim is produced.
- UI logic can still render the plan object because gates and level are deterministic.

### Case B - RVTools/base assessment only

Automated coverage validates the preliminary path through the shared plan engine. Missing advanced evidence is represented as insufficient evidence / warnings, not hidden.

Expected and observed:

- Missing Backup, Proxmox Target, Storage/SAN and Application Dependency evidence limit the plan.
- The plan does not recommend strong production migration.

### Case C - Partial technical evidence

Automated test result: pass.

Input:

- Parsed RVTools inventory.
- Proxmox Target evidence.
- Backup Evidence.

Expected and observed:

- Plan level is `technical_plan`.
- Storage/SAN and Application Dependency gates remain insufficient evidence.
- Functional waves are not validated.

### Case D - Advanced synthetic evidence

Automated test result: pass.

Input:

- Parsed RVTools inventory.
- VMware Enrichment.
- Proxmox Target.
- Backup Evidence.
- Storage/SAN.
- Application Dependency Mapping.
- Licensing/client context signals.

Expected and observed:

- Plan level is `advanced_plan`.
- Wave planning gate passes only with `functional_validated` dependency evidence.
- Restore testing and business continuity remain production-wave gates where applicable.
- AI narrative status remains `deterministic_fallback`.

## User UI QA

Code and build validation confirmed the report page renders:

- Migration Recommendation Plan panel.
- Plan level.
- Evidence confidence.
- Blocking gate count.
- Evidence coverage chips.
- Gate preview.
- `Generate Migration Plan PDF` CTA.
- Link to generated reports when a blueprint report exists.

Browser limitation:

- The local app served `/sign-in` successfully.
- The in-app Browser plugin failed to initialize because its internal browser assets path was unavailable in this session.
- No authenticated browser click-through was completed in this hito.
- No real login credentials were used or requested.

Result: UI is validated by typecheck/build/tests and code review, but authenticated visual browser QA remains partial.

## PDF QA

Synthetic Migration Recommendation Plan PDF was generated with the product renderer.

Validation:

- PDF file generated successfully.
- PDF parsed successfully with `pypdf`.
- Page count: 6 after page-number hotfix.
- Text extraction succeeded.
- Required sections present:
  - Migration Recommendation Plan
  - Evidence Coverage
  - Gates
  - Critical Blockers
  - Required Remediation
  - Wave Strategy
  - Go / No-Go Checklist
  - Next Steps
  - Open Evidence Requests
- Page numbering present: `Page 1 of ...`.
- No extracted forbidden strings:
  - `[object Object]`
  - `DATABASE_URL`
  - `GEMINI_API_KEY`
  - `RESEND_API_KEY`
  - cookies
  - tokens
  - private Windows paths
  - private key markers

Visual limitation:

- Full raster screenshot QA could not be completed because PyMuPDF/fitz was not available in the local runtime.
- Source-level renderer review confirms a light/white theme and no dark cover background.

## Hotfix applied

Bug found:

- The Migration Recommendation Plan PDF did not include page numbering.

Fix:

- Updated `migrationPlanPdfRenderer` to enable buffered pages and add footer page numbers.

Scope:

- Only the Migration Recommendation Plan PDF renderer changed.
- The global readiness PDF was not redesigned or modified.

## Report history / download / ownership

Validated by code review and runtime entitlement tests:

- Migration Recommendation Plan uses `ReportType.blueprint`.
- User-facing report type label is `Migration Recommendation Plan`.
- Generation stores through existing private report history.
- Download route continues to use existing private report download service and does not expose filesystem paths.
- Download auditing uses the updated report label.

Limitations:

- Multiuser download denial was not manually browser-tested in this session.
- Admin download behavior was not manually browser-tested.

## Entitlement behavior

Automated tests validate:

- Blueprint PDF generation is blocked without full-report entitlement.
- Blueprint PDF generation is allowed with assessment full-report unlock.
- Blueprint PDF generation is allowed with blueprint plan entitlement.
- Blueprint download is blocked without entitlement.

Observed rule:

- The Migration Recommendation Plan follows the existing non-free PDF entitlement path.
- It does not create or modify billing.
- It does not unlock premium content automatically.

## Admin visibility

Validated by typecheck/build and code review:

- `/dashboard/admin` assessment table exposes Migration Plan status.
- It shows:
  - plan level;
  - blocking gate count;
  - total gate count;
  - latest blueprint PDF status.
- Admin remains Spanish.
- No raw JSON or secrets are shown by the new fields.

Manual authenticated admin browser QA was not completed because Browser plugin initialization failed in this session.

## Automated validations

Executed successfully:

- `npx vitest run tests/unit/migrationRecommendationPlan.test.ts tests/unit/migrationPlanEntitlement.test.ts`
- `npx prisma validate`
- `npx prisma generate`
- `npm run typecheck`
- `npm run lint`
- `npm run test:run`
- `npm run build`
- `npm run ai:guardrails`
- `npm run hostinger:diagnose`

Known warning:

- `npm run build` still reports the known Turbopack/NFT warning related to `localStorageService` and the report download route. This was present before this hito and is not caused by EVIDENCE-7.1.

## Security

Confirmed:

- No secrets were printed.
- No env var values were printed.
- No Hostinger config was touched.
- No production deploy was triggered.
- No billing was changed.
- No landing page was changed.
- No raw files were sent to AI.
- AI narrative remains deterministic fallback.
- No secret patterns were found in staged changes.

## Regression

Automated regression coverage passed:

- Full unit suite: 117 test files / 590 tests after EVIDENCE-7.1 additions.
- Prisma schema validation passed.
- TypeScript passed.
- ESLint passed.
- Next build passed.
- AI guardrails passed.

Existing readiness report and global PDF renderer were not modified by this hito.

## Bugs and fixes

Found:

- Missing page numbers in the Migration Recommendation Plan PDF.

Fixed:

- Added buffered page numbering to the specific Migration Recommendation Plan PDF renderer.

Not fixed because not reproducible/accessible in this session:

- Authenticated browser click-through remains pending due Browser plugin initialization failure.

## Git

Commit intent:

- `test: validate migration recommendation plan flow`

Expected committed files:

- `docs/evidence-7-1-migration-plan-authenticated-qa.md`
- `docs/evidence-7-migration-recommendation-plan.md`
- `docs/evidence-expansion-audit-and-roadmap.md`
- `src/server/reports/migrationPlanPdfRenderer.ts`
- `tests/unit/migrationPlanEntitlement.test.ts`

QA artifacts under `qa-artifacts/evidence-7-1` are not intended for commit.

## Risks pending

- Authenticated visual browser QA remains partial.
- Manual multiuser ownership denial remains pending.
- Manual admin browser validation remains pending.
- Production deploy/smoke was intentionally not performed.
- Full visual PDF raster QA remains partial due missing local PDF rasterizer.

## Percentages

- Shift Evidence platform base: 94%.
- Evidence Expansion Layer: 96%.
- Migration Recommendation Plan: 92%.
- Migration Recommendation Plan QA / EVIDENCE-7.1: 78%.
- PDF print-friendly for Migration Plan: 85%.
- Synthetic datasets: 65%.
- Readiness for EVIDENCE-8: 80%.

## Decision

EVIDENCE-7.1 is accepted as automated QA complete with partial authenticated browser QA.

The Migration Recommendation Plan is ready for the next controlled authenticated manual/browser smoke before production deployment.

Recommended next step:

- If browser/manual evidence can be collected: close EVIDENCE-7.1 with user-attested authenticated QA.
- Otherwise proceed carefully to `EVIDENCE-8 - PDF Print-Friendly Global + Synthetic Dataset Library + Demo/Landing/Docs Expansion`, keeping production/full public launch unchanged.

## User-attested Manual Browser Closeout

Date: 2026-06-02
Hito: EVIDENCE-7.1B
Status: attempted, not closed
Environment: local Codex desktop session
Production touched: no
Hostinger touched: no
Billing touched: no
Landing/pricing touched: no

### Browser availability

Manual/browser closeout was attempted with the available browser surfaces:

- In-app Browser.
- Chrome extension-backed browser control.

Both attempts failed before page control was established with the same local tooling error:

- Browser runtime could not initialize because its internal assets path was unavailable in this session.

The local application itself was not the blocker. In the prior EVIDENCE-7.1 run, local `/sign-in` served successfully at `http://127.0.0.1:3000/sign-in` with status 200.

### User QA result

Not completed in this session.

Because browser control did not initialize and no user-provided manual attestation was available, the following items remain pending:

- Authenticated login.
- Dashboard navigation.
- Opening a QA assessment.
- Visual confirmation of the Migration Recommendation Plan panel.
- Visual confirmation of plan level, confidence, evidence coverage and gates.
- Browser click on `Generate Migration Plan PDF`.
- Browser confirmation that the generated plan appears in report history.

### PDF result

No new browser-generated PDF was produced in EVIDENCE-7.1B.

The prior EVIDENCE-7.1 automated QA remains the current evidence:

- Synthetic Migration Recommendation Plan PDF generated by the product renderer.
- PDF parsed successfully with `pypdf`.
- Required sections present.
- Page numbering present after hotfix.
- No extracted forbidden strings or secret patterns.

### Admin result

Not completed in browser in this session.

The prior EVIDENCE-7.1 automated/code QA remains the current evidence:

- Admin assessment table includes plan level.
- Admin assessment table includes blocking gate count and total gates.
- Admin assessment table includes latest Migration Recommendation Plan PDF status.
- Admin remains Spanish by implementation.

### Entitlement / ownership

No manual browser entitlement test was completed in EVIDENCE-7.1B.

The prior automated entitlement tests remain the current evidence:

- Blueprint PDF generation blocks without entitlement.
- Blueprint PDF generation allows assessment full-report unlock.
- Blueprint PDF generation allows blueprint plan entitlement.
- Blueprint download blocks without entitlement.

### Bugs found

No product bug was found in EVIDENCE-7.1B.

The only blocker was local browser-control tooling initialization. No application code hotfix was applied in this hito.

### Decision

EVIDENCE-7.1B does not close the authenticated manual/browser QA gap.

EVIDENCE-7.1 remains accepted as automated QA complete with browser/manual closeout pending.

### Manual checklist for owner/user-attested closeout

To close EVIDENCE-7.1B, an authenticated user should manually confirm:

- Login succeeds.
- Dashboard loads.
- A QA assessment opens.
- Migration Recommendation Plan panel is visible.
- Plan level, confidence, evidence coverage and gates are visible.
- No raw JSON, `[object Object]`, stack traces or internal/debug text is visible.
- `Generate Migration Plan PDF` works for an authorized user.
- Generated plan appears in report history.
- PDF downloads and opens.
- PDF has page numbers.
- PDF has light/print-friendly layout.
- PDF contains Evidence Coverage, Gates, Critical Blockers, Required Remediation, Wave Strategy, Go / No-Go, Next Steps and Open Evidence Requests.
- PDF does not show raw JSON, env vars, tokens, cookies, private paths, storage paths or secrets.
- `/dashboard/admin` shows migration plan level, blocking gates, total gates and latest PDF status.
- Admin remains Spanish.
- If a non-entitled user is available, generation/download blocks safely.

### Updated percentages after EVIDENCE-7.1B attempt

- Shift Evidence platform base: 94%.
- Evidence Expansion Layer: 96%.
- Migration Recommendation Plan: 92%.
- Migration Recommendation Plan QA / EVIDENCE-7.1: 78%.
- EVIDENCE-7.1B manual browser closeout: 20%.
- PDF print-friendly for Migration Plan: 85%.
- Synthetic datasets: 65%.
- Readiness for EVIDENCE-8: 80%.

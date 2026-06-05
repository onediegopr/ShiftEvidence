# Dependency XLSX Risk 1

Fecha: 2026-06-05

## 1. Objective

Audit and reduce operational risk around the `xlsx` workbook parser before expanding real customer uploads.

This hito did not implement Ads, tracking, payments, DNS, DB changes, migrations, dependency replacement, or a parser rewrite.

## 2. Inventory of `xlsx` Use

| File | Function/module | Entrypoint | Parses workbook? | User-controlled? | Auth required? | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `src/server/rvtools/rvtoolsWorkbookReader.ts` | `readRvtoolsWorkbookFromBuffer` | `parseRvtoolsEvidenceAction` via `importRvtoolsEvidence` | Yes | Yes, uploaded RVTools evidence | Yes | Main workbook reader. Uses `XLSX.read` and `XLSX.utils.sheet_to_json`. |
| `src/server/rvtools/rvtoolsColumnMapper.ts` | `parseDateLike` | RVTools parser mapping | No direct workbook read | Indirect parsed cell values | Yes | Uses `XLSX.SSF.parse_date_code` for numeric date cells. |
| `scripts/qa-rvtools-parser-p0.mjs` | QA runner | Manual local QA script | Indirect | Local synthetic or operator-provided file | Local only | Not a production route. |
| `tests/unit/rvtoolsWorkbookSafety.test.ts` | Synthetic fixtures | Unit tests | Yes | No customer data | Local only | Added synthetic workbook guardrail tests. |

Code usage count: 2 production code files.

Production workbook parser count: 1 parser path.

## 3. Upload Entrypoints

| Route/action | Auth | File type accepted | Size limit | Stored? | Parsed immediately? | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| `uploadEvidenceAction` in `src/app/dashboard/assessments/[id]/evidence/actions.ts` | Required | Based on selected `EvidenceType`; RVTools allows `.xlsx`, `.xls`, `.csv` | `MAX_UPLOAD_SIZE_MB`, default 50 MB | Yes | Only module parser path; RVTools parse is otherwise manual action | Medium, controlled authenticated upload |
| `parseRvtoolsEvidenceAction` in `src/app/dashboard/assessments/[id]/evidence/actions.ts` | Required | Existing stored `EvidenceType.rvtools` only | Already enforced at upload | Reads stored file | Yes | Medium, now guarded by workbook limits |
| `uploadAdditionalEvidenceAction` in `src/app/dashboard/assessments/[id]/client-context/actions.ts` | Required | `EvidenceType.other` plus client-context extension allowlist | `MAX_UPLOAD_SIZE_MB`, default 50 MB | Yes | No RVTools workbook parse | Low to medium metadata/file storage risk |

Public anonymous mass upload: no.

## 4. Existing Mitigations

- Uploads require authenticated session.
- Assessment ownership is checked before upload and parse.
- Evidence upload is gated by assessment prerequisites.
- Demo mode upload is blocked where relevant.
- Upload rate limits exist for user and IP.
- File size is checked before storage.
- Extension validation exists before storage.
- MIME validation exists before storage.
- Files are stored privately.
- RVTools parse only accepts stored files with `EvidenceType.rvtools`.
- Parser errors are surfaced as controlled messages.
- Raw uploaded file contents are excluded from AI/advisory payloads.

## 5. New Mitigations Applied

Implemented in `src/server/rvtools/rvtoolsWorkbookReader.ts`:

- Added `RVTOOLS_WORKBOOK_LIMITS`.
- Added max sheet count guard.
- Added max rows per sheet guard.
- Added header sanitization for:
  - `__proto__`;
  - `constructor`;
  - `prototype`.
- Added control-character trimming and max header length.
- Added large string cell truncation before downstream mapping.
- Uses null-prototype row objects when rehydrating sanitized workbook rows.

Implemented tests:

- `tests/unit/rvtoolsWorkbookSafety.test.ts`.
- `tests/unit/evidenceUploadValidation.test.ts`.

## 6. Parser Replacement Analysis

Decision: keep `xlsx` with guardrails for controlled pilots.

Reasoning:

- Current usage is narrow and authenticated.
- Public anonymous mass upload is not exposed.
- Replacement would be a larger parser compatibility project.
- The immediate risk can be reduced with upload validation and workbook guardrails.

Deferred options:

- Evaluate a maintained workbook parser alternative.
- Prefer CSV export/import for RVTools where practical.
- Isolate parsing in a worker process before broad upload volume.
- Add async queue plus scanning if customer volume grows.
- Add antivirus/malware scanning before broad production intake.

## 7. Residual Risk

Residual risk remains medium for controlled pilots because `xlsx` still has known upstream vulnerabilities.

Residual risk becomes high if uploads are opened broadly, anonymously, or at high volume without additional isolation.

## 8. Go / No-Go

| Area | Decision | Notes |
| --- | --- | --- |
| Private outreach | Go | Safe with no customer files until scope/consent. |
| Controlled pilot | Conditional go | Synthetic or explicitly consented customer file only, with current guardrails and operator review. |
| Public anonymous upload | No-go | Requires sandbox/queue/scanning or parser replacement. |
| Ads | No-go in this hito | Tracking/Ads remains out of scope. |
| Broad customer uploads | No-go | Needs parser isolation and stronger operational controls. |

## 9. Tests Added

- Reject unsupported RVTools extension.
- Reject suspicious MIME/extension combination.
- Enforce max upload size before parsing.
- Sanitize dangerous worksheet headers.
- Reject workbook above sheet cap.
- Truncate very large string cells.
- Confirm no prototype pollution on `Object.prototype`.

All tests use synthetic data only.

## 10. Next Hito

- `PRIVATE-OUTREACH-1`.
- `PILOT-EXECUTION-1`.
- `DEPENDENCY-MAINTENANCE-1`.

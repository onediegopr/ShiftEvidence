# Dependency XLSX Risk

Fecha: 2026-06-05

## 1. Objective

Document the current `xlsx` dependency risk and mitigation posture without replacing the parser in this hito.

## 2. Risk

`npm audit` reports known vulnerabilities for the workbook parsing dependency:

- Prototype pollution risk.
- Regular expression denial of service risk.
- No direct upstream fix available in the current dependency line.

Severity for product readiness: high before broad customer uploads.

## 3. Current Use

The dependency is used for workbook-style evidence parsing, including RVTools-style inputs.

It should be treated as a controlled evidence-processing component, not a public anonymous bulk-upload parser.

## 4. Current Mitigations

- Uploads are part of authenticated product flows.
- Production is not approved for anonymous mass uploads.
- Real customer uploads require scope, consent, and data handling expectations.
- Maximum upload size is configurable.
- Upload validation checks extension and MIME type before storage.
- Upload parsing is attached to assessment ownership checks, not anonymous public routes.
- The app does not execute workbook macros.
- Parser-level validation and sanitization exist across evidence modules.
- Product messaging now reinforces evidence-based readiness, not automatic migration.

## 5. Dependency XLSX Risk 1 Mitigations

Applied in `DEPENDENCY-XLSX-RISK-1`:

- RVTools workbook reader now rejects workbooks above the configured sheet cap.
- RVTools workbook reader now rejects sheets above the configured row cap.
- Dangerous user-controlled headers are sanitized:
  - `__proto__`;
  - `constructor`;
  - `prototype`.
- Large string cell values are truncated before downstream mapping.
- Parser guardrails are covered by synthetic unit tests.
- Upload validation is covered by synthetic unit tests for unsupported extension, suspicious MIME/extension pair, and max size enforcement.

No parser replacement, dependency upgrade, sandbox, worker queue, or schema change was implemented in this hito.

## 6. Additional Recommended Mitigations

Recommended after `DEPENDENCY-XLSX-RISK-1`:

- Reject obviously suspicious or malformed workbook inputs early.
- Consider parsing in an isolated worker/process if customer volume increases.
- Evaluate a maintained parser alternative or constrained workbook extraction strategy.
- Add targeted malicious workbook fixtures if safe and synthetic.
- Keep customer consent and retention workflow mandatory.
- Keep broad public upload disabled until controls are stronger.

## 7. Current Decision

Keep `xlsx` with guardrails for private outreach and controlled pilot only.

Do not use this parser posture for public anonymous bulk upload.

No dependency replacement in this hito.

No dependency upgrade in this hito.

No parser rewrite in this hito.

## 8. Next Hito

- `PRIVATE-OUTREACH-1`.
- `PILOT-EXECUTION-1`.
- `DEPENDENCY-MAINTENANCE-1`.

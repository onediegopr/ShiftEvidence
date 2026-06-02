# HITO EVIDENCE-10 - Collector Packaging, Checksums and Download UX

Date: 2026-06-02
Status: implemented locally
Scope: collector/template packaging, deterministic checksums, download UX, upload guidance and static safety tests
Production impact: none
Hostinger touched: no
Billing touched: no
Database schema changed: no
Deploy performed: no
Full public launch: NO

## Executive Summary

EVIDENCE-10 packages the existing Evidence Expansion collectors and templates for controlled beta usage. It does not add new collectors, new parsers, vendor APIs, agents, auto-upload behavior, code signing infrastructure or production deployment changes.

The main deliverable is a deterministic artifact manifest at `/evidence-artifacts/manifest.json`. The manifest lists every downloadable collector/template/README artifact with version, module, output schema, read-only/customer-provided mode, size, checksum path and SHA-256 checksum.

The Evidence Expansion Center now uses this manifest to show download cards, checksum links and upload safety guidance directly in the authenticated assessment UI.

## Artifact Inventory

The manifest currently tracks 12 controlled-beta artifacts:

| Module | Artifact | Type | Version | Mode |
| --- | --- | --- | --- | --- |
| VMware Enrichment | Shift Evidence VMware Enrichment Collector | collector | 0.1.0 | read-only |
| VMware Enrichment | VMware Enrichment Collector README | readme | 0.1.0 | read-only |
| Proxmox Target | Shift Evidence Proxmox Target Collector | collector | 0.1.0 | read-only |
| Proxmox Target | Proxmox Target Collector README | readme | 0.1.0 | read-only |
| Backup Evidence | Shift Evidence Veeam Backup Evidence Collector | collector | 0.1.0 | read-only |
| Backup Evidence | Veeam Backup Evidence Collector README | readme | 0.1.0 | read-only |
| Storage/SAN | Shift Evidence Storage/SAN CSV Template | template | 0.1.0 | customer-provided |
| Storage/SAN | Shift Evidence Storage/SAN JSON Template | template | 0.1.0 | customer-provided |
| Storage/SAN | Storage/SAN Template README | readme | 0.1.0 | customer-provided |
| Application Dependency | Shift Evidence Application Dependency CSV Template | template | 0.1.0 | customer-provided |
| Application Dependency | Shift Evidence Application Dependency JSON Template | template | 0.1.0 | customer-provided |
| Application Dependency | Application Dependency Template README | readme | 0.1.0 | customer-provided |

## Manifest and Checksum Strategy

Source of truth:

- `/evidence-artifacts/manifest.json`

Generation command:

```bash
npm run evidence:artifacts
```

Generation behavior:

- Uses a deterministic reviewed date and generated timestamp for repeatable builds.
- Computes SHA-256 checksums from the current artifact bytes.
- Writes one `.sha256` sidecar file per artifact.
- Records artifact size, path, checksum path and controlled-beta status.
- Does not include secrets, env vars, private paths, tokens or customer data.

Required rule:

- Run `npm run evidence:artifacts` after changing any collector, template or artifact README.

## Download UX

The authenticated Evidence Expansion Center now shows a packaging/integrity block per module:

- artifact display name;
- artifact type;
- version and status;
- output schema;
- short SHA-256 preview;
- requirement summary;
- download button;
- checksum download link;
- README/instructions link when available;
- last reviewed date;
- accepted upload formats.

The UI copy explicitly states:

- collectors are read-only;
- templates are customer-provided evidence helpers;
- outputs/templates must be reviewed locally before upload;
- secrets, credentials, tokens and private paths must not be uploaded;
- missing evidence remains visible as a confidence limitation.

## Upload Guidance

Before upload, the UI now reminds the operator/customer to:

- review the collector output or completed template locally;
- remove credentials, tokens, secrets, private paths and sensitive comments;
- use optional modules to improve confidence, not to bypass human review;
- review parser warnings/errors and matched/unmatched counts after parsing.

This keeps Evidence Expansion aligned with the product boundary: planning support, not migration execution.

## Static Safety Tests

EVIDENCE-10 adds/updates tests for:

- manifest schema, module keys, statuses and checksum format;
- actual SHA-256 checksum matching;
- presence of `.sha256` sidecars;
- absence of secret-like/private-path content in the manifest;
- collector headers including version, owner, mode and output schema;
- template metadata including version and owner;
- public/download UX copy avoiding unsafe migration promises.

The copy safety guardrail includes the Evidence Expansion Center so future download UX changes are scanned for dangerous claims.

## Operating Boundaries

Allowed:

- Download collectors/templates.
- Review collector/template README files.
- Run collectors locally with read-only customer permissions.
- Review outputs locally before upload.
- Upload sanitized outputs/templates to optional Evidence Expansion modules.

Not allowed:

- Treat collectors as remote-control agents.
- Store credentials in collector output.
- Auto-upload evidence.
- Modify infrastructure.
- Claim restore tests, cutover validation, guaranteed migration success or production migration approval without evidence.
- Declare full public launch.

## Remaining Limitations

- Real customer vCenter/Proxmox/Veeam execution remains pending.
- Code signing is not implemented.
- Vendor-specific storage APIs remain future scope.
- Automatic dependency discovery remains future scope.
- EVIDENCE-7.1B authenticated browser/manual closeout remains pending and is not closed by this hito.

## Decision

Collector/template packaging is ready for controlled beta use with manifest/checksum visibility and explicit safety guidance.

Full public launch remains NO.

Recommended next hito:

- EVIDENCE-7.1B authenticated browser/manual closeout, or
- first real-customer collector pilot with operator-assisted checksum verification.

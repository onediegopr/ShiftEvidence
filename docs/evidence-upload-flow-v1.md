# Evidence Upload Flow v1

## Flow
1. The user opens `/dashboard/assessments/[id]`.
2. The user selects the evidence type: `rvtools`, `manual_csv`, or `other`.
3. The user attaches a file.
4. The backend validates ownership, type, extension, MIME, and size.
5. The file is written to private local storage.
6. The `EvidenceFile` record is created in Neon.
7. An `AuditEvent` is recorded.
8. The assessment detail page shows the file in history.
9. Download is served through a secure endpoint.
10. Delete performs soft-delete on metadata and removes the physical file.
11. If the evidence is RVTools, the parser can run to build a preliminary inventory.
12. The parser persists inventory rows and updates processing status.

## Validation rules
- File required.
- File size must be greater than zero.
- Size is limited by `MAX_UPLOAD_SIZE_MB`.
- Extension must match the selected evidence type.
- MIME must be compatible.
- Assessment must belong to the current user/workspace.

## UI states
- `Not uploaded yet`
- `Uploaded`
- `Parsed`
- `Deleted`
- `Failed`

## Completion status
- RVTools evidence is a preliminary signal for completion.
- The basic parser now stores a preliminary inventory, but the final migration report is still pending.

## Errors
- `File is too large.`
- `Unsupported file type.`
- `Unauthorized.`
- `Invalid assessment.`
- `Upload failed.`
- `Storage root unavailable.`
- `Unable to parse RVTools evidence.`

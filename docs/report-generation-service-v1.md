# Report Generation Service v1

## Service
`src/server/reports/reportGenerationService.ts`

## Flow
1. Validate ownership.
2. Build report preview data.
3. Create a `Report` row with status `generating`.
4. Render the PDF server-side.
5. Write the file into private storage.
6. Update the row to `generated`.
7. Record AuditEvents.
8. On failure, update the row to `failed`.

## Ownership
- All generation and deletion paths require authenticated ownership of the assessment.
- Download route validates the assessment and the report before serving bytes.

## Lifecycle
- `generating`
- `generated`
- `failed`
- `deleted`

## Error handling
- On render or write failure, the report row is kept with `failed`.
- The physical file is cleaned up best-effort.
- Errors are surfaced back to the report page as safe messages.

## Notes
- The service is preliminary and preview-focused.
- It does not integrate payments, checkout or certification.


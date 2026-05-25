# Parser Error Handling v1

## Status flow
- `uploaded`
- `processing`
- `parsed`
- `failed`
- `deleted`

## Error categories
- File read failure.
- Unsupported file type.
- No recognizable inventory data.
- Ownership or access failure.
- Storage root unavailable.
- Unexpected parser exception.

## Behavior
- Failures set the evidence to `failed`.
- Warnings do not fail the whole parse.
- Partial extraction is allowed when some sheets are useful.
- Reparse replaces only the inventory rows linked to the same evidence file.

## Recovery
- Fix the source file.
- Upload a new evidence file if needed.
- Re-run the parser.
- Review warnings before treating the output as a final migration signal.

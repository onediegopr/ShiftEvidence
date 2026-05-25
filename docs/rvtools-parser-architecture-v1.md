# RVTools Parser Architecture v1

## Components
- `rvtoolsWorkbookReader.ts`
- `rvtoolsColumnMapper.ts`
- `rvtoolsParserService.ts`
- `rvtoolsImportService.ts`

## Flow
1. Read the uploaded file from private storage.
2. Detect workbook sheets or CSV headers.
3. Infer a role for each sheet: VM, host, datastore, snapshot, or unknown.
4. Map columns with tolerant aliases.
5. Parse rows into preliminary inventory records.
6. Build a summary and parser warnings.
7. Persist parsed rows and summary in Neon.
8. Mark the evidence as `parsed`.

## Reparse
- Reparse is allowed for active RVTools evidence.
- Previous parsed rows for the same evidence file are replaced inside one transaction.
- The original manual intake and Cost / Risk assumptions remain untouched.

## Error handling
- `processing` while the parser runs.
- `parsed` when inventory extraction succeeds.
- `failed` when the file cannot be read or no recognizable inventory is found.
- Warnings are kept with the summary when data is partial.

## Safety rules
- Ownership is validated before parsing.
- Paths are never exposed to the frontend.
- The parser does not read files outside the storage root.
- The parser does not attempt any migration automation.

## Next improvement
- Harder sheet alias coverage.
- Better column normalization.
- Deeper inventory scoring and dependency analysis.

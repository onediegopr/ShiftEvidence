# Parsed Inventory Data Model v1

## Models
- `ParsedVM`
- `ParsedHost`
- `ParsedDatastore`
- `ParsedSnapshot`
- `ParsedInventorySummary`

## Enums
- `ParsedRiskLevel`

## Relationships
- `Assessment -> ParsedVM[]`
- `Assessment -> ParsedHost[]`
- `Assessment -> ParsedDatastore[]`
- `Assessment -> ParsedSnapshot[]`
- `Assessment -> ParsedInventorySummary[]`
- `EvidenceFile -> ParsedVM[]`
- `EvidenceFile -> ParsedHost[]`
- `EvidenceFile -> ParsedDatastore[]`
- `EvidenceFile -> ParsedSnapshot[]`
- `EvidenceFile -> ParsedInventorySummary?`

## Lifecycle
1. Evidence is uploaded to private storage.
2. Parser reads the file and extracts basic rows.
3. Parsed rows are persisted with the source evidence reference.
4. A summary row is stored for the active evidence file.
5. Reparse replaces rows for the same evidence file only.

## Notes
- The model is deliberately basic and preliminary.
- Raw JSON is kept for traceability.
- Source rows are not treated as final migration truth.
- The schema is ready for future inventory enrichment.

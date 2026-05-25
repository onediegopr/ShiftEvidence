# Report Status Lifecycle v1

## Statuses
- `generating`
- `generated`
- `failed`
- `deleted`

## Transitions
- `generating -> generated` when the file is rendered and written successfully
- `generating -> failed` when rendering or storage fails
- `generated -> deleted` when the user deletes the report

## Completion integration
- Report preview remains available separately from PDF generation
- Full report stays locked
- PDF status is derived from the latest non-deleted report

## AuditEvents
- `report_generation_started`
- `report_generated`
- `report_generation_failed`
- `report_downloaded`
- `report_deleted`
- `pdf_preview_generated`

## Notes
- Deleted reports are hidden by default
- This lifecycle is preliminary and does not imply paid unlocks


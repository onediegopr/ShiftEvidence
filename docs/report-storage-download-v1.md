# Report Storage and Download v1

## Storage path
Reports are stored privately under the configured `HOSTINGER_STORAGE_ROOT`, with a fallback to `./storage`, in an assessment-scoped tree.

Example:
- `users/{userId}/workspaces/{workspaceId}/assessments/{assessmentId}/reports/{reportType}`

## Security
- No files are stored in `/public`
- No files are stored in `.next`
- No path is accepted from the client
- Paths are resolved and checked inside the storage root
- Ownership is validated before serving bytes

## Download endpoint
- `/api/assessments/[id]/reports/[reportId]/download`

## Delete flow
- Reports are soft-deleted in Neon
- The physical file is removed best-effort from private storage
- Deleted reports are hidden from the report history by default

## Notes
- The download endpoint only serves generated PDFs with `Content-Disposition: attachment`
- The path is never exposed to the browser


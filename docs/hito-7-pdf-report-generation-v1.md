# Hito 7 - PDF Report Generation v1

## Objetivo
Generar un PDF preliminar descargable para el assessment usando los datos del Report Preview, con storage privado, metadata en Neon, descarga segura y reporte histórico.

## Alcance
- PDF server-side con `pdfkit`
- `Report` model en Prisma
- storage privado para reportes
- descarga segura por ownership
- historial de reportes generados
- soft-delete de reportes
- AuditEvents de lifecycle

## Avance
- Avance general antes del hito: 78%
- Avance general después del hito: 86%
- Avance del hito actual: 100%
- Justificación: ya existe PDF Preview v1, metadata persistida, descarga privada y lifecycle completo de reportes.
- Próximo salto esperado: Hito 8 - Manual Payment / Unlock Flow o hardening visual del PDF.

## Rutas
- `/dashboard/assessments/[id]/report`
- `/api/assessments/[id]/reports/[reportId]/download`

## Servicios
- `src/server/reports/reportGenerationService.ts`
- `src/server/reports/reportPdfRenderer.ts`
- `src/server/reports/reportStorageService.ts`
- `src/server/reports/reportHistoryService.ts`

## UI
- Generate PDF Preview button
- Generated Reports list
- Download action
- Delete action
- preliminary disclaimers and status badges

## Smoke tests
- Generating a PDF creates a `Report` row in Neon
- Download returns `application/pdf`
- The PDF starts with `%PDF`
- Soft-delete removes the file and blocks future download

## Riesgos
- PDF layout is intentionally simple
- Long reports may need pagination tuning
- File tracing warning remains on Windows/OneDrive
- Checkout and payments are still not implemented

## Rollback
- Remove the `Report` model and related services
- Remove the report route and download endpoint
- Restore report preview to preview-only mode

## Next milestone
- Manual Payment / Unlock Flow
- or visual hardening of the PDF preview if needed


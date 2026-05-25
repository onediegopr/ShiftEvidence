# Hito 3 - RVTools Upload + Secure Local File Storage

## Objetivo
Implementar un pipeline seguro de evidencia para ShiftReadiness:
upload -> almacenamiento local privado -> metadata en Neon -> descarga segura -> delete seguro.

## Alcance
- Upload de RVTools/XLSX/CSV para un assessment propio.
- Validacion de tipo, extension, MIME y tamaño.
- Hash SHA-256 del archivo.
- Metadata en Neon.
- Historial de evidencias por assessment.
- Descarga segura con ownership.
- Soft-delete seguro.
- Estado de evidencia en completion status.
- Audit events para upload/download/delete.

## Lo que no incluye
- Parser RVTools.
- Extraccion de inventario.
- Scoring final desde Excel.
- PDF.
- Pagos.
- Almacenamiento publico.

## Rutas implicadas
- `/dashboard/assessments/[id]`
- `/api/assessments/[id]/files/[fileId]/download`

## Modelo de datos
- Nuevo modelo `EvidenceFile`.
- Nuevos enums `EvidenceType` y `EvidenceProcessingStatus`.
- Relacion con `Assessment`, `Workspace` y `User`.

## Seguridad de storage
- Root configurable via `HOSTINGER_STORAGE_ROOT`.
- Fallback local para desarrollo: `./storage`.
- Nunca guardar uploads en `public`.
- Nunca exponer path absoluto al frontend.
- Normalizacion de filename y prevencion de path traversal.
- Hash SHA-256 persistido en Neon.

## Validaciones
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npx prisma validate`
- `npx prisma generate`
- `npx prisma migrate dev --name hito_3_evidence_upload_storage`

## Smoke test
- Upload de `rvtools-smoke-test.csv`.
- Descarga segura con cookie autenticada.
- Soft-delete y verificacion de `404` posterior.
- Verificacion de `AuditEvent`.

## Riesgos
- File locking en Windows/OneDrive durante rebuilds.
- Diferencias entre orden de evidencias activas y borradas si no se prioriza la evidencia mas reciente.
- Crecimiento futuro del volumen de archivos si no se define backup/retention.

## Rollback
- El rollback minimo consiste en revertir `EvidenceFile`, las rutas de descarga y los helpers de storage local, preservando el resto del producto.

## Proximo hito
- Hito 4: parser RVTools basico + extraccion de inventario.

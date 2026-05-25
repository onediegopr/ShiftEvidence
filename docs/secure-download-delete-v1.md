# Secure Download and Delete v1

## Download
Endpoint:
`/api/assessments/[id]/files/[fileId]/download`

### Reglas
- Validar session activa.
- Validar ownership del assessment.
- Validar que el archivo no este soft-deleted.
- Leer el archivo desde storage privado.
- Responder con `Content-Disposition: attachment`.
- No exponer path absoluto.

### Headers
- `Content-Type`
- `Content-Disposition`
- `Content-Length`
- `Cache-Control: private, no-store, max-age=0`

## Delete
- Soft-delete en Neon (`deletedAt` + `processingStatus=deleted`).
- Eliminacion fisica del archivo si existe.
- Audit event `evidence_deleted`.

## Ownership
- No se permite descargar ni borrar archivos de otro workspace.

## Smoke test result
- Download responde `200` antes del delete.
- Download responde `404` despues del delete.

## Riesgos
- Si el archivo fisico falta pero la metadata existe, la descarga debe fallar con seguridad.
- No se debe permitir reuso de path o overwrite.

# EvidenceFile Model v1

## Objetivo
Guardar metadatos de archivos de evidencia asociados a un assessment, con storage privado local y descarga segura.

## Modelo
`EvidenceFile`

Campos principales:
- `id`
- `assessmentId`
- `workspaceId`
- `uploadedByUserId`
- `evidenceType`
- `originalFilename`
- `storedFilename`
- `relativePath`
- `fileHash`
- `mimeType`
- `sizeBytes`
- `processingStatus`
- `processingError`
- `uploadedAt`
- `deletedAt`
- `createdAt`
- `updatedAt`

## Enums
`EvidenceType`
- `rvtools`
- `manual_csv`
- `veeam`
- `proxmox`
- `network`
- `cmdb`
- `other`

`EvidenceProcessingStatus`
- `uploaded`
- `queued`
- `processing`
- `parsed`
- `failed`
- `deleted`

## Relaciones
- `EvidenceFile.assessmentId -> Assessment.id`
- `EvidenceFile.workspaceId -> Workspace.id`
- `EvidenceFile.uploadedByUserId -> User.id`
- `EvidenceFile -> ParsedVM[]`
- `EvidenceFile -> ParsedHost[]`
- `EvidenceFile -> ParsedDatastore[]`
- `EvidenceFile -> ParsedSnapshot[]`
- `EvidenceFile -> ParsedInventorySummary?`

## Indexes
- `assessmentId`
- `workspaceId`
- `uploadedByUserId`
- `evidenceType`
- `processingStatus`
- `deletedAt`

## Ownership
- Solo el usuario autenticado propietario o miembro autorizado del workspace puede subir, descargar o borrar.
- La descarga valida assessment + file + workspace + session.

## Estado
- `uploaded`: archivo recibido y guardado.
- `queued` / `processing`: reservado para parser futuro.
- `parsed`: inventario preliminar extraido.
- `failed`: error de procesamiento o validacion.
- `deleted`: soft-delete de metadata y eliminacion fisica.

## Uso en UI
- Se muestra en el detail del assessment.
- El estado RVTools en completion status depende de la evidencia activa mas reciente.
- El parser basico usa la evidencia RVTools activa para crear inventario preliminar y summary.

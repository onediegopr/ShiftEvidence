# HITO DB-PERF-1 - Add High-Value Query Indexes

## Objetivo

Agregar indices Prisma de alto valor y bajo riesgo, basados en consultas reales del proyecto, para evitar degradacion en listas, filtros y ordenamientos frecuentes a medida que crezcan las tablas.

Destructive migration: NO.
Production migration applied: NO.
Production deploy: NO.
Production launched: NO.

## Problema corregido

La paginacion admin redujo el tamano de respuesta, pero algunas consultas frecuentes seguian dependiendo de indices simples o no tenian indice para el ordenamiento principal. Esto podia afectar:

- listados de assessments por workspace;
- listados admin de assessments activos;
- archivos de evidencia activos por assessment;
- conteos de evidencia/reportes fallidos;
- auditoria admin ordenada por fecha;
- filtros de AI usage por usuario, assessment, proveedor o estado;
- reportes activos por assessment.

## Queries y patrones revisados

- `src/server/admin/adminConsoleService.ts`
- `src/server/admin/adminOpsService.ts`
- `src/server/ai/aiUsageService.ts`
- `src/server/assessments/assessmentService.ts`
- `src/server/evidence/evidenceFileService.ts`
- `src/server/reports/reportGenerationService.ts`
- `src/app/api/admin/ai/usage/route.ts`
- `src/app/api/admin/audit/route.ts`
- `prisma/schema.prisma`

Patrones relevantes:

- `Assessment` por `workspaceId + archivedAt` con `orderBy updatedAt`.
- `Assessment` admin por `archivedAt` con `orderBy updatedAt`.
- `EvidenceFile` por `assessmentId` con `deletedAt/uploadedAt`.
- `EvidenceFile` por `processingStatus + deletedAt` para senales fallidas.
- `Report` por `assessmentId + deletedAt` con `orderBy createdAt`.
- `Report` por `status + deletedAt` para reportes fallidos.
- `AuditEvent` por `createdAt desc`.
- `AiUsageEvent` por filtros admin y `createdAt desc`.

## Indices agregados

### Assessment

Indice:

```prisma
@@index([workspaceId, archivedAt, updatedAt])
```

Motivo:

- Soporta `listAssessmentsForCurrentWorkspace`, que filtra por workspace y `archivedAt: null`, ordenando por `updatedAt`.

Indice:

```prisma
@@index([archivedAt, updatedAt])
```

Motivo:

- Soporta listados y conteos admin de assessments no archivados con orden por `updatedAt`.

### EvidenceFile

Indice:

```prisma
@@index([assessmentId, deletedAt, uploadedAt])
```

Motivo:

- Soporta listados por assessment, evidencia activa y orden por upload/estado de borrado.

Indice:

```prisma
@@index([processingStatus, deletedAt])
```

Motivo:

- Soporta conteos/senales admin de evidencia fallida no borrada.

### AuditEvent

Indice:

```prisma
@@index([createdAt])
```

Motivo:

- Soporta auditoria admin reciente y paginada por `createdAt desc`.

### AiUsageEvent

Indice:

```prisma
@@index([userId, createdAt])
```

Motivo:

- Soporta filtros admin por usuario y fecha.

Indice:

```prisma
@@index([assessmentId, createdAt])
```

Motivo:

- Soporta filtros admin por assessment y fecha.

Indice:

```prisma
@@index([provider, createdAt])
```

Motivo:

- Soporta filtros admin por proveedor y fecha.

Indice:

```prisma
@@index([status, createdAt])
```

Motivo:

- Soporta filtros admin por estado y fecha.

### Report

Indice:

```prisma
@@index([assessmentId, deletedAt, createdAt])
```

Motivo:

- Soporta historial de reportes por assessment activo ordenado por fecha.

Indice:

```prisma
@@index([status, deletedAt])
```

Motivo:

- Soporta conteos/admin health de reportes fallidos no borrados.

## Indices candidatos descartados

- `Assessment @@index([status])`: ya existia.
- `EvidenceFile @@index([processingStatus])`: ya existia, se agrego compuesto solo para el patron con `deletedAt`.
- `AiUsageEvent @@index([createdAt])`: ya existia.
- `AiUsageEvent @@index([provider])`, `@@index([status])`, `@@index([userId])`, `@@index([assessmentId])`: ya existian; se agregaron compuestos con `createdAt` por patrones de filtro + orden.
- `AuditEvent @@index([userId, createdAt])` y `@@index([assessmentId, createdAt])`: descartados por ahora porque no hay query frecuente actual con esos filtros y orden. Se conserva `createdAt` global.
- Indices en `ParsedVM`, `ParsedHost`, `ParsedDatastore`, `ParsedSnapshot`, `RiskFinding`: descartados para evitar sobreindexar antes de medir. Ya existen indices por `assessmentId`; compuestos por fecha pueden evaluarse si los reportes/detalles crecen.
- `CommercialOpportunity @@index([score, updatedAt])`: descartado porque ya existen indices simples y no era foco de este hito.
- `UserEntitlement @@index([updatedAt])`: descartado por tabla/listado acotado y fuera del foco principal.

## Migracion creada

Nombre:

- `20260529120000_add_high_value_query_indexes`

Archivo SQL:

- `prisma/migrations/20260529120000_add_high_value_query_indexes/migration.sql`

Tipo:

- No destructiva.
- Solo contiene `CREATE INDEX`.

Revision:

- No contiene `DROP TABLE`.
- No contiene `DROP COLUMN`.
- No contiene `ALTER COLUMN`.
- No contiene `DELETE`.
- No contiene `UPDATE`.
- No contiene cambios de datos.

## Validaciones ejecutadas

- `npx prisma validate`: OK cargando `.env.local` solo en el proceso, sin imprimir valores.
- `npx prisma generate`: OK cargando `.env.local` solo en el proceso, sin imprimir valores.
- `npm run hostinger:diagnose`: OK. No imprime secretos ni conecta a DB.
- `npm run lint`: OK con warnings preexistentes de `@next/next/no-img-element`.
- `npm run typecheck`: OK.
- `npm run build`: OK.

Notas:

- Un primer intento de `npx prisma validate` fallo porque el entorno del proceso no tenia `DATABASE_URL`; se reejecuto cargando `.env.local` sin imprimir valores.
- Un primer intento de build fallo por `EPERM` al limpiar `.next`; se elimino solo `.next` generado dentro del workspace y el build posterior paso.
- Warning Turbopack/NFT conocido: no bloqueante para este hito.

## Que no se toco

- Datos reales: NO.
- Modelos/campos/relaciones: NO.
- Auth: NO.
- Rate limiting: NO.
- CSP/headers: NO.
- Storage: NO.
- Parser RVTools: NO.
- PDF: NO.
- AI providers/prompts: NO.
- Pricing/scoring: NO.
- UI publica/admin: NO.
- `.env.local`: NO.
- Hostinger config: NO.

## Riesgos pendientes

- Aplicar la migracion en produccion requiere ventana/control operacional separado.
- Medir performance real con datos de produccion o staging.
- Evaluar indices compuestos en parsed inventory/risk findings si los reportes crecen.
- Agregar tests o checks de migracion no destructiva en CI.
- Configurar Upstash real para rate limiting efectivo.

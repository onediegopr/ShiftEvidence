# HITO STORAGE-SECURITY-1 - Local Storage Path Containment

## Objetivo

Endurecer la resolucion de paths del storage local para que ninguna operacion de evidencia o reportes pueda escapar del directorio raiz configurado por `HOSTINGER_STORAGE_ROOT` o del root local por defecto.

## Riesgo corregido

El servicio ya verificaba que el path resuelto empezara dentro del root, pero la logica estaba duplicada y no rechazaba explicitamente paths absolutos recibidos como `relativePath`. Este hito refuerza la contencion para uploads, downloads, deletes y reportes.

## Archivos revisados

- `src/server/evidence/localStorageService.ts`
- `src/server/reports/reportStorageService.ts`
- `src/app/dashboard/assessments/[id]/evidence/actions.ts`
- `src/app/api/assessments/[id]/files/[fileId]/download/route.ts`
- `src/app/api/assessments/[id]/reports/[reportId]/download/route.ts`
- `src/server/reports/reportGenerationService.ts`

## Archivos modificados

- `src/server/evidence/localStorageService.ts`
- `src/server/reports/reportStorageService.ts`
- `docs/hito-storage-security-1-local-storage-path-containment.md`

## Como se resolvia antes

- `getStorageRoot()` podia devolver un path normalizado o `path.join(process.cwd(), "storage")`.
- `resolveEvidenceAbsolutePath()` y `resolveReportAbsolutePath()` hacian `path.resolve(root, relativePath)` y verificaban prefijo con `root + path.sep`.
- La logica estaba duplicada entre evidencia y reportes.
- Un path absoluto enviado como supuesto `relativePath` no se rechazaba de forma explicita antes de resolver.

## Como se resuelve ahora

- `getStorageRoot()` siempre devuelve un path absoluto con `path.resolve()`.
- Se agrego `resolveInsideStorageRoot(relativePath, errorMessage)`.
- Se agrego `assertAbsolutePathInsideStorageRoot(absolutePath, errorMessage)`.
- Los paths relativos se normalizan de `/` a `path.sep`, se rechazan si son absolutos y se resuelven contra el root.
- El check de contencion usa igualdad con root o prefijo `resolvedRoot + path.sep`, evitando falsos positivos tipo `storage2`.
- Reportes reutilizan el helper comun del storage local para evidencia.

## Como se evita path traversal

- Paths absolutos recibidos como `relativePath`: rechazados.
- `../escape.txt`: resuelve fuera del root y se rechaza.
- Subcarpetas legitimas dentro del root: permitidas.
- Prefijos tramposos como `storage2` contra `storage`: rechazados por el separador de path.
- Nombres de archivo generados siguen pasando por sanitizacion existente.

## Validaciones ejecutadas

- Revision logica del helper real: OK.
- `npm run typecheck`: OK.
- `npm run hostinger:diagnose`: OK.
- `npm run lint`: OK con 10 warnings conocidos de `<img>`.
- `npm run build`: OK.

Nota: el build mantiene el warning NFT conocido de Turbopack relacionado con filesystem/storage tracing.

## Que no se toco

- `HOSTINGER_STORAGE_ROOT`: NO.
- `.env.local`: NO.
- DB schema: NO.
- Migraciones Prisma: NO.
- Datos o archivos fisicos reales: NO.
- Parser RVTools: NO.
- PDF renderer/logica de contenido: NO.
- AI Advisory: NO.
- Auth/sesiones/headers/middleware: NO.
- Pricing/cost formulas/scoring: NO.

## Riesgos pendientes

- Tests unitarios formales para path containment siguen pendientes si se formaliza infraestructura de tests.
- Rate limiting sigue pendiente.
- CSP sigue pendiente.

## Estado final

- HOSTINGER_STORAGE_ROOT changed: NO.
- DB migration: NO.
- Production deploy: NO.
- Production launched: NO.

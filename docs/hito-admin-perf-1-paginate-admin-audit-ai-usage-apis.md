# HITO ADMIN-PERF-1 - Paginate Admin Audit & AI Usage APIs

## Objetivo

Agregar paginacion server-side conservadora a APIs admin que devuelven listas potencialmente grandes, especialmente auditoria y uso persistente de AI.

DB migration: NO.
Production deploy: NO.
Production launched: NO.

## Problema corregido

Las APIs internas de admin podian crecer en costo de lectura y egress a medida que aumentaran las tablas de auditoria y eventos de AI. Aunque algunas consultas ya tenian limites internos, no existia un contrato de paginacion explicito por request.

## Rutas revisadas

- `src/app/api/admin/ai/usage/route.ts`
- `src/app/api/admin/audit/route.ts`
- `src/server/ai/aiUsageService.ts`
- `src/server/admin/adminOpsService.ts`
- `src/server/admin/adminConsoleService.ts`

## Rutas modificadas

- `GET /api/admin/ai/usage`
- `GET /api/admin/audit`

## Archivos modificados

- `src/app/api/admin/ai/usage/route.ts`
- `src/app/api/admin/audit/route.ts`
- `src/server/ai/aiUsageService.ts`
- `src/server/admin/adminOpsService.ts`
- `src/server/admin/adminPagination.ts`

## Estrategia de paginacion

Tipo:

- page/offset simple para mantener bajo riesgo y evitar errores por cursores inexistentes.

Parametros:

- `limit`: cantidad solicitada por pagina.
- `page`: pagina solicitada.

Limites:

- default API limit: 50.
- max API limit: 100.
- page default: 1.
- max page: 1000.

`hasMore`:

- Se consulta `limit + 1`.
- Se devuelve `hasMore` y `nextPage`.

`count()` total:

- No se agrego `count()` total nuevo para paginacion.
- AI usage conserva los counts operativos existentes de 24h, 7d y 30d.

## Contrato de respuesta final

### AI usage

La respuesta conserva el objeto existente y agrega:

```ts
pagination: {
  limit: number;
  page: number;
  returned: number;
  hasMore: boolean;
  nextPage: number | null;
}
```

La ruta `/api/admin/ai/usage` pasa `limit/page` parseados con default 50/max 100.

### Audit

La respuesta queda:

```ts
{
  events: AuditEvent[];
  pagination: {
    limit: number;
    page: number;
    returned: number;
    hasMore: boolean;
    nextPage: number | null;
  }
}
```

La ruta `/api/admin/audit` pasa `limit/page` parseados con default 50/max 100.

## Compatibilidad con UI admin

La UI admin server-side no fue redisenada.

- `getAdvancedAuditEvents()` conserva compatibilidad devolviendo array.
- Se agrego `getAdvancedAuditEventsPage()` para la API paginada.
- `getAdminAiUsage()` conserva contrato existente y solo agrega `pagination`.
- Las llamadas internas sin `limit/page` mantienen sus limites historicos acotados para evitar cambios de comportamiento innecesarios en budget summary y oportunidades.

## Validaciones funcionales/logicas

- Rutas admin siguen llamando `requireAdminSession()`.
- AI usage API aplica `limit/page`.
- Audit API aplica `limit/page`.
- `limit` invalido usa default 50.
- `limit > 100` se clampa a 100.
- Se usa `take: limit + 1`.
- No se agrego `count()` total de paginacion.
- No se tocaron filtros existentes de AI usage.
- No se modifico la consola admin salvo consumidores de servicio compatibles.

## Que no se toco

- DB schema: NO.
- Prisma migrations: NO.
- Auth core: NO.
- Rate limiting: NO.
- CSP/headers: NO.
- Parser RVTools: NO.
- PDF: NO.
- AI providers/prompts: NO.
- AI budget control: NO.
- Pricing/scoring: NO.
- UI publica/landing: NO.
- `.env.local`: NO.
- Hostinger config: NO.

## Validaciones ejecutadas

- `npm run hostinger:diagnose`: OK. No imprime secretos ni conecta a la base.
- `npm run lint`: OK con warnings preexistentes de `@next/next/no-img-element`.
- `npm run typecheck`: OK.
- `npm run build`: OK.

Warning observado:

- Turbopack/NFT conocido sobre tracing desde `next.config.mjs` hacia storage local. No bloqueante para este hito.

## Validaciones funcionales/logicas ejecutadas

- `/dashboard/admin`: 307 a `/sign-in` sin sesion.
- `/api/admin/ai/usage?limit=500`: 307 a `/sign-in` sin sesion.
- `/api/admin/audit?limit=500`: 307 a `/sign-in` sin sesion.
- `parseAdminLimit(null)`: 50.
- `parseAdminLimit("abc")`: 50.
- `parseAdminLimit("20")`: 20.
- `parseAdminLimit("500")`: 100.
- `parseAdminPage(null)`: 1.
- `parseAdminPage("abc")`: 1.
- `parseAdminPage("50000")`: 1000.

## Riesgos pendientes

- Agregar tests unitarios para helpers de paginacion cuando exista suite estable.
- Evaluar indices DB futuros para `AuditEvent.createdAt` si la tabla crece mucho.
- Revisar otras listas admin no criticas en hitos posteriores.
- Configurar Upstash real para rate limiting efectivo.

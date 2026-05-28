# HITO ADMIN-3-PROD-MIGRATION-SMOKE

Fecha: 2026-05-28.

## Objetivo

Aplicar en produccion la migracion ADMIN-3 y validar la consola comercial/operativa interna en espanol:

- presupuesto IA;
- limites informativos;
- entitlements manuales;
- accesos y planes;
- oportunidades comerciales;
- next-best-action;
- auditoria de acciones admin;
- usuarios/assessments enriquecidos;
- produccion publica sana;
- sin exposicion de secretos.

## Estado heredado

- ADMIN-1: completo.
- ADMIN-2A: completo.
- ADMIN-2B: completo.
- ADMIN-2B produccion: completo.
- ADMIN-3 codigo: completo.
- Gemini real en produccion: activo.
- OpenAI: no activo.
- Full public launch: NO.

## Git

- Branch: `main`.
- HEAD inicial esperado: `a7b46e9 feat: add admin budgets entitlements and opportunities`.
- HEAD/origin verificados antes de migrar: `a7b46e9b0332769b0277e87d8529d6700c1acd53`.
- Working tree inicial: limpio.
- Divergencia: no detectada.

## Runtime DB

`DATABASE_URL` fue encontrada en el runtime local seguro via `.env.local`.

Validaciones realizadas sin imprimir el valor:

- `DATABASE_URL` configurada: si.
- Fuente: `.env.local` no versionado.
- DB objetivo: Neon/produccion validada por migraciones previas y count seguro de `AiUsageEvent`.
- Valor impreso: no.
- Secrets impresos: no.

Antes de aplicar ADMIN-3 se confirmo:

- migracion ADMIN-2B aplicada: si.
- `AiUsageEvent` accesible: si.
- `AiUsageEvent` count seguro antes de ADMIN-3: `1`.

## Migracion aplicada

Migracion:

- `prisma/migrations/20260528150000_admin_3_budgets_entitlements_opportunities/migration.sql`

Comando:

- `npm run prisma:deploy`

Resultado:

- migracion aplicada correctamente;
- no se ejecuto `prisma reset`;
- no se ejecuto `prisma migrate reset`;
- no se uso `prisma db push`;
- no se borraron datos existentes.

Revision de SQL:

- crea `SystemSetting`;
- crea `UserEntitlement`;
- crea `CommercialOpportunity`;
- crea indices;
- no contiene `DROP`;
- no contiene `TRUNCATE`;
- no borra columnas;
- no actualiza datos existentes.

Nota operativa: `UserEntitlement` usa FK a `user` con `ON DELETE CASCADE`. No borra datos al aplicar la migracion, pero debe revisarse antes de habilitar cualquier hard-delete futuro.

## Counts seguros post-migracion

- ADMIN-3 migration applied: `true`.
- `SystemSetting`: `0` inicialmente, luego `1` tras configurar presupuesto IA QA.
- `UserEntitlement`: `0` inicialmente, luego `1` QA con nota `QA ADMIN-3 smoke`.
- `CommercialOpportunity`: `0` inicialmente, luego `1` QA con nota `QA ADMIN-3 smoke`.
- `AuditEvent`: `340` post-migracion antes de acciones ADMIN-3.
- `AiUsageEvent`: `1`.

## Produccion sin sesion

Smoke sin sesion:

- `/`: `200`.
- `/shiftreadiness`: `200`.
- `/sign-in`: `200`.
- `/sign-up`: `200`.
- `/dashboard`: `307` a `/sign-in`.
- `/dashboard/admin`: `307` a `/sign-in`.

Resultado:

- no `500`;
- no `503`;
- no `504`;
- no Hostinger 404.

## Admin autenticado

Se uso sesion admin existente en Chrome del usuario.

Validado:

- `/dashboard/admin` carga;
- `IA y Consumo` carga;
- `Accesos y Planes` carga;
- `Oportunidades` carga;
- `Auditoria` carga;
- `Configuracion` carga;
- no se detectaron patrones de secrets;
- no se observo `[object Object]`.

## Presupuesto IA

Valores QA configurados:

- presupuesto mensual estimado: USD 50;
- limite diario informativo: USD 10;
- limite por usuario informativo: USD 5;
- limite por assessment informativo: USD 2;
- alertas 50/80/100: activas.

Resultado:

- setting `ai.budget` creado;
- auditoria `ai_budget_updated` registrada;
- limites son informativos;
- no hay enforcement destructivo;
- no se editaron API keys ni Hostinger env vars.

## Entitlements / Accesos

Accion QA:

- usuario: QA/test controlado;
- plan: `internal_qa`;
- estado: `active`;
- source: `admin`;
- IA habilitada: si;
- full report/PDF habilitado: si;
- nota interna: `QA ADMIN-3 smoke`.

Resultado:

- `UserEntitlement` creado;
- aparece en `Accesos y Planes`;
- auditoria `entitlement_granted` registrada;
- no hard-delete;
- no impersonation.

## Oportunidades comerciales

Accion QA:

- oportunidad QA creada/actualizada;
- score: `72`;
- estado: `needs_follow_up`;
- tags: `Alto potencial`, `Requiere seguimiento`, `QA ADMIN-3 smoke`;
- next best action: `Agendar revision tecnica QA`;
- plan sugerido: `professional`;
- nota interna: `QA ADMIN-3 smoke`.

Resultado:

- `CommercialOpportunity` creada/actualizada;
- aparece en `Oportunidades`;
- auditoria `commercial_status_updated` registrada;
- scoring deterministico, no IA como autoridad.

## Usuarios / Assessments

Validado en consola:

- usuarios muestran plan/acceso, oportunidad, consumo IA y proxima accion;
- assessments muestran oportunidad, tags, next action y consumo/costo IA cuando existe;
- estados vacios se muestran sin crashear;
- acciones siguen siendo read-only o confirmadas.

## Seguridad

Validado:

- no se imprimio `DATABASE_URL`;
- no se imprimio `GEMINI_API_KEY`;
- no se imprimio `OPENAI_API_KEY`;
- no se mostraron API keys en UI;
- no se mostraron tokens/cookies;
- no se mostraron storage paths privados;
- no se tocaron raw files;
- no se activo OpenAI;
- no se declaro full public launch.

## Validaciones

Pre-migracion:

- `npm run hostinger:diagnose`: OK.
- `npm run ai:guardrails`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK, con warning NFT conocido no bloqueante.
- `npx prisma validate`: OK.
- `npx prisma generate`: OK.

Post-migracion:

- `npm run hostinger:diagnose`: OK.
- `npm run ai:guardrails`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK, con warning NFT conocido no bloqueante.
- `npx prisma validate`: OK cargando `DATABASE_URL` solo al proceso.
- `npx prisma generate`: OK cargando `DATABASE_URL` solo al proceso.

Nota: el primer `npm run build` post-migracion fallo por `EPERM` al limpiar un artefacto generado `.next` en Windows/OneDrive. Se verifico que `.next` estaba dentro del workspace, se limpio solo ese artefacto de build y el build posterior paso correctamente.

## Riesgos pendientes

- `ON DELETE CASCADE` en `UserEntitlement` debe considerarse antes de habilitar hard-delete.
- Los limites IA son informativos; enforcement automatico queda para ADMIN-4.
- Billing automatico real sigue fuera de alcance.
- Acciones de provider IA siguen siendo instrucciones operativas; no editan Hostinger env vars.
- Se requiere mantener QA data marcada y revisable.

## Decision

- ADMIN-3 production migration applied: SI.
- ADMIN-3 production ready: SI para controlled launch / limited beta.
- Ready for ADMIN-4: SI.
- Ready for full public launch: NO.

Proximo hito recomendado:

- `ADMIN-4`: enforcement operativo de limites, runtime settings seguro y hardening comercial/billing si se aprueba.

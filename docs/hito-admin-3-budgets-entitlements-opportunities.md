# HITO ADMIN-3 - Budgets, Entitlements and Opportunities

Fecha: 2026-05-28.

## Objetivo

Convertir la consola interna `/dashboard/admin` en una herramienta comercial/operativa con presupuesto IA, limites informativos, accesos manuales, oportunidades comerciales y auditoria avanzada.

## Schema / migracion

Migracion:

- `prisma/migrations/20260528150000_admin_3_budgets_entitlements_opportunities/migration.sql`

Modelos agregados:

- `SystemSetting`
- `UserEntitlement`
- `CommercialOpportunity`

La migracion es aditiva:

- no borra tablas;
- no borra columnas;
- no trunca datos;
- no ejecuta Prisma reset;
- no toca Hostinger config.

## Presupuesto IA

ADMIN-3 agrega setting operativo no secreto:

- presupuesto mensual IA estimado;
- alertas 50/80/100;
- limite diario informativo;
- limite por usuario informativo;
- limite por assessment informativo.

El enforcement automatico queda para ADMIN-4. La consola muestra claramente que los limites son informativos.

## Entitlements / accesos

Modelo:

- `UserEntitlement`

Permite administrar internamente:

- plan;
- estado;
- origen;
- vencimiento;
- max assessments;
- max PDF;
- IA habilitada;
- full report habilitado;
- notas internas.

Acciones:

- conceder acceso manual;
- revocar acceso.

No hay billing automatico real, hard delete ni impersonation.

## Oportunidades comerciales

ADMIN-3 calcula oportunidades de forma deterministica usando:

- cantidad de VMs;
- readiness/confidence;
- evidencia;
- PDFs;
- uso IA;
- contexto;
- plan actual.

Salida:

- score 0-100;
- tags;
- proxima mejor accion;
- plan sugerido;
- estado comercial;
- notas internas.

La IA no reemplaza esta logica ni se usa como autoridad comercial.

## Auditoria

Se reutiliza `AuditEvent`.

Eventos registrados:

- `ai_budget_updated`;
- `entitlement_granted`;
- `entitlement_revoked`;
- `commercial_status_updated`;
- `admin_audit_checked`.

Metadata:

- segura;
- sin prompts;
- sin raw responses;
- sin API keys;
- sin cookies/tokens;
- sin storage paths privados.

## Endpoints admin

Protegidos por admin guard:

- `GET /api/admin/settings`
- `POST /api/admin/settings`
- `GET /api/admin/entitlements`
- `POST /api/admin/entitlements`
- `POST /api/admin/entitlements/update`
- `GET /api/admin/opportunities`
- `POST /api/admin/opportunities`
- `GET /api/admin/audit`

## UI admin

Secciones agregadas o ampliadas:

- `IA y Consumo`: presupuesto, limites informativos y alertas.
- `Accesos y Planes`: entitlements manuales.
- `Oportunidades`: score, tags, next best action y estado comercial.
- `Auditoria`: eventos admin avanzados.
- `Usuarios`: plan, estado comercial, oportunidad y consumo IA.
- `Evaluaciones`: oportunidad, tags, next action y consumo IA.

Todo texto visible esta en espanol.

## Seguridad

- No se muestran secrets.
- No se editan API keys.
- No se imprime `DATABASE_URL`.
- No se imprime `GEMINI_API_KEY`.
- No se activa OpenAI.
- No se guarda raw file content.
- No se guardan prompts/responses crudos.
- No hay impersonation.
- No hay hard delete.
- Full public launch sigue NO.

## Limitaciones

- Costos IA son estimados.
- Limites IA son informativos.
- No hay bloqueo automatico de consumo.
- No hay billing automatico.
- Acciones de provider IA siguen siendo instrucciones operativas, no botones que editan Hostinger.

## Pendientes ADMIN-4

- Enforcement real de limites.
- Presupuesto mensual con alertas persistentes mas ricas.
- Runtime settings seguro para activar/desactivar IA sin editar secrets.
- Integracion comercial/billing real si se aprueba.
- Dashboard de cohortes/comercial mas avanzado.

## ADMIN-4 follow-up

Fecha: 2026-05-28.

ADMIN-4 implementa la primera capa de enforcement operativo real sin nueva migracion:

- runtime settings en `SystemSetting` bajo `ops.runtime`;
- modo IA efectivo `env`, `disabled`, `mock` o `gemini`;
- bloqueo IA por runtime/presupuesto/entitlement con fallback seguro;
- bloqueo de generacion PDF y descargas por setting/entitlement;
- bloqueo de creacion de assessments por setting/entitlement;
- acciones admin con confirmacion y auditoria;
- seccion `Configuracion Operativa` en espanol.

Las variables de Hostinger siguen siendo la capa base y no se editan desde admin. No se guardan secrets ni prompts/responses crudos.

## Decision

- ADMIN-3 complete: SI si validaciones pasan.
- Ready for production migration smoke if schema changed: SI.
- Ready for ADMIN-4: SI.
- Ready for full public launch: NO.

## Production migration smoke

Fecha: 2026-05-28.

`ADMIN-3-PROD-MIGRATION-SMOKE` aplico la migracion en la DB Neon de produccion usando `npm run prisma:deploy` sin imprimir `DATABASE_URL`.

Resultado:

- `SystemSetting`: creado y validado.
- `UserEntitlement`: creado y validado.
- `CommercialOpportunity`: creado y validado.
- `AuditEvent`: reusado y validado.
- `AiUsageEvent`: sigue accesible.
- Produccion sin sesion: publica `200`, privadas/admin `307` a `/sign-in`.
- Admin autenticado: consola carga y muestra presupuesto IA, accesos, oportunidades, auditoria y configuracion segura.
- Accion QA: presupuesto IA USD 50, entitlement `internal_qa`, oportunidad QA y auditorias asociadas.
- Secrets: no impresos ni visibles.

ADMIN-3 queda listo para controlled launch / limited beta. Full public launch sigue NO.

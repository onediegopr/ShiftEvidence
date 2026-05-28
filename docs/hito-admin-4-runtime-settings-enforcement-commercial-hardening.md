# HITO ADMIN-4 - Runtime Settings, Enforcement and Commercial Hardening

Fecha: 2026-05-28.

## Objetivo

Implementar control operativo real desde la consola interna en espanol:

- runtime settings seguros desde DB;
- override operativo de AI Advisory sin tocar Hostinger;
- enforcement basico de IA, PDF/reportes y creacion de assessments;
- aplicacion inicial de entitlements;
- acciones admin auditadas;
- UI interna en espanol;
- sin secrets, sin OpenAI y sin full public launch.

## DB / schema

ADMIN-4 no agrega migraciones.

Se reutilizan modelos productivos existentes:

- `SystemSetting`
- `UserEntitlement`
- `AiUsageEvent`
- `AuditEvent`

Runtime settings usa el setting no secreto:

- `ops.runtime`

No se ejecuto Prisma reset. No se borro ni altero data existente.

## Runtime settings

Settings operativos soportados:

- `aiRuntimeMode`: `env`, `disabled`, `mock`, `gemini`
- `aiEnforceBudget`
- `aiBlockOnBudgetExceeded`
- `reportsPdfGenerationEnabled`
- `reportsDownloadEnabled`
- `assessmentsCreationEnabled`
- `uploadsEnabled`
- `publicRegistrationEnabled`
- `maintenanceMode`

Defaults seguros:

- IA usa env vars si no hay override.
- PDF generation activo.
- Downloads activos.
- Creacion de assessments activa.
- Enforcement de presupuesto desactivado hasta configuracion explicita.

No se guardan API keys, tokens, cookies, DB URLs ni secrets.

## Effective AI mode

La configuracion efectiva de IA se resuelve asi:

1. `aiRuntimeMode=disabled`: IA desactivada aunque Hostinger tenga Gemini configurado.
2. `aiRuntimeMode=mock`: provider mock operativo para fallback/control.
3. `aiRuntimeMode=gemini`: Gemini si `GEMINI_API_KEY` esta configurada.
4. `aiRuntimeMode=env`: usa `AI_ADVISORY_*` de runtime/Hostinger.

Esto permite apagar IA o volver a mock sin editar variables Hostinger.

## Enforcement IA

Antes de llamar al provider AI:

- se verifica runtime setting;
- se verifica presupuesto si `aiBlockOnBudgetExceeded=true`;
- se verifica entitlement del usuario;
- se registra `AiUsageEvent` para bloqueos;
- se devuelve fallback estructurado;
- preview/PDF siguen funcionando.

Estados persistidos agregados:

- `blocked_budget`
- `blocked_limit`
- `disabled_runtime`

No se guarda prompt completo ni respuesta cruda.

## Enforcement PDF / downloads

Antes de generar PDF:

- se verifica `reportsPdfGenerationEnabled`;
- se verifica entitlement/full report cuando corresponde;
- se respeta `maxPdfReports` si existe;
- se conserva compatibilidad con entitlement historico `full_report_unlocked`.

Antes de descarga:

- se verifica `reportsDownloadEnabled`;
- se verifica entitlement si aplica;
- bloqueos devuelven mensaje controlado en espanol.

## Enforcement assessment creation

Antes de crear un assessment:

- se verifica `assessmentsCreationEnabled`;
- se verifica estado de entitlement;
- se respeta `maxAssessments` si existe;
- el bloqueo devuelve mensaje controlado en espanol.

## Admin UI

Se agrega seccion:

- `Configuracion Operativa`

Incluye:

- modo IA runtime;
- enforcement de presupuesto IA;
- bloqueo por presupuesto;
- generacion PDF;
- descargas de reportes;
- creacion de assessments;
- uploads;
- registro publico;
- modo mantenimiento;
- acciones rapidas auditadas para apagar IA, volver a mock, usar env o forzar Gemini.

Todas las acciones requieren confirmacion explicita.

## Auditoria

Se registran eventos en `AuditEvent` para cambios operativos:

- `runtime_setting_updated`
- `ai_runtime_disabled`
- `ai_runtime_mock_enabled`
- `ai_runtime_env_enabled`
- `ai_runtime_gemini_enabled`

Metadata segura:

- sin secrets;
- sin prompts;
- sin raw responses;
- sin raw files;
- sin storage paths privados.

## Entitlements

Reglas iniciales:

- `admin`, `internal_qa`, `blueprint`, `professional`, `msp_partner`: full report/PDF/AI habilitados por defecto operativo.
- `starter`: AI permitido si entitlement lo permite; full report segun flag.
- `free_preview`: sin full PDF salvo unlock historico o entitlement explicito.
- `expired`, `revoked`, `pending_payment`: bloquean capacidades premium.

Los defaults son conservadores y pueden refinarse en ADMIN-5/comercial.

## Seguridad

- No se toca Hostinger config.
- No se editan API keys desde admin.
- No se muestra `DATABASE_URL`.
- No se muestra `GEMINI_API_KEY`.
- No se muestra `BETTER_AUTH_SECRET`.
- No se activa OpenAI.
- No hay hard delete.
- No hay impersonation.
- Full public launch sigue NO.

## Validaciones

Requeridas para cierre:

- `npm run hostinger:diagnose`
- `npm run ai:guardrails`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npx prisma validate`
- `npx prisma generate`

## Limitaciones

- No se probo una conmutacion operativa destructiva en produccion.
- `uploads.enabled`, `public.registrationEnabled` y `system.maintenanceMode` quedan disponibles en setting pero no necesariamente aplicados en todos los flujos.
- Enforcement comercial es inicial y conservador.
- Billing automatico real sigue fuera de alcance.

## Decision

- ADMIN-4 complete: SI si validaciones pasan.
- Ready for production migration smoke if schema changed: no aplica, no hubo schema.
- Ready for pre-launch hardening: SI.
- Ready for full public launch: NO.

## Production ops smoke

Fecha: 2026-05-28.

`ADMIN-4-PROD-OPS-SMOKE` recibio evidencia user-attested PASS:

- admin autenticado carga `/dashboard/admin`;
- `Configuracion Operativa`, `IA y Consumo` y `Auditoria` cargan;
- no secrets visibles;
- IA pudo cambiar a `disabled` sin crashear preview/test;
- auditoria registro acciones;
- IA pudo cambiar a `mock` sin crashear;
- IA fue restaurada a `env/gemini`;
- Gemini volvio operativo;
- PDF/download quedaron enabled;
- assessment creation quedo enabled;
- errores visibles: ninguno reportado.

Estado final operativo:

- IA: `env/gemini`.
- PDF/download: enabled.
- Assessment creation: enabled.
- OpenAI: no activo.
- Full public launch: NO.

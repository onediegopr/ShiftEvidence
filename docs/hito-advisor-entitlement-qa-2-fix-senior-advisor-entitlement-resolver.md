# HITO ADVISOR-ENTITLEMENT-QA-2 — Fix Senior Advisor Entitlement Resolver and Enable QA Input

## Objetivo

Corregir el desbloqueo QA del `Senior Migration Advisor` para que un `UserEntitlement` temporal pueda habilitar el input del Advisor sin abrir el módulo globalmente.

## Evidencia del bloqueo

El usuario QA validó en producción que la pestaña `Senior Advisor` aparece, pero el panel sigue en estado bloqueado:

- `Plan locked`.
- `0 / 0 used`.
- `Starter / Free Preview`.
- textarea deshabilitado.
- suggested prompts no utilizables.
- botón `Send to Senior Advisor` sin posibilidad de enviar.

## Diagnóstico

El entitlement temporal QA existe en Neon producción y está activo:

- Usuario QA: `vivianafernandez@gmail.com`.
- `planKey`: `internal_qa`.
- `aiEnabled`: `true`.
- `fullReportEnabled`: `false`.
- expiración: `2026-06-06T23:59:59.000Z`.

La auditoría del código confirmó que el servicio del Advisor consulta `UserEntitlement` mediante `getEffectiveUserEntitlement` y prioriza `userEntitlementPlanKey` antes de `assessmentPlanLevel` y `workspacePlan`.

La brecha detectada era que `internal_qa` no existía como plan Advisor propio. El normalizador lo convertía en `partner`, mezclando una habilitación interna QA con un plan comercial. Eso dificultaba verificar el estado esperado del desbloqueo y no dejaba un contrato explícito para el entitlement temporal.

## Causa raíz

El resolver de límites del Advisor no trataba `internal_qa` como una clave propia de plan Advisor.

Archivos afectados:

- `src/server/advisor/seniorAdvisorTypes.ts`.
- `src/server/advisor/seniorAdvisorPlanLimits.ts`.
- `tests/unit/seniorAdvisorPlanLimits.test.ts`.

Variable/estado afectado:

- `usage.enabled`.
- `usage.messageLimit`.
- `usage.planLabel`.
- `usage.messagesRemaining`.

Estado esperado post-fix para el entitlement QA:

- `usage.enabled=true`.
- `planLabel=Internal QA`.
- `messageLimit=25`.
- `messagesRemaining=25` al inicio.

## Cambios realizados

Se agregó `internal_qa` como `SeniorAdvisorPlanKey` explícito.

Se agregó un límite propio para QA:

- label: `Internal QA`.
- enabled: `true`.
- messageLimit: `25`.
- request more credits: `contact_us`.
- billing real: no activo.
- deep synthesis: deshabilitado.
- executive brief: deshabilitado.

Se actualizó el normalizador:

- `internal_qa`, `advisor_qa` y `qa` resuelven a `internal_qa`.
- `admin`, `msp_partner` y `partner` siguen resolviendo a `partner`.
- `starter/free/free_preview` siguen bloqueados.

## Qué NO se abrió

- No se habilitó Advisor para todos los usuarios.
- No se habilitó Starter / Free Preview.
- No se cambió pricing real.
- No se implementó billing.
- No se cambió schema.
- No se creó migración.
- No se aplicó migración.
- No se tocó Hostinger.
- No se hizo deploy.
- No se inició ADVISOR-2.

## Validaciones

Validaciones agregadas:

- `internal_qa` habilita Advisor con cupo interno.
- `internal_qa` tiene label `Internal QA`.
- un entitlement `internal_qa` tiene prioridad sobre assessment/workspace `free`.
- un workspace/assessment `free` sin entitlement sigue bloqueado.
- alias `advisor_qa` resuelve a `internal_qa`.

## Estado esperado post-deploy

Cuando el runtime tome este commit, el usuario QA con entitlement activo debería ver:

- `Internal QA`.
- `0 / 25 used` o equivalente.
- textarea habilitado.
- suggested prompts clickeables.
- botón de envío habilitado al escribir texto.

Si producción siguiera mostrando `Starter / Free Preview` después del deploy, la causa probable ya no sería el mapping local, sino uno de estos puntos:

- runtime no actualizado;
- sesión del usuario no refrescada;
- usuario autenticado distinto al usuario del entitlement;
- entitlement no leído por el runtime productivo;
- caché de página/servidor.

## Cómo revertir

Revertir el commit de código restaura el mapping anterior, donde `internal_qa` no existe como plan propio. El entitlement QA en DB puede expirar naturalmente o revocarse en un hito operativo separado si ya no se necesita.

## Riesgos pendientes

- Validar post-deploy que el input queda habilitado para QA.
- Ejecutar smoke con mensaje real.
- Validar persistencia del historial.
- Validar `AiUsageEvent` con `senior_advisor_message`.
- Validar fallback si AI está disabled, budget blocked o provider falla.
- Definir política futura de credits, billing, retention/export/delete.

## Próximo paso

Ejecutar `ADVISOR-SMOKE-1D` después de que el runtime tome el commit:

- enviar mensaje QA no sensible;
- validar respuesta o fallback controlado;
- recargar;
- confirmar historial persistente;
- confirmar contador actualizado;
- confirmar usage tracking.

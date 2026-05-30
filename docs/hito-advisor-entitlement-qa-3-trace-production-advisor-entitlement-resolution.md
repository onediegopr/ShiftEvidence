# HITO ADVISOR-ENTITLEMENT-QA-3 — Trace Production Advisor Entitlement Resolution

## Objetivo

Diagnosticar por qué `Senior Migration Advisor` seguía mostrando `Plan locked`, `Starter / Free Preview` y `0 / 0 used` en producción para el assessment `qwqw`, aunque existía un entitlement QA `internal_qa`.

El objetivo operativo era desbloquear el input del Advisor para QA sin abrir el módulo globalmente para usuarios Free.

## Evidencia del bloqueo

En producción, el assessment observado era:

- title: `qwqw`;
- assessment plan: `free`;
- workspace plan: `free`;
- tab `Senior Advisor`: visible;
- estado Advisor: `Plan locked`;
- contador: `0 / 0 used`;
- plan label: `Starter / Free Preview`;
- textarea: disabled;
- send button: disabled.

## Diagnóstico local

El código local en `main` ya contiene:

- `8cbda34 fix: resolve Senior Advisor QA entitlement unlock`;
- `internal_qa` como `SeniorAdvisorPlanKey`;
- label `Internal QA`;
- `messageLimit=25`;
- aliases `internal_qa`, `advisor_qa`, `qa`;
- prioridad de `userEntitlementPlanKey` sobre `assessmentPlanLevel` y `workspacePlan`.

El resolver efectivo vive en:

- `src/server/advisor/seniorAdvisorService.ts`;
- `src/server/advisor/seniorAdvisorPlanLimits.ts`;
- `src/server/admin/runtimeSettingsService.ts`.

Flujo relevante:

1. `getSeniorAdvisorPanelState` recibe `session.user.id`.
2. `getAdvisorUsageState` llama `getEffectiveUserEntitlement(session.user.id)`.
3. Si no hay entitlement activo para ese userId, el resolver cae a `assessment.planLevel`.
4. Como `qwqw` tiene plan `free`, el resultado final es `starter`.

## Verificación Neon read-only

Se consultó Neon producción en modo lectura para:

- usuario `vivianafernandez@gmail.com`;
- entitlement QA existente;
- assessment `qwqw`;
- workspace owner;
- membresías del workspace.

Resultado:

- `vivianafernandez@gmail.com` existe.
- El entitlement `advisor-qa-20260530-viviana` existe y está activo.
- El entitlement tiene `planKey=internal_qa`.
- El assessment `qwqw` no pertenece al workspace de `vivianafernandez@gmail.com`.
- `vivianafernandez@gmail.com` no es owner ni miembro del workspace de `qwqw`.
- El owner real de `qwqw` es `diegoperezroca@gmail.com`.
- El owner real no tenía entitlement Advisor activo antes de este hito.

## Causa raíz

La causa raíz fue un mismatch entre entitlement y usuario/assessment:

- El entitlement QA estaba asignado a `vivianafernandez@gmail.com`.
- El assessment observado `qwqw` pertenece a `diegoperezroca@gmail.com`.
- `getAdvisorUsageState` resuelve entitlements por `session.user.id`.
- Para el owner real de `qwqw`, `entitlement?.planKey` era `undefined`.
- El resolver caía correctamente a `assessment.planLevel=free`.
- Por eso la UI recibía `Starter / Free Preview`, `enabled=false` y `messageLimit=0`.

No se confirmó un bug adicional en `internal_qa`, `fullReportEnabled`, `aiEnabled` ni en el orden de prioridad del resolver.

## Corrección QA aplicada

Se creó un entitlement QA temporal para el usuario dueño real del assessment `qwqw`:

- entitlement id: `advisor-qa-20260530-diego-qwqw`;
- user: `diegoperezroca@gmail.com`;
- userId: `ZSFJ5w7JCupsWQUv5U8hB96I0C3Xt7kP`;
- assessment: `qwqw`;
- assessmentId: `cmpsoc5zt0009495ilx9atccf`;
- workspaceId: `cmpom1b8p0011izfghk7eo08g`;
- `planKey`: `internal_qa`;
- `aiEnabled`: `true`;
- `fullReportEnabled`: `false`;
- source: `advisor_entitlement_qa_3`;
- expiry: `2026-06-06T23:59:59.000Z`.

También se registró audit event:

- audit id: `audit-advisor-qa-3-diego-qwqw-20260530`;
- eventType: `advisor_qa_entitlement_granted`.

## Qué se habilita

Se habilita temporalmente el Advisor para el usuario dueño real del assessment `qwqw` mediante entitlement user-scoped.

Estado esperado post-refresh/post-deploy:

- plan label: `Internal QA` si el runtime incluye `8cbda34`;
- counter: `0 / 25 used` o equivalente;
- textarea enabled;
- suggested prompts enabled;
- send button enabled when text is present.

Si el runtime todavía no incluye `8cbda34`, `internal_qa` podría aparecer con el mapping anterior. Aun así, debería dejar de caer a `Starter / Free Preview` porque el owner ya tiene entitlement activo.

## Qué sigue bloqueado

- Free/Starter sigue bloqueado sin entitlement.
- No se cambió el plan del workspace.
- No se cambió el plan del assessment.
- No se habilitó billing real.
- No se habilitó full report/PDF por este entitlement.
- No se abrió Advisor para todos los usuarios.
- No se modificó pricing.

## Seguridad

Este hito no ejecutó:

- migraciones;
- `db push`;
- `migrate reset`;
- cambios de schema;
- cambios de env vars;
- cambios en pricing;
- deploy;
- ADVISOR-2;
- Memory Vault;
- RAG.

La única mutación productiva fue un entitlement QA temporal y auditado para el usuario correcto.

## Validaciones pendientes

Después de que la sesión o runtime refresque:

1. Abrir `qwqw` con el usuario owner real.
2. Entrar a tab `Senior Advisor`.
3. Confirmar `Internal QA` o, como mínimo, un plan Advisor habilitado.
4. Confirmar contador no cero.
5. Confirmar textarea habilitado.
6. Enviar:

```text
What should I complete next in this assessment?
```

7. Validar respuesta o fallback controlado.
8. Recargar.
9. Validar historial persistente.
10. Validar `AiUsageEvent.operationType=senior_advisor_message`.

## Riesgos pendientes

- Confirmar runtime deployado con `8cbda34`.
- Confirmar que la sesión productiva refrescó el entitlement.
- Ejecutar smoke real con mensaje.
- Validar persistencia.
- Validar usage tracking.
- Definir revocación/expiración operacional del entitlement QA.
- ADVISOR-2 Memory Vault sigue pendiente.

## Próximo paso

Ejecutar `ADVISOR-SMOKE-1E` con envío real del mensaje, persistencia y verificación de usage tracking.

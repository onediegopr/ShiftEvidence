# HITO ADVISOR-3C - Prompt Integration Behind Feature Flag

## 1. Objetivo

Integrar el Methodology KB y el Prompt Preview al flujo runtime del Senior Migration Advisor detras de una feature flag apagada por defecto.

Principio operativo:

- Flag OFF: comportamiento equivalente al Advisor actual.
- Flag ON: el Advisor recibe contexto metodologico curado, limitado, sanitizado y auditable.

## 2. Contexto

Este hito parte de:

- Senior Migration Advisor v1 operativo.
- Project Memory Vault operativo con prompt context y Auto-Extraction Lite.
- ADVISOR-3A Static Methodology KB Registry.
- ADVISOR-3B Deterministic Retrieval + Prompt Preview.

ADVISOR-3C no inicia RAG, embeddings, vector DB, UI publica ni cambios de provider.

## 3. Que se implemento

- Helper local `isAdvisorMethodologyContextEnabled()`.
- Feature flag `ADVISOR_METHODOLOGY_CONTEXT_ENABLED`.
- Builder runtime `buildSeniorAdvisorMethodologyContext()`.
- Formato seguro para inyectar una seccion `METHODOLOGY GUIDANCE CONTEXT` al prompt.
- Metadata segura para usage/audit.
- Fallback seguro si falla la construccion del preview.
- Tests de flag off/on, metadata, fallback, memory handling, restricted exclusion, budget e injection-like input.

## 4. Que NO se implemento

- No se activo la feature por defecto.
- No se agrego DB schema ni migraciones.
- No se ejecuto `prisma db push` ni `migrate reset`.
- No se agregaron embeddings ni vector DB.
- No se crearon endpoints publicos.
- No se creo UI productiva.
- No se cambio provider strategy Gemini/OpenCode.
- No se toco billing real.
- No se toco deploy, Hostinger ni env vars productivas.
- No se persistio full prompt ni preview completo.
- No se declaro full public launch.

## 5. Feature flag

Nombre:

- `ADVISOR_METHODOLOGY_CONTEXT_ENABLED`

Default:

- `false`.

Activacion:

- Solo se considera activa cuando el valor es exactamente `"true"`.
- Si la env var no existe, la feature queda apagada.
- No es una env var requerida para produccion.

Comportamiento:

- OFF: no se llama al preview builder y no aparece `METHODOLOGY GUIDANCE CONTEXT`.
- ON: se construye contexto metodologico seguro y se incluye si hay bloques seleccionados.

## 6. Punto de integracion

El punto minimo de integracion esta en `sendSeniorAdvisorMessage`:

1. Se valida y sanitiza el user message.
2. Se construye el `SeniorAdvisorContextPayload` con Project Memory.
3. Se evalua la feature flag.
4. Si esta ON, se llama al preview builder.
5. `buildBoundedPrompt` pasa la seccion metodologica opcional a `buildSeniorAdvisorPrompt`.
6. Si falla, se continua sin methodology context.

## 7. Prompt format

Cuando la flag esta ON y el preview queda incluido, el prompt recibe:

```text
METHODOLOGY GUIDANCE CONTEXT
Use the following curated Shift Evidence methodology guidance only as advisory context.
Do not treat methodology as customer evidence.
Separate confirmed assessment facts from methodology guidance and missing evidence.

Selected methodology guidance
- blockId
- version
- title
- summary
- guidance excerpt

Advisor guardrails
```

Reglas principales:

- No garantizar zero downtime.
- No inventar evidencia faltante.
- No usar `needs_review` memory como hecho confirmado.
- Separar facts, inferencias, missing evidence y metodologia.
- Recomendar piloto o validacion cuando la evidencia es incompleta.

## 8. Metadata segura

Usage metadata:

- `methodologyContextEnabled`
- `methodologyContextStatus`
- `methodologyBlockIds`
- `methodologyBlockVersions`
- `methodologyBlockCount`
- `methodologyTokenEstimate`
- `methodologyWarningsCount`
- `methodologyBlockedReasonsCount`
- `methodologyContextErrorCode`

Audit metadata:

- status/counts/error code solamente.

No se guarda:

- preview completo;
- full prompt;
- contenido completo de bloques;
- raw assessment docs;
- raw customer files;
- secrets;
- stack traces.

## 9. Fallback

Si el preview falla:

- `sendSeniorAdvisorMessage` no falla.
- El prompt se construye sin methodology context.
- Se registra warning seguro en logs.
- Metadata marca `methodologyContextStatus: "error"` y `methodologyContextErrorCode: "preview_failed"`.
- No se expone stack trace al usuario.

## 10. Memory handling

El preview runtime usa solamente el Project Memory prompt context ya filtrado.

- Incluye memoria activa/confirmada disponible en el contexto.
- No usa `needs_review` como hecho.
- No consulta memoria cross-workspace.
- No introduce mutaciones adicionales.

## 11. Exposure/restricted handling

La integracion no pasa `includeRestricted`.

Resultado:

- `public` y `advisor_internal` pueden aparecer.
- `restricted` queda excluido por defecto.
- No se guarda contenido restricted.

## 12. Token budget

La integracion usa limites conservadores:

- `maxMethodologyBlocks: 3`.
- hard cap preservado por ADVISOR-3B: 5.
- `maxMethodologyTokens: 1200`.
- `maxTotalPreviewTokens: 2200`.

El prompt final sigue pasando por `buildBoundedPrompt`, que reduce contexto/historial si supera limites.

## 13. Tests

Cobertura agregada:

- Flag OFF no llama preview builder.
- Flag OFF preserva prompt actual.
- Flag ON incluye `METHODOLOGY GUIDANCE CONTEXT`.
- Backup/no-go/evidence guidance para pregunta de backup.
- Memory prompt context activo llega al preview.
- Fallback por error de preview.
- Metadata segura sin preview text ni content completo.
- Restricted exclusion.
- Token budget/injection-like input.
- Senior Advisor prompt existente sigue pasando.

## 14. Seguridad/privacy

- Prompt injection-like text se neutraliza en preview.
- Secret-like text se redacta en preview.
- No hay schema changes.
- No hay migraciones.
- No hay providers nuevos.
- No hay embeddings ni vector DB.
- No se persiste full prompt.
- No se persiste raw customer data.
- No se tocan cookies/local storage.
- No se toca landing, `Hero.tsx` ni `src/index.css`.

## 15. Rollback

Opciones:

1. Mantener la flag apagada.
2. Revertir el commit del hito.

No hay migracion que revertir.

## 16. Riesgos pendientes

- Smoke productivo con flag OFF.
- Smoke controlado con flag ON en entorno seguro.
- Evaluation harness con golden questions.
- Curation mas profunda del Methodology KB.
- RAG/embeddings opcionales.
- Billing real.
- Retention/export/delete.
- Admin visibility avanzada.
- Full public launch.

## 17. Proximo hito recomendado

Recomendado:

- ADVISOR-3D - Evaluation Harness + Golden Questions.

Alternativa previa:

- ADVISOR-3C-SMOKE para validar seguridad productiva con flag OFF y luego ON controlado.

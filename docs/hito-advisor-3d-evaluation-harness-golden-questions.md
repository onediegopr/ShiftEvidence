# HITO ADVISOR-3D - Evaluation Harness + Golden Questions

## 1. Objetivo

Crear un Evaluation Harness deterministico para validar Methodology KB + Prompt Preview + Feature Flag antes de cualquier activacion productiva.

El objetivo es verificar, de forma local y testeable, que las preguntas criticas seleccionan bloques metodologicos correctos, respetan guardrails, excluyen contenido inseguro y se mantienen dentro del budget.

## 2. Contexto

Este hito se apoya en:

- ADVISOR-3A: Static Methodology KB Registry.
- ADVISOR-3B: Deterministic Retrieval + Prompt Preview.
- ADVISOR-3C: Prompt Integration Behind Feature Flag.

ADVISOR-3D no activa la flag, no toca produccion y no llama providers.

## 3. Que implementa

- Fixtures sinteticos de assessment.
- Fixtures sinteticos de Project Memory confirmado y `needs_review`.
- 12 golden questions.
- Expected block IDs por caso.
- Expected any-block IDs opcionales.
- Forbidden block IDs opcionales.
- Expected guardrail phrases.
- Forbidden phrases.
- Expected warnings.
- Harness deterministico para evaluar cada caso.
- Suite runner para todos los casos.
- Tests unitarios para suite, casos criticos, seguridad, deterministicidad y failure reporting.

## 4. Que NO implementa

- RAG productivo.
- Embeddings.
- Vector DB.
- Endpoints.
- UI.
- Dashboard admin.
- Smoke productivo.
- Env vars productivas.
- Deploy.
- Provider calls.
- DB/migrations.
- Billing.
- Persistencia de full prompt o preview completo.

## 5. Estructura de archivos

```text
src/server/advisor/methodology/evaluation/evaluationTypes.ts
src/server/advisor/methodology/evaluation/evaluationFixtures.ts
src/server/advisor/methodology/evaluation/goldenQuestions.ts
src/server/advisor/methodology/evaluation/evaluationHarness.ts
src/server/advisor/methodology/evaluation/index.ts
src/server/advisor/methodology/evaluation/__tests__/evaluationHarness.test.ts
tests/unit/methodologyEvaluationHarness.test.ts
docs/hito-advisor-3d-evaluation-harness-golden-questions.md
```

Tambien se exporta `./evaluation` desde `src/server/advisor/methodology/index.ts`.

## 6. Golden questions

Casos incluidos:

1. `backup_missing_no_go`
2. `zero_downtime_guarantee`
3. `ceph_suitability`
4. `migration_waves`
5. `low_confidence_missing_evidence`
6. `erp_critical_validation`
7. `missing_proxmox_target`
8. `network_unknowns`
9. `needs_review_memory_not_fact`
10. `prompt_injection_attempt`
11. `internal_methodology_dump`
12. `business_continuity_risk`

Cobertura funcional:

- backup/restore/RPO/RTO;
- zero downtime claims;
- Ceph suitability;
- wave planning;
- readiness vs confidence;
- ERP/critical workloads;
- Proxmox target gaps;
- VLAN/port group mapping;
- `needs_review` memory exclusion;
- prompt injection;
- internal methodology dump requests;
- business continuity risk.

## 7. Fixtures sinteticos

Assessment base:

- synthetic VMware to Proxmox assessment;
- 126 VMs;
- 6 ESXi hosts;
- partial Proxmox target data;
- received evidence: RVTools export, client context form;
- missing evidence: backup export, application dependency map, Proxmox target export;
- risks: old snapshots, missing backup evidence, multi-NIC VMs, ERP critical workload, unclear VLAN mapping;
- readinessScore: 64;
- confidenceScore: 58;
- migrationDecision: `conditional_go`.

Memory fixtures:

- confirmed conservative wave plan;
- confirmed domain controller pilot constraint;
- `needs_review` ERP shortcut that must never appear as fact.

No clientes reales ni datos productivos.

## 8. Evaluation criteria

Cada caso verifica:

- expected block IDs presentes;
- optional any-of block IDs;
- forbidden block IDs ausentes;
- expected guardrail phrases presentes;
- forbidden phrases ausentes;
- expected warnings presentes;
- token budget respetado;
- restricted exposure excluido;
- `needs_review` memory excluida;
- methodology context presente/ausente segun el caso.

## 9. Success/failure model

`evaluateGoldenQuestionCase(testCase)` devuelve:

- `ok`;
- `selectedBlockIds`;
- `missingExpectedBlockIds`;
- `matchedExpectedAnyBlockIds`;
- `unexpectedForbiddenBlockIds`;
- `missingGuardrails`;
- `forbiddenPhraseHits`;
- `missingExpectedWarnings`;
- `tokenBudgetOk`;
- `restrictedExposureOk`;
- `needsReviewExcluded`;
- `previewIncluded`;
- `warnings`;
- `blockedReasons`;
- `summary`;
- `preview`.

`runMethodologyEvaluationSuite()` devuelve:

- `ok`;
- `total`;
- `passed`;
- `failed`;
- `results`.

El resultado es deterministico y ordenado.

## 10. Security/privacy coverage

Cubierto:

- no provider calls;
- no DB;
- no network;
- no customer raw data;
- no secrets;
- no cookies/local storage;
- no full prompt persistence;
- no preview persistence;
- restricted blocks excluidos por default.

## 11. Prompt injection coverage

El caso `prompt_injection_attempt` valida que:

- el input malicioso se neutraliza;
- se registra warning/bloqueo seguro;
- no aparece `system prompt:`;
- no aparece `developer message`;
- no aparece `guaranteed migration`;
- se selecciona `advisor_boundaries`.

## 12. Memory handling coverage

El caso `needs_review_memory_not_fact` valida que:

- Project Memory confirmado puede participar;
- Project Memory `needs_review` se excluye;
- el contenido `ERP can be migrated first without validation.` no aparece en preview;
- aparece warning por exclusion de memoria no confirmada.

## 13. Token budget coverage

Cada caso valida:

- `preview.tokenEstimate.total <= maxTotalPreviewTokens`;
- truncation esperada si el caso lo define;
- los budgets se mantienen sin snapshots fragiles de texto completo.

## 14. Tests ejecutados

Focused:

```text
npm run test:run -- evaluationHarness methodologyPromptPreview methodologyRetrieval
npm run test:run -- evaluationHarness methodology
```

Resultados de cierre:

```text
focused evaluation/methodology: 5 files / 43 tests passed
full suite: 57 files / 270 tests passed
```

Tambien se agrego un entrypoint en `tests/unit` para que la suite dorada forme parte de `npm run test:run`.

Validaciones generales:

- `npm run lint`: OK.
- `npm run typecheck`: OK.
- `npm run test:run`: OK.
- `npm run build`: bloqueado por `EPERM unlink` local sobre `.next/static` despues de `prisma generate` OK. No se limpio `.next` ni se hicieron cambios destructivos.

## 15. Rollback

Rollback simple:

1. Revertir el commit de ADVISOR-3D.
2. No hay migracion DB.
3. No hay env var que revertir.
4. No hay deploy que revertir.

La feature flag de ADVISOR-3C permanece apagada por defecto.

## 16. Proximo hito recomendado

Recomendado:

- ADVISOR-3E - Controlled Smoke Flag OFF/ON.

Alternativa:

- ADVISOR-3D-HARDEN si se quiere ampliar los casos dorados antes del smoke controlado.

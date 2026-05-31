# HITO ADVISOR-3B - Deterministic Retrieval + Prompt Preview

## 1. Objetivo

Implementar una capa segura de deterministic retrieval + prompt/context preview para la Methodology KB del Senior Migration Advisor.

Este hito construye un puente testeable entre:

- Methodology KB registry;
- assessment context resumido;
- Project Memory confirmada/active;
- user question;
- futura composicion de prompt.

No activa el uso productivo de Methodology KB en el Advisor.

## 2. Contexto

ADVISOR-3A dejo implementado:

- registry estatico de Methodology KB;
- 12 bloques activos;
- validadores;
- helpers;
- retrieval lite por tags/keywords/domains/use cases;
- tests.

ADVISOR-3B agrega una capa de preview pura, sin DB ni providers, para observar que bloques se seleccionarian, por que se seleccionan, como se truncan y como se presentarian en un contexto futuro.

## 3. Que implementa

Implementado:

- `methodologyPromptPreview.ts`;
- input/output tipados para preview;
- sanitizacion local de strings;
- deteccion/redaccion de secret-like content;
- neutralizacion de prompt-injection-like text;
- exclusion de raw file content obvious;
- exclusion de memory no confirmada;
- assessment-derived retrieval hints;
- token estimate simple;
- budgets por assessment, memory, methodology y total;
- truncation segura;
- previewText estructurado;
- selectedBlocks con razones, score y matches;
- golden tests.

## 4. Que NO implementa

No implementa:

- llamadas a Gemini;
- llamadas a OpenCode Go;
- DB;
- migrations;
- Prisma schema changes;
- endpoints;
- UI;
- runtime integration en `sendSeniorAdvisorMessage`;
- persistencia de preview;
- embeddings;
- vector DB;
- full public launch.

## 5. Arquitectura

Archivo principal:

```text
src/server/advisor/methodology/methodologyPromptPreview.ts
```

Export principal:

```ts
buildAdvisorMethodologyContextPreview(input)
```

El servicio:

1. Sanitiza user question, assessment summary y memory input.
2. Deriva retrieval hints desde pregunta y assessment.
3. Llama `selectMethodologyBlocks`.
4. Compone secciones de preview.
5. Aplica token budgets.
6. Devuelve selected block metadata y warnings.

No lee filesystem.
No lee DB.
No llama red.
No modifica runtime productivo.

## 6. Input/output del preview builder

Input conceptual:

- `userQuestion`;
- `assessmentSummary`;
- `confirmedMemoryItems`;
- `retrievalHints`;
- `options`.

`assessmentSummary` puede incluir:

- assessmentId;
- environmentSummary;
- evidenceReceived;
- evidenceMissing;
- keyRisks;
- readinessScore;
- confidenceScore;
- migrationDecision.

`confirmedMemoryItems` acepta:

- id;
- title;
- content;
- type;
- status.

Output:

- `ok`;
- `previewText`;
- `sections.assessmentContext`;
- `sections.confirmedMemoryContext`;
- `sections.methodologyContext`;
- `sections.guardrails`;
- `selectedBlocks`;
- `tokenEstimate`;
- `warnings`;
- `blockedReasons`.

## 7. Retrieval enrichment

ADVISOR-3B usa `selectMethodologyBlocks` de ADVISOR-3A y agrega hints derivados.

Reglas principales:

- backup/restore/RPO/RTO/PBS/Veeam -> `backup_readiness`, `no_go_validations`, `evidence_confidence`;
- Ceph/OSD/failure domain -> `ceph_suitability`, `storage_readiness`;
- downtime/rollback/critical/ERP/SQL/DC -> `business_continuity_risk`, `no_go_validations`;
- waves/migrate first/pilot -> `migration_waves`, `pilot_selection`;
- low confidence/missing evidence -> `evidence_confidence`, `advisor_boundaries`;
- zero downtime/guarantee -> `advisor_boundaries`, `business_continuity_risk`;
- Proxmox target/storage data missing -> `storage_readiness`, `evidence_confidence`, `no_go_validations`.

Scoring se mantiene deterministico:

- tags;
- keywords;
- use cases;
- domains;
- tie-break por block ID.

Se ajusto el scoring para dar mas peso a tags que coinciden exactamente con el block ID.

## 8. Token budget

Estimacion:

```ts
Math.ceil(text.length / 4)
```

Defaults:

- maxAssessmentTokens: 1200;
- maxMemoryTokens: 800;
- maxMethodologyTokens: 1400;
- maxTotalPreviewTokens: 3500;
- maxMethodologyBlocks: 3;
- hard maxMethodologyBlocks: 5.

Si se excede:

- se trunca la seccion afectada;
- se agrega warning;
- no se rompe el preview.

## 9. Truncation

La truncation es por seccion:

- assessment context;
- confirmed memory;
- methodology guidance;
- preview total.

El texto truncado termina con:

```text
[truncated]
```

## 10. Sanitizacion / prompt injection

Se detectan y neutralizan patrones:

- API key;
- `password=`;
- `secret=`;
- `token=`;
- private key;
- `DATABASE_URL`;
- `GEMINI_API_KEY`;
- `OPENCODE_API_KEY`;
- ignore previous instructions;
- reveal system prompt;
- show hidden prompt;
- print secrets;
- developer message;
- system message.

Secret-like content se reemplaza por:

```text
[REDACTED]
```

Prompt-injection-like text se reemplaza por:

```text
[UNTRUSTED_INSTRUCTION_REDACTED]
```

Raw file content obvious se excluye.

## 11. Memory handling

Reglas:

- incluye solo memory con status `active`, `confirmed` o `user_confirmed`;
- excluye `needs_review`;
- excluye memory sin status confirmado;
- sanitiza title/content;
- redacted secrets;
- no trata memory como evidencia tecnica confirmada automaticamente.

Esto conserva el contrato de Project Memory Vault: `needs_review` no se usa como hecho.

## 12. Exposure handling

Defaults:

- allowed exposure: `public` + `advisor_internal`;
- `restricted` excluido.

Aunque se habilite `includeRestricted`, no hay bloques restricted activos actualmente.

El preview no dumpea metodologia interna restringida ni hidden prompts.

## 13. Golden questions

Tests cubren:

1. Which VMs should migrate first?
2. Can we migrate without backup evidence?
3. Is Ceph recommended for this environment?
4. What does low confidence mean?
5. Can we guarantee no downtime?
6. What should we validate before moving ERP?
7. How should we group migration waves?
8. What if Proxmox target data is missing?
9. needs_review memory exclusion.
10. active/confirmed memory inclusion.
11. restricted blocks excluded by default.
12. maxBlocks respected.
13. prompt injection text neutralized.
14. secret-like text redacted.
15. token budget truncation.
16. no provider/DB side effects.

## 14. Tests

Archivo agregado:

```text
tests/unit/methodologyPromptPreview.test.ts
```

Focused methodology suite:

```text
3 files / 34 tests passed
```

Incluye los tests previos de registry/retrieval y los nuevos de preview.

## 15. Seguridad/privacy

Confirmado:

- no DB;
- no providers;
- no network;
- no env vars;
- no secrets impresos;
- no raw customer docs;
- no raw uploaded files;
- no cookies/local storage;
- no runtime Advisor integration;
- no public endpoint;
- no UI;
- no landing;
- no full public launch.

## 16. Rollback

Rollback simple:

- revertir commit ADVISOR-3B;
- no DB rollback;
- no migration rollback;
- no env rollback;
- no provider rollback;
- no deploy manual rollback;
- no runtime Advisor behavior rollback porque no se activo en produccion.

## 17. Proximo paso recomendado

Siguiente hito recomendado:

```text
ADVISOR-3C - Prompt Integration Behind Feature Flag
```

Alcance recomendado:

- integrar preview/retrieval al prompt builder detras de feature flag;
- registrar metadata segura de block IDs/versiones;
- no activar publicamente;
- agregar evaluation harness mas profundo antes de smoke productivo.

Alternativa si se quiere mas rigor antes de integrar:

```text
ADVISOR-3B-HARDEN - Preview Evaluation Harness
```

Con fixtures, snapshots de prompt preview y golden questions extendidas.

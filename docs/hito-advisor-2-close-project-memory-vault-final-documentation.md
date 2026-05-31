# HITO ADVISOR-2-CLOSE - Project Memory Vault Final Documentation

## 1. Executive Summary

Project Memory Vault basico queda cerrado operativamente.

Estado: COMPLETO.

Veredicto: listo como base de memoria estructurada por assessment para el Senior Migration Advisor.

Full public launch: NO declarado.

ADVISOR-3/RAG: no iniciado.

Este cierre consolida ADVISOR-2-AUDIT-SPEC, ADVISOR-2A, ADVISOR-2B, ADVISOR-2C, ADVISOR-2D y ADVISOR-2E. El bloque deja una memoria revisable, auditable y acotada por assessment/workspace, integrada al panel y al prompt del Advisor, con migracion productiva aplicada y smoke autenticado validado por user-attestation.

## 2. Product Purpose

Project Memory Vault es una capa de memoria estructurada por assessment para el Senior Migration Advisor.

No es un simple chat log. El chat conserva la conversacion; Project Memory conserva conocimiento durable y revisable del proyecto:

- decisiones;
- preguntas abiertas;
- proximos pasos;
- constraints;
- interpretaciones de riesgo;
- preferencias, recomendaciones y notas relevantes.

Su proposito es ayudar al Advisor a mantener continuidad entre interacciones sin mezclar clientes, workspaces o assessments. Cada item de memoria esta asociado al assessment y workspace actual, y lleva labels de fuente y verdad para evitar tratar supuestos o informacion reportada como evidencia tecnica confirmada.

## 3. What Was Implemented

### 3.1 Database / Prisma

Se implemento el modelo `AssessmentAdvisorMemoryItem`.

Enums implementados:

- `AssessmentAdvisorMemoryItemType`;
- `AssessmentAdvisorMemoryItemStatus`;
- `AssessmentAdvisorMemorySourceType`;
- `AssessmentAdvisorMemoryTruthStatus`.

Migracion:

- `20260530220000_advisor_2a_project_memory_vault`.

Estado en produccion:

- aplicada en Neon;
- proyecto `InfraShift`;
- branch `production` / `br-raspy-morning-ap11hfm6`;
- database `neondb`;
- tabla `AssessmentAdvisorMemoryItem` presente;
- enums Memory presentes;
- `finished_at = 2026-05-31T00:12:02.896Z`;
- `rolled_back_at = null`;
- `logs = null`;
- `failed_count = 0`.

La migracion fue aditiva: creo enums, tabla, indices y foreign keys. No incluyo drops, renames, deletes, backfill ni columnas obligatorias sobre tablas existentes.

### 3.2 Core Services

Servicios implementados:

- `src/server/advisor/advisorMemoryTypes.ts`;
- `src/server/advisor/advisorMemoryPlanLimits.ts`;
- `src/server/advisor/advisorMemorySecurity.ts`;
- `src/server/advisor/advisorMemoryValidation.ts`;
- `src/server/advisor/advisorMemoryService.ts`;
- `src/server/advisor/advisorMemoryExtractionService.ts`;
- `src/server/advisor/advisorMemoryPromptContext.ts`.

Capacidades principales:

- create;
- list;
- confirm;
- reject;
- resolve;
- archive;
- supersede;
- context builder;
- prompt context builder;
- plan-aware limits;
- ownership checks;
- audit events.

ADVISOR-2A dejo la base de servicios y lifecycle. ADVISOR-2C agrego el contrato de memoria para prompt, limites de contexto, compactacion y fallback seguro.

### 3.3 UI / Actions

Se implemento un Project Memory Panel dentro del Senior Advisor.

Grupos en UI:

- review;
- decisions;
- questions;
- next steps;
- other.

Server actions implementadas:

- list memory items;
- confirm;
- reject;
- resolve;
- archive;
- create manual memory item;
- save Advisor recommendation as memory;
- supersede.

La UI incluye:

- empty state;
- locked state por plan;
- manual notes;
- lifecycle buttons;
- agrupacion de items;
- fallback seguro si la tabla/accion de memory no esta disponible.

ADVISOR-2B agrego la capa visual y de acciones sin alterar aun el prompt. ADVISOR-2C conecto la memoria al contexto del Advisor.

### 3.4 Prompt Context Integration

Project Memory entra al contexto del Senior Advisor mediante `projectMemory`.

Reglas de inclusion:

- solo memoria `active`;
- solo del assessment/workspace actual;
- excluye `rejected`;
- excluye `superseded`;
- excluye `archived`;
- excluye `needs_review`;
- excluye raw file contents;
- excluye secrets.

Labels preservados:

- `truthStatus`;
- `sourceType`.

El prompt instruye al Advisor a:

- usar Project Memory solo para este assessment;
- no tratar `customer_reported` o `inferred` como evidencia tecnica confirmada;
- priorizar deterministic assessment state si hay conflicto;
- explicar el conflicto cuando corresponda;
- usar open questions para proponer proximas acciones;
- usar decisions para continuidad;
- usar constraints para no repetir recomendaciones inadecuadas;
- no inventar evidencia desde memoria;
- no exponer metadata interna/sistema al usuario.

Metadata segura en `AiUsageEvent`:

- `memoryIncluded`;
- `memoryItemCount`;
- `memoryContextChars`;
- `memoryFallbackReason`.

No se persisten full prompts, secrets, raw file contents ni titulos/summaries crudos en usage metadata.

### 3.5 Release / Smoke

ADVISOR-2D:

- aplico la migracion en Neon produccion;
- valido `_prisma_migrations`;
- valido tabla y enums;
- confirmo `failed_count=0`;
- completo smoke publico.

ADVISOR-2E:

- cerro smoke autenticado por user-attestation;
- usuario confirmo: "dar como valido el smoke, esta ok";
- Project Memory Panel OK por usuario;
- Prompt memory OK por usuario;
- no error critico reportado.

Full public launch no fue declarado.

## 4. Lifecycle

Estados:

- `needs_review`: candidato o item que requiere revision antes de entrar al prompt context.
- `active`: item vigente y elegible para contexto/prompt.
- `resolved`: item cerrado porque ya fue atendido.
- `superseded`: item reemplazado por una version posterior.
- `rejected`: item descartado.
- `archived`: item retirado de la vista activa.

Operaciones:

- `create`: crea un item manual o desde una accion controlada.
- `confirm`: mueve un item revisable a memoria activa.
- `reject`: descarta un item.
- `resolve`: marca un item como resuelto.
- `archive`: retira un item de uso activo.
- `supersede`: reemplaza un item por uno nuevo y conserva trazabilidad.

Exclusiones del prompt context:

- `rejected`;
- `superseded`;
- `archived`;
- `needs_review`.

Solo `active` entra al contexto del Advisor.

## 5. Security / Privacy

Controles implementados:

- aislamiento por `assessmentId` + `workspaceId`;
- ownership obligatorio para acciones y lecturas;
- sanitizacion de texto;
- redaccion de patrones sensibles;
- exclusion de raw uploaded file contents;
- exclusion de secrets;
- sin cross-workspace leakage reportado;
- sin cross-client learning;
- audit events para lifecycle;
- metadata segura en AI usage;
- full prompt no persistido.

Project Memory no convierte contenido reportado por el cliente en evidencia tecnica confirmada. Los labels `truthStatus` y `sourceType` son parte central del contrato de seguridad epistemica.

## 6. Plan Limits / Token Economy

Limites de memoria por plan:

- free/starter: memory disabled;
- professional/readiness_report: 25 items por assessment;
- pro: 50 items por assessment;
- blueprint: 150 items por assessment;
- partner/MSP: 100 items por assessment;
- internal QA: 50 items por assessment.

Prompt context:

- professional: contexto reducido;
- pro/partner: contexto moderado;
- blueprint/internal QA: contexto mas amplio;
- max chars acotado;
- top N por categoria;
- deterministic context priority.

Prioridad de inclusion cuando el contexto se acerca al limite:

1. active decisions;
2. open questions;
3. constraints;
4. unresolved risks;
5. next steps;
6. summary;
7. other memory.

El objetivo es mantener continuidad sin inflar el prompt ni desplazar el estado deterministico del assessment.

## 7. What Is NOT Implemented Yet

No implementado todavia:

- auto-extraction post-message;
- RAG;
- embeddings;
- Methodology KB;
- proactive advisor;
- billing real;
- credit ledger real;
- admin visibility avanzada;
- retention/export/delete policy completa;
- multi-assessment memory;
- cross-client learning;
- full public launch.

Estas capacidades quedan para hitos futuros y no deben inferirse como disponibles en ADVISOR-2.

## 8. Known Risks

Riesgos pendientes:

- memory quality depende de notas manuales y acciones explicitas por ahora;
- auto-extraction pendiente;
- broader real-world QA pendiente;
- retention/delete/export pendiente;
- admin visibility limitada;
- RAG no disponible;
- Methodology KB no disponible;
- full launch no declarado.

El riesgo principal ya no es infraestructura basica de memoria, sino calidad operacional del contenido y automatizacion controlada.

## 9. Recommended Next Step Decision

### Option A - ADVISOR-2F Auto-Extraction Lite

Objetivo:

- extraer candidatos simples de memoria desde mensajes;
- crear items `needs_review`;
- evitar IA nueva o usar IA muy limitada;
- mejorar continuidad sin costo alto.

Ventajas:

- usa la memoria estructurada ya creada;
- es mas controlado que RAG;
- menor costo/tokens;
- prepara mejor la base para RAG;
- mantiene revision humana antes de inyectar memoria al prompt.

Riesgos:

- extraccion incorrecta si es demasiado automatica;
- ruido en memoria;
- requiere UI review clara;
- necesita reglas conservadoras para no convertir opiniones en hechos.

### Option B - ADVISOR-3 RAG / Methodology KB

Objetivo:

- conectar metodologia interna;
- retrieval de docs;
- responder con base en conocimiento curado del producto/metodologia;
- eventualmente usar embeddings/vector search.

Ventajas:

- gran diferencial consultivo;
- Advisor mas experto;
- metodologia reusable;
- mejor soporte para respuestas tecnicas profundas.

Riesgos:

- mas costo;
- mas complejidad;
- mayor riesgo de prompt/context bloat;
- necesita KB curada;
- requiere evaluacion de retrieval quality y seguridad.

Recomendacion:

Primero `ADVISOR-2F Auto-Extraction Lite`, luego `ADVISOR-3 RAG`.

Razon: Auto-Extraction Lite aprovecha la base estructurada actual, mejora el valor diario del Project Memory Vault y mantiene control humano. RAG tiene mayor upside, pero conviene construirlo sobre memoria mas madura y patrones de revision ya probados.

## 10. Final Verdict

Project Memory Vault basico queda cerrado operativamente.

ADVISOR-2 puede considerarse funcional como base de memoria estructurada por assessment.

Estado final estimado:

- Advisor architecture: 92-95%;
- Advisor implementation: 88-92%;
- Memory implementation: 82-88%;
- Advisor UX: 85-90%;
- Documentation: 90-95%;
- ADVISOR-2 production readiness: 85-92%.

Proximo recomendado:

`ADVISOR-2F Auto-Extraction Lite`.

Luego:

`ADVISOR-3 RAG / Methodology KB`.

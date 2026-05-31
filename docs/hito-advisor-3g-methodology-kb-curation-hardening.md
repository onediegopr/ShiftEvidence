# HITO ADVISOR-3G — Methodology KB Curation Hardening

## 1. Objetivo

Endurecer la curacion del Methodology KB usado por Senior Advisor, mejorando precision, accionabilidad, missing evidence handling y anti-overclaiming sin ampliar arquitectura.

Estado: COMPLETO.

## 2. Contexto

ADVISOR-3A/3B/3C/3D dejaron una KB estatica, retrieval deterministico, prompt preview, runtime feature flag y evaluation harness. ADVISOR-3E/3F cerraron smoke flag-on y visibilidad admin por user-attestation.

ADVISOR-3G trabaja sobre esa base sin introducir RAG libre, embeddings, vector DB, DB schema, migraciones, endpoints, UI nueva, billing, provider changes ni full public launch.

## 3. Que se endurecio

* Los 12 bloques existentes mantienen IDs estables.
* Todos los bloques suben version a `1.1.0`.
* Cada bloque suma:
  * `safeResponsePatterns`;
  * `unsafeClaims`;
  * `evidenceRequired`.
* El prompt preview incluye estos campos como guidance estructurada.
* Se refuerza la separacion entre confirmed facts, inferred risks y missing evidence.
* Se refuerzan limites conservadores para backup, waves, Ceph, target storage, business continuity, scoring y advisor boundaries.

## 4. Versionado de bloques

Los 12 bloques pasaron de `1.0.0` a `1.1.0` por cambios sustanciales de contenido y metadata metodologica:

* `evidence_confidence`
* `readiness_scoring`
* `vm_risk_classification`
* `migration_waves`
* `storage_readiness`
* `ceph_suitability`
* `backup_readiness`
* `network_readiness`
* `business_continuity_risk`
* `no_go_validations`
* `pilot_selection`
* `advisor_boundaries`

## 5. Cambios por bloque

* Evidence Confidence: refuerza confirmed/probable/missing y que baja confianza no aprueba migracion.
* Readiness Scoring: aclara que score es senal direccional, no certificacion.
* VM Risk Classification: agrega snapshots, tools, multi-NIC y business criticality como gates de validacion.
* Migration Waves: separa technical wave model de application dependency plan.
* Storage Readiness: diferencia source allocation de target fit y performance evidence.
* Ceph Suitability: refuerza que Ceph no es default y requiere evidencia de nodos, OSD, red y operacion.
* Backup Readiness: hace explicita la imposibilidad de confirmar restore/RPO/RTO sin evidencia.
* Network Readiness: distingue inventory-visible facts de firewall/routing/runtime dependencies.
* Business Continuity Risk: evita inventar impacto financiero o downtime exacto.
* No-Go Validations: separa Conditional Go/pilot de aprobacion productiva.
* Pilot Selection: refuerza pilotos reversibles, respaldados y no criticos.
* Advisor Boundaries: refuerza no hidden prompts, no restricted content y no needs_review como fact.

## 6. Nuevas golden questions

La suite pasa de 12 a 20 golden questions.

Casos agregados:

* `domain_controller_special_plan`
* `old_snapshots_risk`
* `only_rvtools_available`
* `no_application_dependencies`
* `target_storage_unknown`
* `msp_client_report`
* `business_impact_without_data`
* `performance_missing`

Los nuevos casos cubren DCs, snapshots, RVTools-only, dependency gaps, target storage unknown, lenguaje MSP seguro, impacto financiero sin datos y performance missing.

## 7. Anti-overclaiming rules

Se agrego `GLOBAL_FORBIDDEN_OVERCLAIM_PHRASES` al evaluation harness.

Patrones cubiertos:

* guaranteed safe;
* zero downtime guaranteed;
* no risk;
* migration is guaranteed;
* backup is not required;
* Ceph is always best;
* all workloads can migrate;
* you can ignore missing evidence;
* application dependencies are not needed;
* financial impact is `$`;
* exact downtime will be;
* production is safe to move now.

El harness ignora esos textos solamente cuando aparecen en lineas marcadas como `unsafe claims to avoid`, para permitir que la KB enumere claims prohibidos sin tratarlos como guidance accionable.

## 8. Coverage por bloque

Se agregan tests para asegurar:

* cada bloque aparece en al menos una golden question;
* cada bloque activo tiene version `1.1.0`;
* cada bloque activo tiene `allowedUse`, `notAllowedUse`, `safeResponsePatterns`, `unsafeClaims` y `evidenceRequired`;
* cada bloque mantiene wording de missing evidence handling;
* no hay restricted blocks en el catalogo activo por default;
* no hay overclaiming global en guidance accionable.

## 9. Retrieval tuning

No se cambio el algoritmo de scoring.

Tuning conservador aplicado:

* se agrego el tag `vm_risk_classification` al bloque de VM risk para mejorar casos de snapshots/DCs;
* las nuevas golden questions usan retrieval hints explicitos para mantener determinismo.

No se agregaron embeddings, AI retrieval, red, vector DB ni dependencias externas.

## 10. Seguridad

* No secrets.
* No customer data real.
* No raw file content.
* No DB mutation.
* No Prisma schema.
* No migrations.
* No env vars.
* No Hostinger.
* No deploy/restart.
* No provider changes.
* No embeddings/vector DB.
* No full prompt/preview persistence.
* No needs_review como fact.
* Full public launch: NO.

## 11. Tests

Tests agregados/reforzados:

* methodology evaluation harness con 20 golden questions;
* global anti-overclaiming;
* block coverage por golden questions;
* hardening metadata por bloque;
* registry checks contra overclaiming accionable.

## 12. Validaciones

Validaciones ejecutadas durante el hito:

* `npm run test:run -- methodology evaluationHarness`: OK.
* `npm run test:run -- methodologyRegistry methodologyPromptPreview`: OK.

Validaciones finales documentadas en el reporte final.

## 13. Riesgos pendientes

* Observacion productiva prolongada.
* Optional embeddings/RAG.
* Billing real.
* Retention/export/delete.
* Full public launch.

## 14. Proximo paso recomendado

Cerrar documentalmente Advisor-3 si la KB curada queda suficiente para esta etapa. Si aparece una necesidad concreta, abrir ADVISOR-3H con alcance especifico, manteniendo embeddings/RAG fuera hasta aprobacion explicita.

# HITO ACC-4 - Optional Storage & Licensing Modules UX

## Objetivo

Ordenar los modulos optativos `Storage Analysis` y `Licensing & Cost Exposure` dentro del detalle de assessment, dejando claro que mejoran la precision del informe pero no bloquean la generacion si RVTools ya esta completo.

## Avance

- Assessment Completion Center antes de ACC-4: 65-75%.
- Assessment Completion Center despues de ACC-4: 80-88%.
- Hito ACC-4: 100% local.

## Storage Analysis UX

- Titulo visible: `Storage Analysis`.
- Copy principal: modulo optativo que mejora riesgo de migracion y recomendaciones de arquitectura destino.
- Campos agregados:
  - Module decision: active, skipped, not applicable.
  - Current storage type: vSAN, SAN, NAS/NFS, Local disks, Mixed, Unknown.
  - Target storage preference: Proxmox + Ceph, Existing SAN/NAS, Local ZFS, Not decided, Not applicable.
  - Known storage constraints: Performance, Capacity, Replication, Backup, Vendor lock-in, Unknown.
  - Storage notes.
- CTAs:
  - `Save storage context`
  - `Continue later`
  - `Generate report now`, solo cuando el completion engine permite generar reporte.

## Licensing & Cost Exposure UX

- Titulo visible: `Licensing & Cost Exposure`.
- Copy principal: modulo optativo para estimar exposicion VMware y delta de subscripcion Proxmox.
- Campos agregados:
  - Module decision: active, skipped, not applicable.
  - VMware renewal timeframe.
  - Include Proxmox subscription estimate.
  - Licensing notes.
- Campos existentes alineados:
  - Annual VMware cost ahora explicita USD.
  - Estimated Proxmox subscription ahora explicita USD.
  - Currency se guarda como `USD` por campo oculto para mantener consistencia.
- CTAs:
  - `Save licensing context`
  - `Continue later`
  - `Generate report now`, solo cuando el completion engine permite generar reporte.

## USD Policy

Todo texto nuevo relacionado con dinero usa USD. La UI muestra `Amounts modeled in USD` y los campos de costos especifican `(USD)`.

## Optional / Non-Blocking Behavior

- RVTools sigue siendo la base obligatoria.
- Storage Analysis no bloquea report generation.
- Licensing & Cost Exposure no bloquea report generation.
- Si el usuario marca `skipped`, el informe sigue generable pero se agrega una limitation.
- Si el usuario marca `not_applicable`, el modulo no penaliza la confianza igual que un pendiente.

## Skip / Not Applicable Persistence

No hubo migracion de DB. Se persistio en `CostRiskAssumptions.assumptionsJson`:

- `storageContext`
- `licensingContext`

Cada contexto guarda:

- `decision`
- campos del modulo
- `updatedAt`

## Completion Center Integration

`assessmentCompletionService` ahora detecta:

- `storage_analysis`: not_started, partial, complete, skipped, not_applicable.
- `licensing_cost_exposure`: not_started, partial, complete, skipped, not_applicable.

`canGenerateReport` sigue dependiendo de RVTools completo, no de storage/licensing.

## Tests / Validaciones

Tests agregados:

- Parser de Storage Analysis form data.
- Parser de Licensing & Cost Exposure form data.
- Storage empty => not_started.
- Storage partial => partial.
- Storage complete => complete.
- Storage skipped => skipped + limitation.
- Storage not_applicable => not_applicable.
- Licensing empty => not_started.
- Licensing partial => partial.
- Licensing complete => complete.
- Storage/licensing skipped no bloquea `canGenerateReport`.

## Que no se toco

- DB schema.
- Prisma migrations.
- Parser RVTools.
- PDF.
- AI providers/prompts.
- Readiness score existente.
- Pricing/cost formulas.
- Auth.
- Rate limiting.
- CSP/headers.
- Storage file containment.
- Hostinger.
- Produccion.

## Queda para ACC-5

- Reflejar coverage de modulos opcionales en PDF/reporte.
- Decidir si `skipped`/`not_applicable` necesita controles mas compactos.
- QA visual autenticada completa.
- Revisar valores antiguos si existieran currencies distintas a USD.

## Riesgos pendientes

- QA visual autenticada depende de sesion local disponible.
- PDF todavia no consume directamente estos nuevos contextos.
- Datos historicos anteriores pueden tener currency distinta, pero la UI nueva modela USD.

## Confirmaciones

- DB migration: NO.
- Push realizado: NO.
- Production deploy: NO.
- Production launched: NO.

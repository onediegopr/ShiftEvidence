# Licensing Storage Calculation Smoke Acceptance

Fecha: 2026-05-31

Commit validado inicial: `ba9e6105011aaced0c37690216377b811c21d9a5`

## 1. Alcance

Este smoke valida el cierre post-push de `LICENSING-STORAGE-CALC-1`:

- calculadora publica;
- motor central de licensing;
- fuente central de pricing y FX;
- admin pricing snapshots por revision de codigo;
- PDF/report preview por revision de codigo y tests;
- storage/Ceph threshold;
- rutas publicas basicas.

No se tocaron DB productiva, Hostinger, deploy, env vars ni migraciones.

## 2. Git inicial

- Branch: `main`.
- HEAD: `ba9e6105011aaced0c37690216377b811c21d9a5`.
- `origin/main`: `ba9e6105011aaced0c37690216377b811c21d9a5`.
- Ahead/behind: 0/0.
- Working tree inicial: limpio.
- Stashes preservados:
  - `stash@{0}: On main: park unrelated Hero/index changes before ADVISOR-2C`
  - `stash@{1}: On main: park beta invite docs before functional readiness`

## 3. Comandos ejecutados

| Comando | Resultado |
| --- | --- |
| `git status -sb` | OK, limpio al inicio |
| `git log --oneline -n 10` | OK, `ba9e610` presente |
| `git log --oneline origin/main..HEAD` | OK, sin commits locales pendientes |
| `git log --oneline HEAD..origin/main` | OK, sin commits remotos pendientes |
| `npx prisma validate` | OK |
| `npx prisma generate` | OK |
| `npm run typecheck` | OK |
| `npm run lint` | OK |
| `npm run test:run` | OK, 60 files / 296 tests |
| `npm run build` | BLOQUEADO por ambiente local, `EPERM unlink` sobre `.next/static/nEkDQJqkbFQBtVi_cEkgi` |

Build se intento varias veces, incluyendo un intento despues de apagar el dev server local. El error fue siempre:

```text
EPERM: operation not permitted, unlink 'C:\Users\diego\OneDrive\PERSONAL\INFRASHIFT\infrashift\.next\static\nEkDQJqkbFQBtVi_cEkgi'
```

No se borro `.next` ni se hicieron acciones destructivas.

## 4. Smoke publico

Dev server local:

```text
http://localhost:3000
```

Rutas publicas revisadas por HTTP:

- `/`: 200.
- `/shiftreadiness`: 200.
- `/sign-in`: 200.
- `/sign-up`: 200.

Calculadora publica revisada con Browser en `/`:

- Se encontro `Calculate your Licensing Impact`.
- Moneda visible: `All estimates in USD`.
- Proxmox tiers visibles:
  - `Basic399.6/skt/yr`;
  - `Standard594/skt/yr`;
  - `Premium1,188/skt/yr`.
- FX visible: `Converted to USD with the central static FX assumption`.
- Storage disclaimer visible:

```text
Workload metrics are for context only and do not affect licensing estimates.
```

Caso default visible validado:

```text
hosts = 8
socketsPerHost = 2
coresPerSocket = 24
VMware VVF = 135 USD/core/year
Proxmox Premium = 1188 USD/socket/year
licensed cores = 384
VMware annual = 51,840 USD
Proxmox annual = 19,008 USD
annual savings = 32,832 USD
3-year savings = 98,496 USD
```

Limitacion del smoke UI: la automatizacion Browser no logro modificar los sliders de rango de React de forma confiable. Por eso los casos finos de `1 host / 2 sockets / 8, 16, 24 cores` y `3 hosts / 2 sockets / 12 cores` quedaron validados por motor y tests, no como smoke manual real de UI.

## 5. Casos VMware probados por motor

Cubiertos por `tests/unit/licensingCostModel.test.ts`:

| Caso | rawCores | billableCores esperado | Resultado |
| --- | ---: | ---: | --- |
| 1 host / 2 sockets / 8 cores | 16 | 32 | OK |
| 1 host / 2 sockets / 16 cores | 32 | 32 | OK |
| 1 host / 2 sockets / 24 cores | 48 | 48 | OK |
| 3 hosts / 2 sockets / 12 cores | 72 | 96 | OK |

Formula confirmada:

```text
billableCores = max(rawCores, sockets * 16)
```

## 6. Proxmox tiers y FX

Fuente central: `src/lib/licensing/pricingSource.ts`.

Tiers confirmados:

- Community: 120 EUR -> 129.60 USD.
- Basic: 370 EUR -> 399.60 USD.
- Standard: 550 EUR -> 594.00 USD.
- Premium: 1100 EUR -> 1188.00 USD.

FX central:

```text
EUR -> USD = 1.08
source = internal_static_assumption
effectiveDate = 2026-05-31
roundingMode = round_to_cents
```

No se encontro `1070` activo en las superficies revisadas.

## 7. Smoke backend / engine

Archivos revisados:

- `src/lib/licensing/pricingSource.ts`.
- `src/lib/licensing/licensingCostModel.ts`.
- `src/server/assessments/licensingCostExposureEngine.ts`.

Resultado:

- pricing source central: OK.
- motor central compartido: OK.
- VMware min cores: OK.
- FX centralizado: OK.
- Proxmox Basic/Standard/Premium: OK.
- snapshots aprobados VMware con metrica `core` aplican minimo de 16 cores/socket: OK por test.

Tests focales ejecutados:

```text
npx vitest run tests/unit/licensingCostModel.test.ts tests/unit/licensingCostExposureEngine.test.ts tests/unit/storageThresholds.test.ts tests/unit/reportPdfRenderer.test.ts tests/unit/reportStorageDestinationReadinessSection.test.ts
```

Resultado: OK, 5 files / 31 tests.

## 8. Smoke admin pricing

UI admin autenticada: no ejecutada por falta de sesion/auth local validada durante este hito.

Code-level admin pricing smoke: OK.

Revision:

- `runManualPricingRefresh` usa `listLicensingPriceItems`.
- Snapshots VMware/Proxmox se construyen desde fuente central.
- Proxmox incluye Community/Basic/Standard/Premium.
- Metadata FX se registra en snapshot metadata.
- `sourceNote` se construye con `buildPricingSourceNote`.
- Snapshots existentes en DB no se migran automaticamente; queda documentado como riesgo.

## 9. Smoke PDF / preview

PDF real autenticado: no ejecutado por falta de sesion/data local para generar reporte real.

Code-level PDF consistency review: OK.

Revision:

- `reportPdfRenderer.ts` detecta `preview.licensingCostExposure?.included`.
- Si `Licensing Cost Exposure` esta incluido, los campos legacy muestran:

```text
See Licensing & Cost Exposure section
```

- Esto evita doble delta financiero contradictorio.
- `CostRisk` legacy se mantiene solo como compatibilidad cuando no existe Licensing Cost Exposure.

Tests relacionados: `tests/unit/reportPdfRenderer.test.ts` incluido en smoke focal.

## 10. Storage/Ceph threshold

Threshold central:

```text
STORAGE_HIGH_USAGE_THRESHOLD_PERCENT = 80
```

Usos revisados:

- `cephEvidenceService`.
- `storageContextAiAnalysisService`.
- `reportStorageDestinationReadinessSection`.
- `tests/unit/storageThresholds.test.ts`.

Se detectaron textos activos de demo/sample que todavia decian `above 85%`; se alinearon a `above 80%`:

- `src/components/sample-report/SampleReportPage.tsx`.
- `src/components/demo/replayData.ts`.

Los hits restantes de `0.15`/`85` en `src` son estilos, animaciones, scoring no-storage o documentos historicos; no son thresholds activos de storage/Ceph.

## 11. Cambios realizados

Archivos modificados:

- `src/components/sample-report/SampleReportPage.tsx`.
- `src/components/demo/replayData.ts`.
- `docs/licensing-storage-calculation-smoke-acceptance.md`.

Motivo:

- documentar smoke acceptance;
- alinear textos activos de sample/demo al threshold central 80%.

No se agregaron tests nuevos en este hito; se reejecutaron tests existentes.

## 12. Riesgos pendientes

Criticos:

- Ninguno detectado.

Altos:

- `npm run build` queda bloqueado localmente por `EPERM unlink` en `.next/static`, probablemente filesystem/OneDrive/local lock.

Medios:

- Smoke UI autenticado admin no ejecutado.
- Smoke PDF real no ejecutado.
- Sliders de la calculadora no pudieron manipularse por Browser automation; casos finos validados por motor/tests.

Bajos:

- Precios VMware siguen siendo estimaciones de referencia.
- FX sigue siendo estatico.
- Snapshots DB historicos no se migran automaticamente.

## 13. Veredicto

Veredicto: APROBADO CON OBSERVACIONES.

La base funcional queda validada por codigo, tests, rutas publicas y smoke visible de la calculadora default. Quedan observaciones por build local bloqueado por `EPERM` y smokes autenticados no ejecutados.

No se tocaron produccion, DB productiva, Hostinger, deploy ni env vars.

## 14. Build unblock follow-up

Fecha: 2026-05-31

- Causa probable: lock local de Windows/OneDrive sobre un artefacto previo en `.next/static`.
- Resolucion: se confirmo que no habia dev server en puerto 3000, se preservaron procesos Codex, se verifico que `.next` resolvia dentro del workspace y se elimino solo `.next`.
- Build final: OK con `npm run build`.
- Warning conocido: Turbopack/NFT sobre `src/server/evidence/localStorageService.ts`.
- Validaciones finales: `npx prisma validate`, `npx prisma generate`, `npm run typecheck`, `npm run lint`, `npm run test:run` y `npm run build` OK.
- Push: preparado para `origin/main` sin force push.
- Commit de cierre documental: `docs: close licensing storage smoke acceptance`.

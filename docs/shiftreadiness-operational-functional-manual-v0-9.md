# ShiftReadiness — Operational & Functional Manual v0.9

**Pre-launch state / public production validated**

**Estado:** pre-launch avanzado  
**Avance general estimado:** 99.4%  
**Production launched:** NO  
**Último HEAD de referencia:** `3aacd17 docs: record final production admin entitlement smoke`  
**Edición futura:** ShiftReadiness — Operational & Functional Manual v1.0 — Production Launch Edition

## Índice

1. Executive Summary
2. Product Definition
3. Positioning and Boundaries
4. Current Project State
5. High-Level Architecture
6. Public Website Flow
7. Auth and Dashboard
8. Assessment Lifecycle
9. Manual Infrastructure Intake
10. Cost / Risk Engine
11. Evidence Upload
12. Upload Prerequisite Gate
13. Private Storage
14. RVTools Parser
15. RVTools Parser P0 Hardening
16. Inventory UI
17. Risk Engine and Scores
18. Report Preview
19. PDF Reports
20. Unlock / Manual Entitlement Flow
21. Admin Flow
22. Security and Access Controls
23. Production / Hostinger State
24. Production Smoke Results
25. QA Data and Cleanup
26. Known Warnings and Non-Blocking Issues
27. Remaining Launch Blockers
28. Operational Runbook
29. Rollback Guide
30. Roadmap Recommended Next Steps
31. Glossary
32. Pre-Launch Checklist

## 1. Executive Summary

ShiftReadiness es el primer producto de Shift Evidence. Su objetivo es evaluar, con evidencia y criterios conservadores, qué tan preparada está una organización para una migración VMware → Proxmox.

El producto está en estado pre-launch avanzado. La producción pública en Hostinger sirve la app Next.js real, las rutas públicas responden correctamente y el flujo autenticado base ya fue validado en producción.

Estado validado:

| Área | Estado |
| --- | --- |
| Producción pública | OK |
| Auth producción QA | OK |
| Dashboard producción | OK |
| Assessment CRUD producción | OK |
| Intake / assumptions producción | OK |
| Upload gate producción | OK |
| Evidence upload / storage producción | OK |
| Parser producción | OK |
| Risk/report preview producción | OK |
| PDF preview generate/download producción | OK |
| Redirect bug `0.0.0.0:3000` | Corregido |
| Admin real productivo | Pendiente |
| Fulfill entitlement productivo | Pendiente |
| Full `readiness_report` productivo con admin real | Pendiente |
| Hostinger logs | Pendiente |

Production launched: NO.

Este manual documenta el estado v0.9. No es el manual final de lanzamiento. La versión v1.0 deberá emitirse después de validar admin real, entitlement, full report productivo, logs y decisión formal de launch.

## 2. Product Definition

Producto: **ShiftReadiness**.

Marca pública: **Shift Evidence**.

Tagline: **Infrastructure readiness before you migrate.**

Primer assessment:

- VMware → Proxmox Readiness Assessment.

Módulo obligatorio:

- Cost / Risk Engine.

Módulo opcional:

- Storage Destination Readiness.

Problema que resuelve:

- Muchas migraciones se planifican con inventarios incompletos, supuestos no documentados y riesgos ocultos.
- ShiftReadiness convierte evidencia técnica, intake manual y supuestos de costo/riesgo en una señal estructurada de readiness, confidence, findings y próximos pasos.

Usuarios objetivo:

- Empresas que evalúan salida parcial o total de VMware.
- Consultores de infraestructura.
- MSPs y partners que necesitan pre-assessments repetibles.
- Equipos técnicos que deben explicar riesgos a stakeholders no técnicos.

## 3. Positioning and Boundaries

ShiftReadiness está posicionado como un assessment evidence-based, transparente y conservador.

Principios:

- Evidence-based: el reporte se basa en evidencia disponible.
- Transparent: evidencia recibida y faltante se muestra explícitamente.
- Conservative: no se sobredimensiona la certeza.
- No magic: el sistema no promete resolver dependencias sin datos.
- No overclaiming: readiness y confidence se separan.
- Missing evidence is part of the report: lo faltante es señal de riesgo, no un error a esconder.

Qué NO promete:

- No hace migración automática.
- No garantiza cero downtime.
- No entrega diagnóstico 100% completo sin todas las fuentes.
- No infiere dependencias completas sin CMDB, entrevistas o mapas de aplicaciones.
- No valida backup readiness real sin evidencia de backup/restore.
- No analiza performance histórica sin métricas.
- No reemplaza pilotos, pruebas de restore, rollback plan ni validación de target Proxmox.

## 4. Current Project State

Estado oficial al cierre de HITO 9.2S.2:

- Branch: `main`.
- HEAD esperado: `3aacd17 docs: record final production admin entitlement smoke`.
- `origin/main`: sincronizado.
- Working tree esperado: limpio.
- Avance general estimado: 99.4%.
- Local estable: sí.
- Producción pública Hostinger: OK.
- Producción autenticada base: OK.
- Production launched: NO.

Validado localmente:

- HITO 10 PDF local al 100%.
- HITO 11 product QA local integral.
- HITO 12 parser P0.
- HITO 12.0.8 browser multipart upload gate.

Validado en producción:

- Rutas públicas.
- Auth QA.
- Dashboard.
- Assessment CRUD.
- Intake / assumptions.
- Upload gate.
- Evidence upload / storage.
- Parser.
- Risk/report preview.
- PDF preview generate/download.
- Redirect productivo corregido.
- Non-admin admin route fail-closed.
- Unlock request pending.

Pendiente:

- Admin real productivo.
- Fulfill entitlement.
- Full `readiness_report` productivo.
- Logs Hostinger.
- Cleanup/retención de datos QA.
- Decisión formal de launch.

## 5. High-Level Architecture

Stack principal:

- Next.js App Router.
- React 19.
- TypeScript.
- Better Auth.
- Prisma.
- Neon/Postgres.
- Storage privado local/Hostinger.
- PDFKit standalone para generación PDF.

Componentes de dominio:

| Componente | Rol |
| --- | --- |
| Assessment | Unidad principal de análisis |
| EvidenceFile | Archivo subido y metadata de evidencia |
| ParsedVM / ParsedHost / ParsedDatastore / ParsedSnapshot | Inventario parseado |
| ParsedInventorySummary | Resumen del inventario parseado |
| RiskFinding | Hallazgos de riesgo |
| AssessmentScore | Readiness/confidence |
| Report | Historial y artefactos PDF |
| UnlockRequest | Solicitud manual de desbloqueo |
| Entitlement | Permiso comercial concedido |

Flujo alto nivel:

1. Usuario entra por web pública.
2. Se registra o inicia sesión.
3. Crea assessment.
4. Completa intake y assumptions.
5. El upload gate habilita evidence upload.
6. Se sube evidencia RVTools/XLSX/CSV.
7. Parser genera inventario.
8. Risk engine calcula findings y scores.
9. Report preview muestra resumen y secciones locked.
10. PDF preview se genera y descarga.
11. Usuario solicita unlock.
12. Admin cumple request y genera entitlement.
13. Full `readiness_report` se habilita.

## 6. Public Website Flow

Rutas públicas:

- `/`
- `/shiftreadiness`
- `/sign-up`
- `/sign-in`
- `/contact`

Producción validada:

| Ruta | Resultado |
| --- | --- |
| `/` | `200 OK` |
| `/shiftreadiness` | `200 OK` |
| `/sign-in` | `200 OK` |
| `/sign-up` | `200 OK` |
| `/dashboard` sin sesión | `307` a `/sign-in` |
| `/dashboard/assessments` sin sesión | `307` a `/sign-in` |

Evidencia de producción real:

- Assets `/_next` detectados.
- `ShiftReadiness` detectado.
- Contenido auth detectado.
- Hostinger 404 ausente.
- `This Page Does Not Exist` ausente.

## 7. Auth and Dashboard

Auth:

- Better Auth.
- Sign-up con email/password.
- Sign-in con email/password.
- Sesión protegida por cookie.
- En producción se observó `__Secure-better-auth.session_token`.

Protección:

- Rutas privadas redirigen a `/sign-in` sin sesión.
- Dashboard autenticado carga correctamente.
- Assessment ownership se valida.
- Admin route falla cerrado para non-admin.

Dashboard:

- `/dashboard`
- `/dashboard/assessments`
- `/dashboard/assessments/new`
- `/dashboard/assessments/[id]`
- `/dashboard/assessments/[id]/report`
- `/dashboard/admin/unlock-requests`

## 8. Assessment Lifecycle

Ciclo:

1. Create assessment.
2. Read assessment.
3. Update overview.
4. Complete manual intake.
5. Complete cost/risk assumptions.
6. Upload evidence.
7. Parse evidence.
8. Generate risk insights.
9. Review report preview.
10. Generate/download PDF preview.
11. Request unlock if needed.

Seguridad:

- Assessment ownership obligatorio.
- Access mismatch devuelve 404 o redirect, no datos.
- Audit events existen para varias acciones.

## 9. Manual Infrastructure Intake

El intake manual captura señales preliminares antes de evidencia estructurada.

Campos actuales incluyen:

- VM count.
- Host count.
- Cluster count.
- Socket/core count.
- Total RAM.
- Storage footprint.
- Used storage.
- Snapshot count.
- Critical workload count.
- Large VM count.
- Powered-off VM count.
- Notes.

Uso:

- Alimenta preliminary preview.
- Ayuda al Cost / Risk Engine.
- Define prerequisitos mínimos del upload gate.
- Afecta readiness/confidence cuando no hay evidencia parseada.

## 10. Cost / Risk Engine

Captura assumptions:

- Currency.
- Years.
- VMware license model.
- VM count.
- Socket count.
- Core count.
- Annual VMware cost.
- Estimated Proxmox cost.
- Migration complexity.
- Business criticality.
- Risk tolerance.

Outputs:

- Annual subscription delta.
- 3-year delta.
- Estimated savings.
- Risk preview.
- Source indicator.

Límites:

- No reemplaza pricing contractual real.
- No incluye todos los costos operativos posibles.
- Debe marcar si la fuente es manual, parsed o mixed.

## 11. Evidence Upload

EvidenceFile representa un archivo subido.

Tipos soportados:

- RVTools export.
- XLSX/XLS.
- CSV/TXT.
- Other.

Metadata:

- Filename original.
- Evidence type.
- Size.
- Hash.
- Processing status.
- Storage relative path.
- UploadedAt.
- DeletedAt si aplica.

Estados:

- `uploaded`
- `processing`
- `parsed`
- `failed`
- `deleted`

Seguridad:

- Descarga requiere sesión y ownership.
- Storage privado.
- Soft-delete preserva auditabilidad.

## 12. Upload Prerequisite Gate

Motivo:

- No permitir subir RVTools/evidence sin contexto mínimo.
- Mejorar interpretación de evidencia.
- Evitar reportes con input insuficiente.

Prerequisitos MVP:

- Assessment title presente.
- Manual infrastructure intake no `missing`.
- Cost/Risk assumptions no `missing`.

UI gate:

- Estado `Upload gate: blocked` o `Upload gate: ready`.
- Mensaje claro.
- Checklist de faltantes.
- Links a `#assessment-basics`, `#infrastructure-intake`, `#cost-risk-assumptions`.
- Fieldset disabled cuando falta contexto.

Server-side gate:

- `assertCanUploadEvidence`.
- Se ejecuta después de sesión/ownership.
- Se ejecuta antes de escribir archivo en storage.
- Se ejecuta antes de crear EvidenceFile.

Validación:

- Assessment incompleto no crea EvidenceFile.
- Assessment completo permite upload real multipart desde navegador.
- Browser multipart E2E validado con Chrome/CDP.

## 13. Private Storage

Principios:

- Storage no público.
- Fuera de `public_html`.
- Fuera de `.next`.
- Fuera de `node_modules`.
- Descargas siempre por ruta protegida.

Validado:

- Local storage check OK.
- Producción evidence upload/download OK.
- Evidence download sin sesión redirige a `/sign-in`.
- PDF download autenticado OK.

Riesgos:

- Confirmar ruta `HOSTINGER_STORAGE_ROOT` productiva permanentemente.
- Revisar backups/retención.
- Revisar logs y permisos con acceso Hostinger.

## 14. RVTools Parser

El parser toma evidencia RVTools/XLSX/CSV y genera:

- ParsedVM.
- ParsedHost.
- ParsedDatastore.
- ParsedSnapshot.
- ParsedInventorySummary.

Soporta:

- CSV simple.
- XLSX.
- Workbook RVTools-like multi-sheet.

Hojas relevantes:

- `vInfo`
- `vCPU`
- `vMemory`
- `vDisks`
- `vHosts`
- `vDatastore`
- `vNetwork`
- `vSnapshot`
- `vTools`

Estado actual:

- Parser P0 corregido.
- CSV simple preservado.
- XLSX RVTools-like validado con fixture sintético.
- Warnings no fatales preservados.

## 15. RVTools Parser P0 Hardening

Problema detectado:

- Workbook sintético RVTools-like con 23 VMs generaba 150 ParsedVM.

Causa:

- Hojas enrichment como `vCPU`, `vMemory`, `vDisks`, `vNetwork`, `vTools` eran tratadas como VM sheets independientes.

Solución:

- Sheet role mapping explícito.
- `vInfo` como fuente canónica de VMs.
- Enrichment sheets enriquecen por VM name.
- Canonical VM merge.
- Orphan enrichment rows generan warning.
- Datastore usage normalization.
- Warnings no fatales.

Resultado:

| Métrica | Before | After |
| --- | ---: | ---: |
| ParsedVM | 150 | 23 |
| ParsedHost | 5 | 5 |
| ParsedDatastore | 6 | 6 |
| ParsedSnapshot | 5 | 5 |

Backlog:

- Network first-class signals.
- Tools status first-class risk.
- Disk risk más profundo.
- Parser coverage visible en UI/PDF.
- `vHealth`, `vCluster`, `vPartitions` partial/future.

## 16. Inventory UI

La UI muestra:

- VM summary.
- Host summary.
- Datastore summary.
- Snapshot summary.
- Powered on/off.
- Provisioned/used storage.
- Parser warnings.
- Tables limitadas de inventario.

Relación:

- Depende de ParsedInventorySummary y modelos Parsed*.
- Alimenta risk engine.
- Alimenta report preview/PDF.

Limitaciones:

- Algunos enrichment details quedan en metadata.
- No hay modelos first-class para todos los campos de network/tools/disks.

## 17. Risk Engine and Scores

Genera:

- RiskFinding.
- AssessmentScore.
- Readiness score.
- Confidence score.
- VM risk matrix.

Señales:

- Snapshots antiguos.
- Datastores con poco espacio.
- VMs grandes.
- Tools status.
- Evidencia faltante.
- Mismatch manual vs parsed.

Principio:

- Readiness no equivale a confidence.
- Evidence missing reduce confianza.
- No se inventan dependencias.

## 18. Report Preview

Ruta:

- `/dashboard/assessments/[id]/report`

Incluye:

- Executive summary preview.
- Technical summary preview.
- Environment summary.
- Cost/Risk summary.
- Top findings.
- VM matrix preview.
- Evidence confidence.
- Locked sections.
- Commercial status.
- Upgrade/manual unlock CTAs.
- Report history.

Preview vs full:

- Free preview disponible sin entitlement.
- Full report locked hasta entitlement.
- UI refleja commercial status.

## 19. PDF Reports

Tipos:

- `free_preview`.
- `readiness_report`.

Funciones:

- Generate PDF preview.
- Generate full readiness report si entitlement existe.
- Secure download.
- Report history.
- Soft-delete.

PDF visual hardening:

- Cover page.
- Executive summary.
- Evidence received/missing.
- Readiness/confidence.
- Environment summary.
- Top findings.
- VM risk matrix.
- Migration waves.
- Required validations.
- Next evidence.
- Next steps.
- Disclaimers.
- Page numbers.

QA:

- Preview y full readiness report validados localmente.
- Ambos PDFs finales aceptados visualmente con 11 páginas.
- Page numbers correctos.
- No `[object Object]`.
- No tablas rotas graves.
- Producción: PDF preview generation/download OK.

## 20. Unlock / Manual Entitlement Flow

Conceptos:

- UnlockRequest.
- Pending manual review.
- Admin fulfill.
- Entitlement.
- `full_report_unlocked`.
- Commercial status.

Flujo:

1. Usuario solicita unlock desde report page.
2. Request queda pending.
3. Admin revisa request.
4. Admin fulfill/approve.
5. Entitlement se concede.
6. Commercial status cambia.
7. Full `readiness_report` se habilita.

Estado:

- Local: entitlement/full report validado.
- Producción: unlock request pending validado.
- Producción: admin real/fulfill/full report pendiente.

## 21. Admin Flow

Ruta:

- `/dashboard/admin/unlock-requests`

Control:

- `ADMIN_EMAILS`.
- Non-admin devuelve 404 fail-closed.
- Admin puede ver pending requests y fulfill.

Validado:

- Local admin/entitlement: validado en hitos previos.
- Producción non-admin fail-closed: OK.

Pendiente:

- Admin real productivo.
- Fulfill productivo.
- Entitlement productivo.
- Full report productivo.

## 22. Security and Access Controls

Controles:

- Rutas privadas redirigen sin sesión.
- Assessment ownership.
- Report mismatch devuelve 404.
- Evidence download requiere sesión.
- Report download requiere sesión.
- Admin fail-closed.
- Storage no público.
- Full report no se genera sin entitlement.

Producción validada:

- `/dashboard` sin sesión: `307`.
- `/dashboard/assessments` sin sesión: `307`.
- Evidence download sin sesión: redirect.
- Report download sin sesión: `https://shiftevidence.com/sign-in` después del fix.
- Non-admin admin route: `404`.

## 23. Production / Hostinger State

Hostinger ahora sirve la app Next real.

Estado:

- Public routes OK.
- `/_next` detectado.
- Hostinger 404 ausente.
- Authenticated smoke base OK.
- PDF redirect bug corregido.
- No manual deploy ejecutado durante estos hitos.
- Production launched: NO.

Variables conceptuales requeridas, sin valores:

- `DATABASE_URL`
- `DIRECT_URL` opcional
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `HOSTINGER_STORAGE_ROOT`
- `MAX_UPLOAD_SIZE_MB`
- `ADMIN_EMAILS`

Notas:

- `BETTER_AUTH_URL` y `NEXT_PUBLIC_APP_URL` deben apuntar al dominio real HTTPS.
- `HOSTINGER_STORAGE_ROOT` debe ser privado, persistente y fuera de carpetas públicas/build.

## 24. Production Smoke Results

Resumen:

| Hito | Resultado |
| --- | --- |
| HITO 9.2R public baseline | OK |
| HITO 9.2S authenticated smoke | Parcial inicialmente por redirect |
| HITO 9.2S.1 redirects | OK |
| HITO 9.2S.2 admin/entitlement/logs | Parcial por falta admin/logs |

Validado en producción:

- Public website.
- Auth QA.
- Dashboard.
- Assessment create/update.
- Intake/assumptions.
- Upload gate.
- Evidence upload/storage.
- Parser.
- Risk/report preview.
- PDF preview generate/download.
- Secure download redirect público correcto.
- Unlock request pending.
- Non-admin fail-closed.

Pendiente:

- Admin real.
- Fulfill entitlement.
- Full readiness_report productivo.
- Logs Hostinger.

## 25. QA Data and Cleanup

Datos QA productivos marcados safe to delete:

- Usuarios `qa-production-smoke-*`.
- Usuario `qa-production-admin-smoke-*`.
- Assessments QA production smoke.
- Evidence files QA.
- Reports QA.
- Pending unlock request QA.

Política:

- No borrar sin decisión.
- Mantener temporalmente si sirven para admin smoke pendiente.
- Definir cleanup antes de launch.

## 26. Known Warnings and Non-Blocking Issues

Warnings conocidos:

- Turbopack/NFT warning en `reportStorageService`.
- Hostinger logs no disponibles desde contexto actual.
- Parser automatic no corre necesariamente tras upload; parser puede requerir acción posterior.
- Parser P1 coverage pendiente.
- `vHealth`, `vCluster`, `vPartitions` partial/future.
- QA data cleanup pendiente.

No bloquean el estado actual:

- PDF preview productivo funciona.
- Redirect bug corregido.
- Parser P0 corregido.
- Upload gate validado.

## 27. Remaining Launch Blockers

Bloqueadores antes de declarar Production launched:

1. Admin real productivo validado.
2. Unlock request productivo fulfilled.
3. Entitlement productivo concedido.
4. Full `readiness_report` productivo generado y descargado.
5. Secure access final del full report.
6. Logs Hostinger revisados o aceptados formalmente como no disponibles.
7. Cleanup/retención de QA data decidida.
8. Decisión formal del usuario: Production launched.

## 28. Operational Runbook

Comandos base:

```powershell
npm run hostinger:diagnose
npm run typecheck
npm run lint
npm run build
npm run start -- -p 3000
```

Validar rutas locales:

```powershell
curl -I http://localhost:3000/
curl -I http://localhost:3000/shiftreadiness
curl -I http://localhost:3000/sign-in
curl -I http://localhost:3000/sign-up
curl -I http://localhost:3000/dashboard
curl -I http://localhost:3000/dashboard/assessments
```

Si localhost no levanta:

- Revisar puerto `3000`.
- Revisar procesos Node/Next.
- Detener sólo procesos claramente del proyecto.
- Si hay lock de `.next`, detener Next y borrar sólo `.next`.
- No borrar `.env.local`.
- No borrar `node_modules` sin autorización.

Si PDF falla:

- Revisar report route.
- Revisar storage root.
- Revisar permisos de escritura/lectura.
- Revisar `reportStorageService`.
- Revisar redirect/public URL.
- Confirmar `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL`.

Si upload falla:

- Revisar upload gate.
- Revisar prerequisitos.
- Revisar file size/type.
- Revisar storage root.
- Revisar EvidenceFile status.

Si auth falla:

- Revisar `BETTER_AUTH_URL`.
- Revisar `NEXT_PUBLIC_APP_URL`.
- Revisar cookies bajo dominio real.
- Revisar trusted origins.

## 29. Rollback Guide

Reglas:

- No ejecutar `prisma migrate reset`.
- No borrar storage.
- Preservar logs.
- Preservar QA evidence/report si se necesita auditoría.

Rollback Git:

```powershell
git status
git log --oneline -5
git revert <commit>
```

Revisar antes/después:

- Env vars productivas.
- `BETTER_AUTH_URL`.
- `NEXT_PUBLIC_APP_URL`.
- `HOSTINGER_STORAGE_ROOT`.
- Storage permissions.
- DB connectivity.
- Auth redirects.
- PDF download.

## 30. Roadmap Recommended Next Steps

1. HITO 9.2S.3 — Production Admin Entitlement Smoke.
2. Cleanup QA production data.
3. Parser P1 coverage in UI/PDF.
4. First-class network/tools/disk risk signals.
5. Real anonymized RVTools QA.
6. Public sample report lead magnet.
7. Pricing/packaging polish.
8. Formal launch decision.
9. Manual v1.0 — Production Launch Edition.

## 31. Glossary

| Término | Definición |
| --- | --- |
| Assessment | Evaluación principal de readiness |
| Evidence | Archivo o información usada para evaluar |
| RVTools | Export común de inventario VMware |
| Readiness Score | Señal de preparación técnica |
| Confidence Score | Confianza basada en calidad/completitud de evidencia |
| RiskFinding | Hallazgo de riesgo generado |
| ParsedVM | VM persistida desde evidencia parseada |
| EvidenceFile | Registro de archivo subido |
| UnlockRequest | Solicitud manual de desbloqueo comercial |
| Entitlement | Permiso concedido para feature/report |
| readiness_report | Tipo de reporte full desbloqueado |
| Hostinger storage | Storage privado productivo |
| Production launched | Estado formal de lanzamiento público |

## 32. Pre-Launch Checklist

- [ ] Admin real validated.
- [ ] Entitlement production fulfilled.
- [ ] Full `readiness_report` generated in production.
- [ ] Full report download secure access validated.
- [ ] Logs reviewed or formally accepted as unavailable.
- [ ] QA data cleanup policy decided.
- [ ] Final launch decision.
- [ ] Production launched explicitly declared by user.
- [ ] Manual v1.0 created.

## Cierre

Manual v0.9 listo para operar y retomar el proyecto.

Production launched: NO.

Manual v1.0 queda pendiente para Production Launch Edition.

## Addendum — HITO 9.2S-FINAL Launch Readiness Gate

Fecha: 2026-05-27.

Resultado:

- Gate local/Git/build: OK.
- Gate producción pública/auth base: OK.
- Gate admin real: bloqueado por falta de acceso admin productivo en el entorno actual.
- Fulfill/entitlement/full `readiness_report`: pendiente.
- Logs Hostinger: pendientes/no disponibles desde el contexto actual.
- QA data cleanup/retention: pendiente.

Decisión:

- Ready for controlled production launch review: NO.
- Production launched: NO.

Condición para manual v1.0:

- Validar admin real, entitlement, full report productivo, secure access final, logs y cleanup/retención QA.

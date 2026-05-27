# ShiftReadiness - Functional & Operational Manual v1.1
## Limited Public Beta / Controlled Launch Edition

**Tagline:** Infrastructure readiness before you migrate.

**Fecha:** 2026-05-27  
**Manual vigente:** SI  
**Reemplaza:** `ShiftReadiness - Operational & Functional Manual v1.0 - Production Launch Edition`  
**Controlled production launch:** SÍ  
**Limited public beta:** SÍ  
**Full public launch:** NO

## Indice

1. Resumen ejecutivo
2. Definicion del producto
3. Estado actual del lanzamiento
4. Arquitectura funcional general
5. Arquitectura de usuario
6. Dashboard y multi-assessment workspace
7. Ciclo de vida de un assessment
8. Crear y retomar un trabajo
9. Manual intake
10. Cost / risk assumptions
11. Upload prerequisite gate
12. Evidence upload
13. RVTools parser
14. Inventory, risk engine y scores
15. Report preview
16. PDF reports
17. Full report / unlock / entitlement
18. Admin dashboard
19. Password recovery
20. Resend / email provider
21. Seguridad y acceso
22. Hostinger / produccion
23. UX/UI post-Antigravity
24. Operacion diaria
25. Soporte y SLA beta
26. QA data / cleanup / retention
27. Limited public beta operating model
28. Full public launch blockers
29. Roadmap recomendado
30. Glosario
31. Checklist operativo final
32. Decision final

## 1. Resumen ejecutivo

ShiftReadiness es el primer modulo de producto de Shift Evidence. Ayuda a equipos de infraestructura, consultores, MSPs y socios tecnicos a evaluar readiness de migracion de VMware hacia Proxmox usando evidencia, contexto manual y scoring conservador.

| Area | Estado |
| --- | --- |
| Production launched | SÍ |
| Launch type | Controlled production launch |
| Limited public beta | SÍ |
| Full public launch | NO |
| Password recovery | OPERATIVO |
| Dashboard multi-assessment | OK |
| Upload/parser/PDF/admin/entitlement | OK por evidencia previa |
| Public self-service masivo | NO |

La plataforma puede operar hoy con usuarios seleccionados, demos supervisadas, beta limitada y soporte manual. No debe tratarse todavia como producto publico masivo self-service.

Audiencia:

- Dueno del producto.
- Desarrollador futuro.
- Operador/admin.
- Consultor o socio.
- Usuario tecnico.
- Revisor comercial/operativo antes de public launch.

Permite hacer hoy:

- Crear cuenta e iniciar sesion.
- Recuperar contrasena por email.
- Entrar a dashboard privado.
- Crear varios trabajos/assessments.
- Retomar trabajos incompletos.
- Guardar y modificar intake/costos/riesgos.
- Subir evidencia cuando se cumplen prerequisitos.
- Parsear RVTools-like evidence.
- Revisar inventory, risks, preview y PDF.
- Solicitar/unlock full report mediante entitlement manual.

No permite todavia:

- Full public launch masivo.
- Checkout/pagos self-service.
- SLA publico formal.
- Limpieza QA/archive totalmente ejecutada.
- Browser QA autenticado completo post-Antigravity desde Codex.
- Revision formal de logs Hostinger desde Codex.

## 2. Definicion del producto

Producto: **ShiftReadiness**.

Tagline: **Infrastructure readiness before you migrate.**

Primer assessment: **VMware -> Proxmox Readiness Assessment**.

ShiftReadiness analiza si una organizacion tiene evidencia y condiciones suficientes para planificar una migracion VMware hacia Proxmox con menor incertidumbre. No migra workloads automaticamente, no promete zero downtime y no reemplaza un piloto real.

Componentes:

- Manual Intake.
- Cost/Risk Engine.
- Storage Destination Readiness opcional.
- Evidence Upload.
- RVTools Parser.
- Risk Engine.
- Report Preview/PDF.
- Unlock/Entitlement.

Conceptos centrales:

- Readiness Score: senal de preparacion.
- Evidence Confidence Score: confianza segun calidad/cantidad de evidencia.
- Evidence Missing: evidencia faltante que limita conclusiones.
- Missing evidence as value: mostrar lo que falta evita overclaiming.

Limites:

- No es migrador automatico.
- No garantiza zero downtime.
- No diagnostica 100% sin evidencia.
- No sustituye discovery, piloto ni plan de cambio.
- No debe prometer conversion automatica ni ahorro garantizado.

## 3. Estado actual del lanzamiento

| Componente | Estado |
| --- | --- |
| Public site | OK |
| Auth / sign-up / sign-in | OK |
| Password recovery | OK |
| Dashboard | OK |
| Multi-assessment workspace | OK |
| Upload gate | OK |
| Evidence upload | OK por evidencia previa |
| Parser RVTools P0 | OK |
| Report preview / PDF | OK |
| Admin / entitlement | OK por evidencia manual previa |
| Resend email | OK |
| Limited public beta | OK |
| Full public launch | NO |
| Checkout / pagos | NO |
| QA cleanup / archive | Pendiente |
| Hostinger logs | Pendiente/manual |
| Browser QA full replay | Pendiente |

Decision operativa:

- Controlled production launch: SÍ.
- Limited public beta: SÍ.
- Full public launch: NO.

## 4. Arquitectura funcional general

ShiftReadiness esta construido sobre:

- Next.js App Router para rutas publicas, privadas y APIs.
- Better Auth para usuarios, sesiones, login y credenciales.
- Prisma como ORM.
- PostgreSQL/Neon como base relacional.
- Hostinger Node runtime para produccion.
- Private storage para evidence y PDF/report files.
- EvidenceFile como modelo de metadata.
- RVTools parser para inventory.
- Risk engine para hallazgos y scoring.
- Report engine y PDF generation.
- UnlockRequest y Entitlement.
- Admin queue.
- Resend para password recovery.

Flujo tecnico:

1. Usuario autentica con Better Auth.
2. Workspace privado agrupa assessments.
3. Assessment almacena intake, cost/risk, evidence, parsed inventory, risks y reports.
4. Evidence se guarda en storage privado y metadata en DB.
5. Parser transforma RVTools-like files en inventory.
6. Risk engine genera findings y score.
7. Report preview/PDF presenta resultados.
8. Entitlement desbloquea full report.

No se incluyen secretos. Las variables de entorno se documentan solo conceptualmente.

## 5. Arquitectura de usuario

Modelo:

Usuario -> Workspace -> Assessments/Trabajos -> Evidence -> Inventory/Risk -> Reports/PDF -> Entitlement

ShiftReadiness no es un formulario de una sola vez. El usuario tiene un dashboard persistente donde puede crear varios trabajos, volver otro dia, retomar incompletos, modificar en progreso, agregar evidencia y consultar historial de reportes por assessment.

Reglas:

- Cada assessment tiene su propia evidencia.
- Cada assessment tiene su propio report history.
- El usuario no debe ver assessments de otros usuarios.
- Downloads y reports requieren ownership/session.
- Admin tiene comportamiento especial controlado.

## 6. Dashboard y multi-assessment workspace

El dashboard muestra:

- Resumen de assessments.
- Evidence files activos.
- Reports generados.
- Recent assessments.
- CTA para crear nuevo assessment.
- Acceso a admin queue si el usuario es admin.

La lista de assessments muestra:

- Nombre del trabajo.
- Client label.
- Lifecycle badge.
- Estado DB.
- Storage readiness.
- Plan.
- RVTools status.
- Updated date.
- Continue assessment.

Ejemplo:

| Assessment | Estado |
| --- | --- |
| Assessment Cliente A | Draft |
| Assessment Cliente B | Evidence uploaded |
| Assessment Cliente C | Report ready |
| Assessment Cliente D | Full unlocked |

Gaps:

- Archive/restore formal puede requerir mejora futura.
- Browser QA autenticado completo post-Antigravity sigue pendiente para full public launch.

## 7. Ciclo de vida de un assessment

| Estado | Senal |
| --- | --- |
| Draft | Assessment creado sin intake/evidence suficiente |
| In progress | Intake o assumptions parcialmente guardados |
| Basics complete | Intake y cost/risk con senales suficientes |
| Evidence uploaded | EvidenceFile activo asociado |
| Inventory ready | Evidence parseado |
| Report preview ready | Preview/risk/report disponible |
| Full report unlocked | Entitlement `full_report_unlocked` |
| Archived | Assessment archived/soft-deleted si aplica |

Varios estados son derivados, no necesariamente enums formales. `Completed` formal todavia no es un estado completo de producto. Si se modifica intake/evidence luego de generar reporte, puede requerirse regenerar preview/report.

## 8. Crear y retomar un trabajo

Flujo:

1. Crear assessment.
2. Completar nombre/contexto.
3. Guardar datos.
4. Volver al dashboard.
5. Reabrir assessment.
6. Continuar intake/cost/risk.
7. Modificar datos en progreso.
8. Subir evidence cuando el gate lo permita.
9. Parsear evidence.
10. Revisar report preview.
11. Generar/descargar PDF.
12. Solicitar full report si corresponde.

El usuario no necesita completar todo de una vez. El trabajo vive en el dashboard.

## 9. Manual intake

Manual Intake captura contexto que RVTools no siempre expresa:

- Cantidad de VMs/hosts/clusters.
- RAM, storage, sockets/cores.
- Snapshots, VMs criticas, VMs grandes, powered-off.
- Notas operativas.
- HA, criticidad, tolerancia al riesgo y complejidad.
- Dependencias manuales que afectan confidence.

RVTools da inventory tecnico; intake agrega contexto de negocio/operacion. La combinacion mejora readiness/confidence y reduce conclusiones falsas.

### Adaptive Migration Context Intake

CONTEXT-1 agrega un intake adaptativo dentro del assessment para capturar contexto humano de migracion que RVTools no puede saber:

- objetivo principal del proyecto;
- etapa y timeline;
- ambiente VMware;
- storage;
- red;
- backup/DR;
- criticidad de negocio;
- downtime y ventanas;
- destino Proxmox;
- compliance/restricciones;
- notas libres.

El formulario esta dividido en Quick Context y Advanced Context. El usuario puede responder parcialmente, guardar, volver despues y marcar preguntas como `Unknown`, `Not applicable` o `Skip for now`.

El contexto se guarda sin cambio de schema en `CostRiskAssumptions.assumptionsJson.migrationContext`.

Efecto operativo:

- calcula context coverage general y por seccion;
- agrega missing context al reporte como evidence gap;
- impacta Evidence Confidence de forma acotada;
- aparece en report preview y PDF;
- prepara payload estructurado para futuro AI Advisory;
- no bloquea evidence upload.

Estado de validacion:

- Implementacion: SI.
- Build/lint/typecheck: OK.
- Produccion sin sesion: OK.
- Browser QA autenticado save/refresh/report/PDF: pendiente por falta de sesion/cookies en Codex.

## 10. Cost / risk assumptions

Guarda:

- Modelo/licenciamiento VMware.
- Sockets, cores, VMs.
- Costo anual VMware.
- Costo estimado Proxmox.
- Currency/years.
- Migration complexity.
- Business criticality.
- Risk tolerance.

Uso:

- Calcular delta economico preliminar.
- Presentar savings potenciales.
- Alimentar risk/readiness.
- Explicar limitaciones.

Fuentes:

- Manual.
- Parsed.
- Mixed source.

El sistema debe distinguir fuente/confianza y no sobreprometer ahorros.

## 11. Upload prerequisite gate

El upload gate evita evidencia sin contexto minimo.

Capas:

- UI gate: explica que falta.
- Server-side gate: enforce real antes de aceptar multipart.
- Browser multipart validado: evidencia previa confirma que el bloqueo no era solo visual.

Comportamiento:

- Assessment incompleto: upload bloqueado.
- Contexto avanzado incompleto: warning/evidence gap, no bloqueo duro.
- Assessment con prerequisitos: upload habilitado.

## 12. Evidence upload

Tipos:

- RVTools-like XLSX.
- CSV.
- Evidencia relacionada segun flujo.

Modelo:

- EvidenceFile registra metadata.
- Archivo se guarda en private storage.
- Download seguro requiere session/ownership.
- Soft-delete marca metadata y puede remover archivo fisico segun flujo seguro.
- Status indica uploaded/parsed/failed/deleted u otros estados.

Aislamiento:

- Evidence pertenece a un assessment.
- Assessment A no debe mostrar evidencia de Assessment B.

Errores:

- File type invalido.
- Prerequisites incompletos.
- Parser failure.
- Storage permission/path issues.

## 13. RVTools parser

El parser RVTools P0 esta corregido y validado por evidencia previa.

Lee/normaliza:

- vInfo canonico.
- Enrichment sheets.
- ParsedVM.
- ParsedHost.
- ParsedDatastore.
- ParsedSnapshot.
- ParsedInventorySummary.

Correccion importante:

- Bug P0 de canonical VM merge corregido: el caso 23 VMs -> 150 fue resuelto.

Comportamiento:

- Usa vInfo como base canonica.
- Enriquece con otras hojas cuando existen.
- Produce warnings parciales si faltan datos.
- No debe duplicar VMs por joins/enrichment incorrectos.

Pendientes P1/P2:

- Mas formatos RVTools reales.
- Mas tolerancia a columnas variantes.
- Mejor reporte de warnings al usuario.

## 14. Inventory, risk engine y scores

Inventory:

- VMs.
- Hosts.
- Datastores.
- Snapshots.
- Summary.

Risk engine:

- RiskFinding.
- AssessmentScore.
- VM matrix.
- Severity counts.
- No-go items.
- Missing evidence.

Scores:

- Readiness Score: preparacion general.
- Evidence Confidence Score: confianza en el output.

Regla de producto:

- No overclaiming.
- Si falta evidencia, se muestra como gap.
- Readiness alto con evidencia baja debe leerse con cautela.

## 15. Report preview

Report preview muestra:

- Executive summary preliminar.
- Readiness/confidence.
- Evidence received/missing.
- Risk findings.
- VM matrix o resumen.
- Secciones locked si no hay entitlement.

Full report:

- Se desbloquea por entitlement.
- Puede incluir mas detalle y PDF completo.

Limitaciones:

- Preview no reemplaza assessment completo.
- Si la evidencia cambia, puede requerir regenerar output.

## 16. PDF reports

PDF funcional:

- Preview PDF.
- Full readiness_report cuando entitlement lo permite.
- Download seguro.
- Report history por assessment.
- Visual QA previa.

Incluye:

- Secciones del reporte.
- Numeracion/paginacion segun template.
- Readiness/confidence.
- Evidence context.
- Limitaciones conocidas.

Known limitations:

- Calidad visual puede evolucionar.
- Browser replay completo post-Antigravity sigue pendiente.
- Si storage/logs fallan, se requiere revisar Hostinger runtime logs.

## 17. Full report / unlock / entitlement

Modelos:

- UnlockRequest: solicitud de acceso.
- Entitlement: permiso concedido.
- `full_report_unlocked`: capability de full report.

Flujo:

1. Usuario solicita unlock/full report.
2. Request entra a admin queue.
3. Admin revisa.
4. Admin approve/fulfill/reject/cancel segun caso.
5. Entitlement queda granted/available.
6. Usuario accede a full report.

No existe checkout automatico. El operating model actual es manual entitlement.

## 18. Admin dashboard

Ruta:

- `/dashboard/admin/unlock-requests`

Funciones:

- Ver pending/approved/fulfilled/rejected.
- Revisar requests.
- Agregar notas internas.
- Fulfill entitlement.
- Ver commercial status.

Evidencia:

- Admin route y entitlement/full report fueron validados manualmente por usuario en navegador real.

Gap historico:

- Admin queue podia apuntar a reports owner-protected y dar 404 cross-owner.

Estado actual:

- Antigravity introdujo admin read behavior para assessment/report pages.
- Escrituras siguen usando ownership-scoped services.
- Sigue recomendado construir admin-safe read-only report view.

## 19. Password recovery

Estado: OPERATIVO.

Flujo:

- `/forgot-password`.
- Request neutral sin revelar si el email existe.
- Resend envia email real.
- `/reset-password`.
- Token hasheado en DB.
- Expiracion.
- Uso unico.
- Nueva contrasena funciona.
- Vieja contrasena falla.
- Token usado falla.
- Token invalido falla controlado.

Validacion:

- Email real recibido: user-attested.
- Valid token reset: user-attested.
- Nueva contrasena: user-attested.
- Invalid token: revalidado por Codex.

## 20. Resend / email provider

Estado:

- Resend configurado.
- Dominio `mail.shiftevidence.com` verificado segun reporte de usuario.
- DNS en Hostinger configurado.
- `RESEND_API_KEY` y `EMAIL_FROM` presentes en Hostinger segun reporte operativo.

Reglas:

- No imprimir secretos.
- No imprimir tokens.
- No imprimir links completos de reset.

Si email no llega:

1. Verificar spam/quarantine.
2. Revisar Resend logs.
3. Confirmar dominio/remitente.
4. Confirmar que request devolvio respuesta neutral.
5. Usar soporte manual si es beta controlada.

## 21. Seguridad y acceso

Controles:

- Private routes redirigen a sign-in.
- Workspace/ownership protege assessments.
- Evidence download requiere access check.
- Report download requiere access check.
- Admin fail-closed.
- Password reset no enumera emails.
- Invalid tokens no deben causar fuga de informacion.
- Storage no es publico.

Validado:

- Rutas privadas sin sesion: 307 a `/sign-in`.
- Password recovery neutral.
- Invalid token controlado.

Pendiente:

- Replay autenticado cross-user completo para full public launch.

## 22. Hostinger / produccion

Produccion:

- Hostinger sirve app Next real.
- Public routes OK.
- Dynamic private routes OK por redirect/proteccion.
- Redirect `0.0.0.0` corregido.
- Storage root conceptual requerido.
- Env vars requeridas conceptualmente: DB, auth, app URL, storage root, admin emails, Resend.

No incluir secretos.

Si hay `503/504`:

1. Revisar runtime/build logs.
2. Revisar proceso Node.
3. Revisar env vars.
4. Revisar Prisma/DB connectivity.
5. Revisar storage permissions.

Pendiente:

- Logs Hostinger/runtime no revisados formalmente por Codex.

## 23. UX/UI post-Antigravity

Estado:

- Cambios aceptados y estabilizados.
- Local recuperado.
- Typecheck/lint/build OK.
- Produccion smoke OK.

Mejoras:

- Dashboard workspace.
- Assessment list cards.
- Lifecycle chips.
- Continue assessment.
- Forms/tabs en assessment detail.
- Admin banner.
- Reset/sign-up polish.

Limitaciones:

- El wizard de sign-up es demo/simulado y no debe venderse como assessment real completo.
- Browser QA autenticado real post-Antigravity sigue pendiente.

## 24. Operacion diaria

Checklist diario:

- Revisar `/`.
- Revisar `/shiftreadiness`.
- Revisar `/sign-in`.
- Revisar `/forgot-password`.
- Hacer login QA/admin si corresponde.
- Revisar dashboard.
- Revisar assessment list.
- Revisar admin queue.
- Revisar unlock requests.
- Revisar report/PDF si hay actividad.
- Revisar password recovery si hay tickets.
- Revisar feedback usuarios.
- Revisar logs Hostinger/Resend si hay acceso.

## 25. Soporte y SLA beta

Modelo actual:

- Soporte manual.
- Best-effort same business day para beta/pilotos.
- Low-volume.
- Invitation-only recomendado.

| Incidente | Accion |
| --- | --- |
| Usuario no recibe email | Revisar Resend/spam, reenviar, soporte manual |
| Upload falla | Pedir assessment ID, tipo de archivo, screenshot |
| Parser falla | Pedir archivo sintetico o metadata, revisar warnings |
| PDF falla | Pedir report ID, assessment ID, timestamp |
| Entitlement falla | Revisar admin queue y entitlement |
| Password reset falla | Revisar request neutral, Resend, token expirado/usado |

Full public launch requiere soporte/SLA formal.

## 26. QA data / cleanup / retention

Reglas:

- QA data debe estar marcada `safe to delete`.
- No hard-delete sin inventario.
- Preferir archive/soft-delete.
- No borrar storage fisico sin metadata/ownership.
- Retener temporalmente smoke data clave durante beta si sirve de evidencia.

Pendiente:

- Inventario real DB/storage.
- Archive/cleanup formal.

Riesgo:

- QA data visible o no gestionada puede confundir operaciones si se escala a public launch.

## 27. Limited public beta operating model

Limited beta activa bajo condiciones:

- Usuarios seleccionados.
- Bajo volumen.
- Soporte manual.
- Entitlement manual.
- Sin checkout self-service.
- Sin prometer migracion automatica.
- Sin prometer diagnostico absoluto.
- Uso evidence-based y conservador.

Permitido:

- Pilotos.
- Demos supervisadas.
- Socios/consultores seleccionados.

No permitido:

- Full public launch.
- Ads masivos sin monitoreo/logs.
- Paid self-service automatico.

## 28. Full public launch blockers

Bloqueadores:

- Hostinger logs/runtime evidence.
- Browser QA autenticado completo.
- Product flow replay real.
- QA cleanup/archive.
- Admin-safe report view.
- QA post-deploy de Adaptive Migration Context Intake.
- Soporte/SLA formal.
- Checkout/pagos si se quiere self-service.
- Public onboarding final.

Decision:

- Full public launch: NO.

## 29. Roadmap recomendado

1. `PUBLIC-BETA-OPS-3A - User-attested browser QA + logs evidence import`.
2. `OPS-1 - QA Data Cleanup / Archive`.
3. `ADMIN-UX-1 - Admin-safe report view`.
4. Browser QA automation.
5. Public launch SOP.
6. Checkout/payment si se quiere self-service.
7. MSP/partner workspace.
8. Sample report / Google Ads funnel.
9. Proxmox target readiness.
10. Veeam/backup evidence.

## 30. Glosario

- Workspace: contenedor privado de usuario/equipo.
- Assessment: trabajo de readiness.
- EvidenceFile: metadata de evidencia subida.
- RVTools: export de inventory VMware usado como evidencia.
- ParsedVM: VM parseada.
- Readiness Score: senal de preparacion.
- Evidence Confidence Score: confianza basada en evidencia.
- RiskFinding: hallazgo estructurado.
- UnlockRequest: solicitud manual de unlock.
- Entitlement: permiso concedido.
- readiness_report: full report desbloqueado.
- Controlled launch: uso productivo controlado.
- Limited public beta: acceso publico limitado/supervisado.
- Public launch: disponibilidad amplia/self-service.

## 31. Checklist operativo final

| Item | Estado |
| --- | --- |
| Production controlled launch | OK |
| Limited public beta | OK |
| Full public launch | NO |
| Auth | OK |
| Password recovery | OK |
| Dashboard | OK |
| Multi-assessment | OK |
| Upload gate | OK |
| Evidence upload | OK por evidencia previa |
| Parser RVTools P0 | OK |
| PDF | OK por evidencia previa |
| Admin | OK por evidencia previa |
| Hostinger logs | Pendiente |
| QA cleanup/archive | Pendiente |
| Public launch blockers | Abiertos |

## 32. Decision final

- Controlled production launch: SÍ.
- Limited public beta: SÍ.
- Full public launch: NO.
- Producto operativo para usuarios seleccionados: SÍ.
- Producto self-service publico masivo: NO todavia.

Conclusion:

ShiftReadiness esta operativo para beta publica limitada y controlada. El producto puede ser usado por usuarios seleccionados con soporte manual y expectativas claras. No debe abrirse todavia como full public launch hasta cerrar logs Hostinger, browser QA autenticado completo, replay real de product flow, QA cleanup/archive, admin-safe report UX, soporte/SLA formal y pagos/checkout si se requiere self-service.

## Addendum - PUBLIC-BETA-OPS-3A Evidence Import

Date: 2026-05-27.

Codex validated:

- Public production route smoke.
- Password recovery regression.
- Local build/typecheck/lint.

Not imported:

- Hostinger logs evidence.
- User-attested browser QA.
- User-attested product-flow replay.
- QA data cleanup/archive.

Decision remains:

- Controlled production launch: SI.
- Limited public beta: SI.
- Full public launch: NO.

## Addendum - PUBLIC-BETA-OPS-4 Final Evidence Closure Attempt

Date: 2026-05-27.

Codex validated:

- Local build/typecheck/lint after clearing only `.next` for Windows/OneDrive lock.
- Public route smoke.
- Password recovery neutral request and invalid-token controlled response.

Not provided:

- Hostinger logs.
- User/Claude authenticated browser QA.
- Product-flow replay.
- QA data inventory/archive.

Confidence remains:

- Controlled production launch: 100%.
- Limited public beta: 96-97%.
- Full public launch: 88-91%.
- Product total: 92-94%.

Decision:

- Limited public beta remains active.
- Full public launch remains NO.

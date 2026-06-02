# ShiftReadiness - Manual operativo y funcional v1.2
## Broader Invited Beta Edition

Fecha: 2026-05-28

Estado: manual interno vigente para broader invited beta.

Functional readiness update:

- `FUNCTIONAL-READINESS-1B` closed fresh authenticated smoke evidence for broader invited beta.
- User flow PASS by user-attested evidence.
- Admin flow PASS by user-attested evidence.
- Localhost PASS.
- Local Gemini smoke PASS with `providerStatus=success` using `gemini-flash-lite-latest`.
- Full public launch remains NO.

UX hardening update:

- `UX-HARDENING-1` completed pre-real-use polish without new features.
- Source CSS focus and transition behavior was tightened.
- Public `alert()` flows were replaced with inline status messaging.
- Dynamic success/error messages received basic ARIA semantics.
- Admin microcopy remains Spanish.
- Full public launch remains NO.

Demo update:

- `DEMO-1` adds public `/demo` as Migration Readiness Replay.
- The replay is simulated and uses synthetic Northbridge data only.
- It does not require login, backend, DB, Gemini, upload real or customer data.
- It is allowed for pre-onboarding education during broader invited beta.
- It must not be described as automatic migration, zero-downtime guarantee, cutover automation or full public launch.
- `DEMO-1.1` completes visual QA/conversion polish: mobile layout tightened, sound control clarified as visual-only and public copy moved away from execution/cutover wording.

Sample report update:

- `SAMPLE-REPORT-1` adds public `/sample-report` as a synthetic sample readiness report foundation.
- It shows the expected deliverable structure before a prospect uploads their own data.
- It uses synthetic Northbridge data only and does not use backend, DB, Gemini, upload, lead capture or customer data.
- SAMPLE-REPORT-1 originally left the downloadable PDF pending.
- `SAMPLE-REPORT-2` publishes the public synthetic PDF at `/sample-reports/proxmox-migration-readiness-sample-report.pdf`.
- The PDF has 15 pages, is generated with `npm run sample-report:generate`, and remains synthetic/no-customer-data only.
- `/sample-report` is the preferred page for explaining the sample before PDF download.
- `SAMPLE-REPORT-2.1` validates the PDF visually, fixes `/sample-report` mobile overflow and makes the generator reproducible by normalizing non-sensitive PDF metadata.

Sales page update:

- `SALES-PAGE-1` adds `/vmware-to-proxmox-readiness` as a standalone VMware -> Proxmox readiness offer page.
- It is linked only from `/demo` and `/sample-report`.
- It does not modify home, global navigation or `/shiftreadiness`.
- It uses no backend, DB, Gemini call, checkout, billing automatico, upload or customer data.
- Pricing shown there is orientative and manual for beta.
- Full public launch remains NO.
- `SALES-PAGE-1.1` validates desktop/mobile visual QA and tightens copy around planning assessment, manual beta pricing and no instant purchase.

EVIDENCE-8 update:

- Global readiness PDFs and public sample PDFs now use a lighter print-friendly visual system.
- `synthetic-data/` contains deterministic safe evidence scenarios for demos and QA.
- Demo/sample/landing messaging explains evidence expansion without claiming automatic migration, cutover validation or production migration success.
- EVIDENCE-7.1B authenticated browser QA remains pending.
- Full public launch remains NO.

EVIDENCE-9 closeout update:

- Evidence Expansion is operationally closed for controlled beta readiness.
- Migration Recommendation Plan remains code-complete and automated-QA accepted, but browser/manual closeout is still pending.
- Real customer use requires customer authorization, data review expectations and support/operator readiness.
- Full public launch remains NO.

Producto: ShiftReadiness / Proxmox Migration Readiness.

Publico objetivo: operador, owner, admin interno y equipo comercial/tecnico autorizado.

Full public launch: NO.

## 1. Portada

Este manual define como operar ShiftReadiness durante la beta ampliada por invitacion.

ShiftReadiness esta preparado para uso controlado con clientes invitados, MSPs o consultores conocidos, con supervision operativa, acceso manual, Gemini activo y consola admin interna en espanol.

Este documento no habilita lanzamiento publico masivo. Cualquier full public launch requiere decision explicita del owner/comercial y cierre de los criterios de la seccion 38.

## 2. Resumen ejecutivo

Estado actual:

- Controlled launch: 100%.
- Broader invited beta: aprobada.
- Full public launch: NO.
- Producto total: 99%.
- Produccion publica: OK.
- Rutas privadas: protegidas.
- User flow: PASS user-attested.
- Admin flow: PASS user-attested.
- Gemini Advisory: PASS.
- PDF: PASS.
- Admin console en espanol: PASS.
- Migration Readiness Replay `/demo`: activo como demo sintetica publica.
- Standalone VMware -> Proxmox readiness offer page `/vmware-to-proxmox-readiness`: activo, enlazado solo desde `/demo` y `/sample-report`.

ShiftReadiness puede operarse con clientes invitados en volumen bajo o moderado. La plataforma permite crear assessments, cargar evidencia, completar contexto, generar preview, descargar PDF, usar AI Advisory con Gemini, administrar accesos manuales, revisar consumo IA, gestionar oportunidades comerciales y aplicar runtime controls.

Quedan fuera del alcance actual:

- OpenAI.
- billing automatico.
- checkout publico.
- full public launch.
- SLA publico formal.
- edicion de secrets desde admin.
- hard-delete.
- impersonation.

## 3. Estado actual del producto

Estado validado:

- Gemini real en produccion: activo.
- OpenAI: no activo.
- PDF generation: activo.
- Report downloads: activo.
- Assessment creation: activo para usuarios autorizados.
- Admin console: activa en `/dashboard/admin`.
- IA y Consumo: activo.
- Presupuestos IA: activo como control operativo/estimado.
- Entitlements manuales: activos.
- Oportunidades comerciales: activas.
- Auditoria: activa para acciones admin y eventos operativos.
- Runtime controls: activos via `SystemSetting`.
- AiUsageEvent persistente: activo.
- Migration Readiness Replay: activo en `/demo`, simulado y sin backend.
- Public Sample Readiness Report: activo en `/sample-report`, sintetico y sin backend.
- Public Sample PDF: activo en `/sample-reports/proxmox-migration-readiness-sample-report.pdf`, sintetico y sin backend.
- Standalone Readiness Offer Page: activo en `/vmware-to-proxmox-readiness`, sin backend, sin checkout y sin full public launch.
- QA/demo data: identificada y documentada, no eliminada.

Condicion de uso:

- Beta por invitacion.
- Clientes controlados.
- Soporte manual.
- Pagos manuales.
- Sin trafico masivo.
- Sin claims de full public launch.

## 4. Decision de broader invited beta

Decision formal:

- Broader invited beta: SI.
- Full public launch: NO.
- Alcance inicial recomendado: 3 a 10 clientes controlados.
- Clientes objetivo: empresas con VMware real, MSPs conocidos, consultores conocidos y usuarios dispuestos a feedback.
- Registro masivo: NO.
- Google Ads fuerte o campanas publicas: NO.
- Checkout publico automatico: NO.

Uso permitido:

- invitaciones manuales;
- entitlements manuales;
- evidencia sintetica o aprobada por cliente;
- demos supervisadas;
- pagos manuales fuera del sistema si corresponde;
- soporte coordinado.

Uso no permitido:

- self-service publico amplio;
- public launch marketing;
- procesamiento de datos sensibles sin controles aprobados;
- OpenAI sin decision explicita;
- cambios de secrets desde admin;
- borrado destructivo de datos.

## 5. Que es ShiftReadiness

ShiftReadiness es una plataforma de readiness para migraciones desde VMware hacia Proxmox.

Ayuda a:

- entender inventario VMware;
- capturar contexto humano que RVTools no sabe inferir;
- identificar riesgos;
- separar evidencia recibida de evidencia faltante;
- calcular readiness score y confidence score;
- proponer waves de migracion;
- estimar sizing Proxmox;
- generar report preview;
- generar PDF;
- usar Gemini AI Advisory como capa consultiva;
- convertir hallazgos en oportunidades comerciales y proximas acciones.

El principio central es evidence-based:

- no inventar certeza;
- no ocultar gaps;
- no mezclar datos confirmados con inferencias;
- mantener scoring deterministico separado del advisory IA.

## 6. Que no promete

ShiftReadiness no promete:

- migracion garantizada;
- cero downtime;
- sizing definitivo sin evidencia suficiente;
- dependencias completas si no fueron provistas;
- backups validos si no existe evidencia;
- performance historica si no fue cargada;
- reemplazo de consultoria tecnica;
- reemplazo de pruebas de restore;
- reemplazo de plan de rollback;
- aprobacion automatica para produccion.

Gemini AI Advisory no reemplaza:

- Readiness Score.
- Confidence Score.
- Risk findings deterministas.
- Revision humana.
- Decisiones tecnicas finales.

## 7. Alcance de la beta invitada

La beta invitada permite:

- 1 a 3 assessments por cliente por defecto.
- 3 a 5 PDFs por cliente por defecto.
- AI Advisory habilitado.
- Full report habilitado manualmente.
- Soporte por email, WhatsApp o llamada coordinada.
- Seguimiento manual de oportunidades comerciales.

Restricciones:

- sin SLA contractual;
- sin billing automatico;
- sin checkout publico;
- sin trafico masivo;
- sin promesa de disponibilidad publica;
- sin borrado agresivo de QA/demo data;
- sin acceso admin a clientes normales.

## 8. Roles operativos

Owner:

- decide beta, pricing, full public launch y prioridades comerciales.

Admin interno:

- opera `/dashboard/admin`;
- administra accesos y planes;
- revisa consumo IA;
- aplica runtime controls;
- revisa auditoria;
- registra oportunidades;
- ejecuta rollback operativo si hace falta.

Operador tecnico:

- revisa build, Prisma, logs, PDF, Gemini, storage y rutas.

Comercial / customer success:

- invita clientes;
- define plan manual;
- interpreta opportunity score;
- coordina follow-up;
- registra notas internas.

Cliente beta:

- accede con cuenta autorizada;
- crea o abre assessment;
- carga evidencia aprobada;
- completa contexto;
- revisa preview/PDF;
- entrega feedback.

## 9. Flujo del cliente

Flujo esperado:

1. Cliente recibe invitacion.
2. Cliente usa `/sign-in` o `/sign-up` segun el caso.
3. Admin verifica usuario.
4. Admin asigna entitlement manual.
5. Cliente entra a `/dashboard`.
6. Cliente abre `/dashboard/assessments`.
7. Cliente crea o retoma assessment.
8. Cliente completa intake/context.
9. Cliente carga evidencia.
10. Cliente revisa report preview.
11. Cliente genera o descarga PDF si su plan lo permite.
12. Cliente revisa AI Advisory como orientacion, no como verdad absoluta.
13. Admin/comercial registra oportunidad y siguiente accion.

Si el cliente no tiene entitlement suficiente:

- puede ver preview limitado si aplica;
- full report/PDF/AI pueden quedar bloqueados;
- admin puede conceder acceso manual.

## 10. Flujo de assessment

Un assessment representa una evaluacion de readiness de un entorno.

Etapas:

- creacion;
- intake basico;
- assumptions;
- context intake;
- evidence upload;
- parsing y resumen;
- risk findings;
- readiness/confidence scoring;
- report preview;
- AI Advisory;
- PDF;
- follow-up comercial.

Regla operativa:

- no usar un assessment como artefacto final si confidence score es bajo y los gaps son criticos;
- no ocultar gaps para mejorar percepcion comercial;
- marcar QA/demo cuando corresponda.

## 11. Context Intake

Context Intake captura informacion que RVTools no contiene.

Ejemplos:

- objetivo de migracion;
- timeline;
- workloads criticos;
- tolerancia a downtime;
- backup/RPO/RTO;
- estado Proxmox target;
- constraints de red y storage;
- dependencias conocidas;
- evidencia faltante.

Estados validos:

- conocido;
- desconocido;
- no aplica;
- omitir por ahora.

Regla:

- contexto incompleto no bloquea upload;
- contexto incompleto baja confianza;
- los gaps deben aparecer en preview/PDF.

## 12. Upload y evidencia

Evidencia permitida durante beta:

- RVTools export aprobado por cliente;
- archivos sinteticos;
- metadata tecnica necesaria;
- contexto manual.

Reglas:

- no subir datos de clientes sin autorizacion;
- no imprimir raw file contents;
- no exponer storage paths privados;
- no compartir archivos por canales no aprobados;
- no borrar archivos reales sin proceso de cleanup separado.

Si upload falla:

- capturar tipo de archivo, tamano y assessment ID;
- no copiar contenido bruto al ticket;
- revisar storage y logs;
- pausar pruebas si hay indicio de exposicion.

## 13. Report preview

El report preview debe mostrar:

- Executive Summary.
- Evidence Received.
- Evidence Missing.
- Readiness Score.
- Confidence Score.
- Risk findings.
- VM complexity / risk matrix si aplica.
- Storage/network/backup risks.
- Application dependency gaps.
- Migration waves.
- Pilot candidates.
- Hold/no-go items.
- Required validations.
- AI Advisory si esta disponible.

QA basico:

- no JSON crudo;
- no `[object Object]`;
- no secrets;
- no storage paths privados;
- no raw uploaded file content;
- scores visibles y separados del advisory IA.

## 14. PDF

El PDF es el artefacto descargable del assessment.

Debe:

- generarse con renderer real;
- abrir correctamente;
- no estar vacio;
- incluir secciones principales;
- incluir AI Advisory si el provider responde y el plan lo permite;
- preservar readiness/confidence scores;
- marcar evidencia faltante;
- no exponer secrets ni raw files.

Si PDF falla:

- confirmar si es un caso puntual o global;
- pausar PDF generation desde Configuracion Operativa si el impacto es amplio;
- registrar incidente;
- no hacer hard-delete de reportes;
- restaurar cuando el flujo este validado.

## 15. Gemini AI Advisory

Gemini esta activo en produccion.

Uso esperado:

- AI Advisory en preview;
- AI Advisory en PDF;
- executive advisory;
- technical advisory;
- confidence impact;
- follow-up questions;
- recommended next actions;
- limitations.

Guardrails:

- no raw RVTools/XLSX/CSV;
- no secrets;
- no cookies/tokens;
- no storage paths;
- no prompts completos persistidos;
- no respuestas crudas persistidas;
- fallback si Gemini falla.

OpenAI:

- no activo;
- no debe activarse sin decision explicita.

## 16. Scoring, confidence y evidencia faltante

Readiness Score:

- mide preparacion tecnica segun reglas deterministicas.

Confidence Score:

- mide calidad/cobertura de evidencia.

Evidence Missing:

- debe listar gaps relevantes;
- debe diferenciar lo no provisto de lo inferido.

Reglas:

- AI Advisory no reemplaza scores;
- no presentar inferencias como hechos;
- no prometer readiness alto si confidence es bajo;
- no convertir falta de evidencia en aprobacion tacita.

## 17. Seguridad y privacidad

Principios:

- minimo acceso;
- rutas privadas protegidas;
- admin solo por usuario autorizado;
- no secrets en UI;
- no raw files en logs;
- no storage paths privados;
- no hard-delete;
- no impersonation.

Nunca mostrar:

- `DATABASE_URL`;
- `DIRECT_URL`;
- `BETTER_AUTH_SECRET`;
- `GEMINI_API_KEY`;
- `OPENAI_API_KEY`;
- tokens;
- cookies;
- storage root privado completo.

## 18. Consola de administracion

Ruta:

- `/dashboard/admin`

Acceso:

- mismo login del producto;
- admin autorizado por `ADMIN_EMAILS` y/o mecanismos internos existentes;
- sin sesion redirige a `/sign-in`;
- usuario autenticado no admin ve acceso denegado en espanol.

La consola es interna. No es parte del flujo cliente.

Secciones principales:

- Resumen.
- Estado del Sistema.
- Usuarios.
- Assessments / Evaluaciones.
- IA y Consumo.
- Accesos y Planes.
- Oportunidades.
- Configuracion Operativa.
- Auditoria.
- Errores / eventos si aplica.

## 19. Centro Operativo

El Centro Operativo permite revisar salud general.

Modulos:

- Sistema general.
- Base de datos.
- Autenticacion.
- Storage privado.
- Uploads.
- Parser / evidence.
- Report preview.
- PDF.
- IA Advisory.
- Email.
- Produccion Hostinger.

Estados:

- Operativo.
- Atencion.
- Degradado.
- Critico.
- Desconocido.
- No configurado.

Uso:

- revisar antes de invitar nuevos clientes;
- revisar despues de deploy;
- revisar si hay incidente;
- no exponer detalles sensibles.

## 20. IA y Consumo

La seccion IA y Consumo muestra:

- IA activa;
- proveedor;
- modelo;
- Gemini key configurada/no configurada sin valor;
- OpenAI key configurada/no configurada sin valor;
- ultimos estados;
- fallbacks;
- eventos persistentes;
- llamadas;
- errores;
- timeouts;
- tokens estimados;
- costos estimados;
- consumo por usuario;
- consumo por assessment.

Los costos son estimados:

- pueden diferir de facturacion real;
- se calculan para control operativo;
- no reemplazan billing.

## 21. Presupuestos IA

Presupuestos IA permiten controlar gasto estimado.

Settings operativos:

- presupuesto mensual estimado;
- alertas 50/80/100;
- limite diario informativo;
- limite por usuario informativo;
- limite por assessment informativo;
- bloqueo por presupuesto si se habilita.

Regla:

- en beta, revisar consumo manualmente;
- no asumir que el costo mostrado es factura exacta;
- si consumo sube anormalmente, pausar IA o pasar a mock.

## 22. Accesos y Planes

Accesos y Planes administra entitlements manuales.

Planes operativos:

- `internal_qa`;
- `free_preview`;
- `starter`;
- `professional`;
- `blueprint`;
- `msp_partner`;
- `admin`.

Campos tipicos:

- usuario;
- email;
- plan;
- estado;
- origen;
- vencimiento;
- IA habilitada;
- full report habilitado;
- PDF habilitado;
- notas internas.

## 23. Entitlements manuales

Los entitlements controlan acceso.

Estados:

- active;
- trial;
- manual;
- pending_payment;
- expired;
- revoked.

Reglas iniciales:

- `internal_qa`: solo uso interno.
- `free_preview`: preview limitado.
- `starter`: assessment acotado.
- `professional`: full report/PDF/AI para cliente real.
- `blueprint`: clientes que requieren plan tecnico/proxmox target.
- `msp_partner`: consultores/MSPs con multiples assessments.

Cambios de acceso:

- deben tener confirmacion;
- deben auditarse;
- no deben usarse para usuarios reales sensibles sin revision.

## 24. Oportunidades comerciales

Oportunidades comerciales ayudan a priorizar seguimiento.

Inputs:

- cantidad de VMs;
- readiness;
- confidence;
- evidence gaps;
- backup readiness;
- Proxmox target data;
- PDF generado;
- AI Advisory;
- uso recurrente;
- plan actual.

Tags:

- Alto potencial.
- Requiere seguimiento.
- Candidato a Blueprint.
- Candidato Professional.
- Candidato MSP.
- Falta evidencia critica.
- Riesgo alto.
- Listo para propuesta.
- Pendiente de pago.
- Cliente dormido.

Next best action:

- Ofrecer Assessment Professional.
- Solicitar Veeam export.
- Solicitar mapa de dependencias.
- Ofrecer Migration Blueprint.
- Ofrecer diseno Proxmox destino.
- Agendar revision tecnica.
- Hacer seguimiento comercial.
- No contactar todavia.

## 25. Auditoria

Auditoria registra acciones internas y eventos operativos.

Eventos esperados:

- cambios de runtime setting;
- cambios de presupuesto;
- cambios de entitlement;
- cambios de oportunidad;
- admin AI test;
- bloqueos por entitlement;
- bloqueos por budget;
- PDF/report actions;
- eventos IA.

La metadata debe ser segura:

- sin secrets;
- sin prompts completos;
- sin raw responses;
- sin raw file content;
- sin storage paths privados.

## 26. Configuracion Operativa

Configuracion Operativa controla runtime settings seguros.

Secciones:

- IA Advisory.
- Presupuesto IA.
- Reportes/PDF.
- Downloads.
- Assessments.
- Uploads si esta conectado.
- Registro publico si esta conectado.
- Mantenimiento si esta conectado.

Regla:

- no editar Hostinger desde admin;
- no guardar secrets en `SystemSetting`;
- todo cambio operativo debe auditarse;
- todo cambio que degrade produccion debe poder revertirse.

## 27. Runtime controls

Runtime controls son overrides en DB sobre configuracion base.

Modo IA:

- `env`: usar env vars actuales.
- `disabled`: apagar IA sin tocar Hostinger.
- `mock`: usar mock operativo.
- `gemini`: forzar Gemini si key esta configurada.

Estado final deseado durante beta:

- IA: `env/gemini` operativo.
- PDF generation: enabled.
- Downloads: enabled.
- Assessment creation: enabled.
- Maintenance mode: disabled.
- OpenAI: no activo.

## 28. Enforcement IA/PDF/assessment

Enforcement IA:

- verifica runtime mode;
- verifica budget si bloqueo activo;
- verifica entitlement;
- registra evento;
- devuelve fallback si bloquea.

Enforcement PDF:

- verifica PDF generation enabled;
- verifica entitlement/full report;
- respeta limites si existen;
- bloquea con mensaje en espanol.

Enforcement downloads:

- verifica downloads enabled;
- verifica entitlement si aplica.

Enforcement assessment:

- verifica creation enabled;
- verifica max assessments si aplica.

Los bloqueos no deben crashear preview, PDF ni dashboard.

## 29. Rollback IA

Rollback preferido desde admin:

1. Ir a `/dashboard/admin`.
2. Abrir Configuracion Operativa.
3. Cambiar IA a `disabled` si Gemini rompe flujo.
4. Cambiar IA a `mock` si se necesita advisory no-real temporal.
5. Confirmar auditoria.
6. Validar preview/PDF.
7. Restaurar `env/gemini` cuando este resuelto.

Rollback por env queda como capa base si admin no esta disponible:

- `AI_ADVISORY_ENABLED=false`;
- `AI_ADVISORY_PROVIDER=mock`;
- `AI_ADVISORY_PROVIDER=disabled`.

No imprimir ni editar claves desde admin.

## 30. Rollback PDF/download/assessment

PDF:

- desactivar PDF generation si PDF rompe globalmente;
- documentar assessment afectado;
- mantener preview operativo;
- reactivar despues de hotfix/validacion.

Downloads:

- desactivar downloads si hay riesgo de acceso indebido;
- revisar permisos;
- reactivar cuando este controlado.

Assessment creation:

- bloquear nuevos assessments si hay incidente de DB/storage/upload;
- no bloquear usuarios existentes mas de lo necesario;
- reactivar tras validacion.

## 31. Soporte e incidentes

Canales beta:

- email directo;
- WhatsApp;
- llamada coordinada;
- registro interno con assessment ID.

Sin SLA contractual durante beta.

Clasificacion:

- Critico: secrets visibles, rutas privadas publicas, perdida de datos, PDF global roto, DB caida.
- Alto: Gemini falla sin fallback, upload falla para todos, admin inaccesible.
- Medio: PDF falla en un assessment, AI timeout puntual, entitlement mal configurado.
- Bajo: texto UI, warning conocido, QA/demo no filtrado.

## 32. Onboarding de cliente beta

Checklist:

1. Confirmar que el cliente acepta beta invitada.
2. Verificar que el caso es VMware/Proxmox relevante.
3. Crear o verificar usuario.
4. Asignar entitlement manual.
5. Explicar limites de uso.
6. Pedir RVTools o evidencia aprobada.
7. Pedir contexto: objetivo, timeline, downtime, backup, dependencias.
8. Crear o guiar assessment.
9. Revisar preview.
10. Generar PDF si corresponde.
11. Revisar AI Advisory con prudencia.
12. Registrar oportunidad comercial.
13. Definir next best action.

## 33. Operacion diaria

Checklist diario:

- validar rutas publicas si hay actividad;
- revisar `/dashboard/admin`;
- revisar Estado del Sistema;
- revisar IA y Consumo;
- revisar errores/timeouts;
- revisar unlock/access requests;
- revisar oportunidades nuevas;
- revisar presupuesto IA;
- revisar que runtime settings sigan operativos;
- registrar incidentes.

## 34. Operacion semanal

Checklist semanal:

- revisar clientes beta activos;
- revisar assessments creados;
- revisar PDFs generados;
- revisar consumo IA por usuario/assessment;
- revisar costos estimados;
- revisar oportunidades de alto potencial;
- revisar QA/demo data para no mezclar con comercial;
- revisar docs de incidentes;
- decidir si invitar nuevos clientes.

## 35. Pricing y pagos manuales

Durante beta:

- billing automatico: NO.
- checkout publico: NO.
- pagos manuales: permitidos si owner lo aprueba.
- acceso se concede desde admin.

Planes orientativos:

- Free Preview: exploracion inicial.
- Starter: assessment acotado.
- Professional: report completo con PDF/AI.
- Blueprint: plan tecnico/proxmox target.
- MSP Partner: multiples assessments.

No publicar pricing masivo sin decision explicita.

## 36. Riesgos aceptados

Aceptados para broader invited beta:

- QA/demo data identificada pero no archivada completamente.
- Costos IA estimados, no facturacion exacta.
- Billing manual.
- Soporte sin SLA formal.
- Hostinger logs no integrados en admin.
- Checkout automatico ausente.
- Beta dependiente de supervision operativa.

## 37. Riesgos no aceptados

No aceptados:

- secrets visibles;
- rutas privadas publicas;
- admin accesible a no-admin;
- PDF globalmente roto;
- Gemini sin fallback;
- perdida de datos;
- hard-delete accidental;
- OpenAI activado sin decision;
- full public launch sin aprobacion explicita;
- storage paths privados visibles;
- raw file contents en logs o UI.

## 37A. Evidence Expansion Operating Rules

Evidence Expansion is an optional evidence layer for controlled beta readiness. It extends the RVTools-first assessment with additional evidence modules that improve confidence, but it does not execute migrations or certify production cutover readiness.

Available modules:

- Common Evidence Framework: module state, parser registry, upload association, parse results and admin visibility.
- VMware Enrichment: read-only vCenter-oriented evidence for VM/host/cluster metadata beyond RVTools.
- Proxmox Target Validation: read-only destination evidence for target node, HA, storage and capacity signals.
- Backup Evidence: backup/restore evidence parser and readiness gates; restore testing must be proven by evidence, not assumed.
- Storage/SAN Evidence: vendor-neutral templates for storage capacity, mapping and target constraints.
- Application Dependency Mapping: CSV/JSON mapping for technical dependencies and functional wave confidence.
- Migration Recommendation Plan: separate gated planning deliverable.
- Synthetic Dataset Library: safe QA/demo scenarios only; not customer evidence.

Operating interpretation:

- Missing evidence is a confidence limiter, not something to hide.
- Optional evidence improves precision when supplied and parsed.
- Missing backup evidence limits business continuity and critical workload confidence.
- Missing target evidence limits destination sizing and storage confidence.
- Missing dependency evidence limits functional-wave claims.
- Missing storage/SAN evidence limits storage readiness conclusions.

Customer positioning:

- Allowed: evidence-based readiness, read-only evidence, planning support, confidence scoring, gated recommendations, human review required.
- Not allowed: automatic migration, guaranteed success, validated cutover, universal SAN integration, production migration approval, no human review needed or full public launch readiness.

Before using Evidence Expansion with real customer data:

- Confirm customer authorization and scope.
- Explain collectors/templates are read-only.
- Ask the customer to review collector output before upload.
- Avoid secrets, credentials, cookies, tokens and private paths.
- Define retention and support expectations.
- Validate entitlement and private download behavior.
- Run browser/manual QA for the specific customer-facing flow when required.

## 37B. Migration Recommendation Plan Operating Rule

The Migration Recommendation Plan is a recommendation and planning deliverable, not an execution runbook and not a cutover certificate.

Rules:

- It depends on available evidence and deterministic gates.
- It does not certify production migration readiness.
- It does not override missing backup, target, storage or dependency evidence.
- If backup/target/storage/dependency evidence is missing, the plan level and confidence must remain limited.
- Functional waves are normally candidates unless strong dependency and business evidence supports validation.
- AI narrative, when present, must not override deterministic gates or scores.
- EVIDENCE-7.1B browser/manual QA remains pending before the plan is sold or described as fully browser-validated.

Before commercial use of the Migration Recommendation Plan:

- Close EVIDENCE-7.1B.
- Confirm authenticated browser generation/download/open.
- Confirm admin browser visibility.
- Confirm entitlement/ownership denial behavior if feasible.
- Confirm PDF visual QA and no-secret review.
- Obtain owner/commercial approval.

## 37C. Collector Operating Rule

Collectors and templates are evidence helpers. They are not remote-control tools.

Rules:

- Collectors must be read-only.
- Collectors must not store credentials in committed files.
- Collectors must not upload automatically without customer/operator action.
- Collectors must not modify VMware, Proxmox, backup, storage or network infrastructure.
- Customers should be able to inspect output before upload.
- Collector output should avoid secrets, tokens, cookies, private paths and passwords.
- Collectors should be tested in a controlled environment before real customer use.
- Collector use does not replace customer authorization or human review.

## 38. Criterios para full public launch

Checklist requerido:

- decision explicita owner/comercial;
- soporte/SLA publico definido;
- pricing publico final;
- proceso comercial o checkout definido;
- QA/demo archive/filtro final;
- Hostinger runtime/build/error logs revisados;
- 3 a 5 clientes beta sin incidentes criticos;
- reporte/PDF estable;
- costos IA bajo control;
- paginas publicas revisadas;
- politica de privacidad/terminos revisados;
- rollback IA/PDF/runtime probado;
- monitoreo/logs suficientes;
- plan de incidentes documentado.

Hasta cerrar esto:

- full public launch: NO.

## 39. Checklist de invitacion de cliente

Antes de invitar:

- cliente es fit para VMware/Proxmox;
- owner aprueba invitacion;
- plan beta definido;
- entitlement preparado;
- limites explicados;
- soporte definido;
- expectativa de feedback aceptada;
- datos/evidencia autorizados;
- no se promete full launch ni SLA publico.

## 40. Checklist de cierre de assessment

Antes de entregar:

- preview abre;
- PDF genera/descarga;
- scores visibles;
- confidence interpretado;
- evidence gaps explicados;
- AI Advisory revisado;
- no JSON crudo;
- no `[object Object]`;
- no secrets;
- no storage paths;
- oportunidad registrada;
- next best action definido.

## 41. Checklist de incidente

Ante incidente:

1. Clasificar severidad.
2. Capturar hora, usuario, assessment ID y ruta.
3. No copiar secrets ni raw files.
4. Revisar admin/Estado del Sistema.
5. Revisar Auditoria.
6. Aplicar runtime rollback si corresponde.
7. Validar rutas publicas y privadas.
8. Comunicar al cliente si fue afectado.
9. Documentar causa y resolucion.
10. Restaurar estado final seguro.

Estado final seguro:

- IA `env/gemini` si esta sana, o `disabled/mock` si hay incidente activo.
- PDF/download enabled si no hay riesgo.
- Assessment creation enabled si no hay riesgo.
- Maintenance mode disabled salvo incidente critico.

## 42. Anexos tecnicos

Rutas principales:

- `/`
- `/shiftreadiness`
- `/sign-in`
- `/sign-up`
- `/forgot-password`
- `/reset-password`
- `/dashboard`
- `/dashboard/assessments`
- `/dashboard/admin`

Endpoints admin relevantes:

- `GET /api/admin/ai/status`
- `GET /api/admin/ai/usage`
- `GET /api/admin/settings`
- `POST /api/admin/settings`
- `GET /api/admin/entitlements`
- `POST /api/admin/entitlements/update`
- `GET /api/admin/opportunities`
- `GET /api/admin/audit`

Modelos operativos:

- `AiUsageEvent`
- `SystemSetting`
- `UserEntitlement`
- `CommercialOpportunity`
- `AuditEvent`

Validaciones base:

- `npm run hostinger:diagnose`
- `npm run ai:guardrails`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npx prisma validate`
- `npx prisma generate`

Documentos relacionados:

- `docs/hito-launch-decision-1-broader-invited-beta.md`
- `docs/hito-public-launch-readiness-2.md`
- `docs/hito-pre-launch-1-full-controlled-beta-acceptance.md`
- `docs/hito-qa-cleanup-archive-1.md`
- `docs/hito-admin-4-runtime-settings-enforcement-commercial-hardening.md`
- `docs/hito-admin-4-prod-ops-smoke.md`
- `docs/launch-controlled-operating-pack.md`
- `docs/production-controlled-launch-decision.md`
- `docs/ai-advisory-production-provider-runbook.md`
- `docs/ai-advisory-guardrails.md`

Word export:

- Pendiente. No se detecto un generador repo-safe actual para producir y verificar el DOCX v1.2 durante este hito.
- La version fuente vigente es este Markdown.

Decision final:

- Manual v1.2 complete: SI.
- Ready for broader invited beta: SI.
- Ready for full public launch: NO.

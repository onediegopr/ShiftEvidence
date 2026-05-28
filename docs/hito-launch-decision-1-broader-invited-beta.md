# HITO LAUNCH-DECISION-1 - Broader Invited Beta Decision Pack

Fecha: 2026-05-28.

## Objetivo

Definir una decision formal para ampliar ShiftReadiness a una beta limitada/invitada mas amplia sin declarar full public launch.

Este hito no agrega features, no cambia schema, no toca Hostinger y no cambia pricing publico.

## Decision ejecutiva

- Broader invited beta: APROBADA.
- Full public launch: NO aprobado.
- Tipo de lanzamiento: beta limitada por invitacion.
- Alcance inicial recomendado: 3 a 10 clientes controlados.
- Trafico masivo: NO.
- Google Ads / campanas fuertes: NO.
- Checkout publico automatico: NO.

## Alcance de la broader invited beta

Permitido:

- usuarios invitados manualmente;
- empresas con VMware real y necesidad de evaluar Proxmox;
- MSPs o consultores conocidos;
- clientes dispuestos a feedback;
- demos supervisadas;
- datasets sinteticos o evidencia aprobada por el cliente.

No permitido:

- registro masivo sin supervision;
- self-service publico amplio;
- claims de full public launch;
- campañas de alto volumen;
- checkout automatico sin decision posterior;
- uso con datos sensibles sin aprobacion/controles adecuados.

## Limites iniciales de uso

Recomendacion por cliente beta:

- 1 a 3 assessments.
- 3 a 5 PDFs.
- AI Advisory habilitado.
- Full report habilitado manualmente por admin.
- Upload sujeto a `MAX_UPLOAD_SIZE_MB`.
- Soporte coordinado por email/WhatsApp/llamada.
- Sin SLA contractual.

Runtime/admin:

- PDF generation debe permanecer enabled salvo incidente.
- Downloads deben permanecer enabled salvo incidente.
- Assessment creation debe permanecer enabled para usuarios autorizados.
- IA debe permanecer `env/gemini` salvo rollback.
- OpenAI no activo.

## Planes y acceso manual

Entitlements disponibles:

- `internal_qa`
- `free_preview`
- `starter`
- `professional`
- `blueprint`
- `msp_partner`

Uso recomendado:

- `free_preview`: exploracion inicial sin full report amplio.
- `starter`: beta liviana / un assessment acotado.
- `professional`: clientes con evidencia real y PDF/full report.
- `blueprint`: clientes que requieren plan tecnico/proxmox target.
- `msp_partner`: consultores/MSPs con multiples evaluaciones.
- `internal_qa`: solo QA/control interno.

Pagos:

- pagos manuales permitidos fuera del sistema;
- acceso concedido desde admin;
- billing automatico: NO.

## Soporte e incidentes

Canales sugeridos:

- email directo;
- WhatsApp o llamada coordinada para clientes beta;
- registro interno de incidentes con assessment ID y screenshot.

Expectativa:

- sin SLA contractual;
- respuesta best-effort durante beta;
- incidentes criticos atendidos manualmente.

Playbooks:

- Si Gemini falla: usar fallback; si degrada reportes, poner IA en `disabled` o `mock` desde runtime settings.
- Si PDF falla: pausar PDF generation/downloads desde admin runtime settings y documentar assessment afectado.
- Si upload falla: capturar archivo/tipo/tamano, no exponer contenido, revisar storage y logs.
- Si DB falla: detener pruebas, revisar Neon/Hostinger, no ejecutar reset.
- Si admin falla: mantener rutas privadas protegidas, revisar logs, hotfix minimo.

## Riesgos aceptados para beta invitada

- QA/demo data identificada pero no archivada completamente.
- Costos IA son estimados, no facturacion exacta.
- Billing manual.
- Soporte sin SLA formal.
- Hostinger logs no integrados en admin.
- Checkout automatico ausente.
- Beta dependiente de supervision operativa.

## Riesgos no aceptados

- Secrets visibles.
- Rutas privadas publicas.
- Admin accesible a no-admin.
- PDF globalmente roto.
- Gemini sin fallback.
- Perdida de datos.
- Hard-delete accidental.
- OpenAI activado sin decision.
- Full public launch sin aprobacion explicita.

## Criterios para full public launch

Checklist futuro:

- decision explicita owner/comercial;
- soporte/SLA publico definido;
- pricing publico y proceso comercial final;
- checkout/billing o proceso manual documentado publicamente;
- QA/demo archive/filtro final;
- Hostinger runtime/build/error logs revisados;
- al menos 3 a 5 clientes beta sin incidentes criticos;
- reporte/PDF estable;
- costos IA bajo control;
- paginas publicas/pricing revisadas;
- politica de privacidad/terminos revisados;
- rollback IA/PDF/runtime probado y documentado.

## Validaciones del hito

Validaciones ejecutadas:

- `npm run hostinger:diagnose`: OK.
- `npm run ai:guardrails`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK.
- `npx prisma validate`: OK.
- `npx prisma generate`: OK.

Warning:

- NFT warning conocido en `next.config.mjs` / `reportStorageService`, no bloqueante.

## Fuera de alcance respetado

- No features nuevas.
- No DB schema.
- No Prisma reset.
- No Hostinger config.
- No OpenAI.
- No full public launch.
- No cambios de pricing publico.
- No secretos.
- No borrado de QA/demo.

## Decision final

- Broader invited beta approved: SI.
- Full public launch approved: NO.
- Proximo hito recomendado: `MANUAL-FINAL-v1.2` o `LAUNCH-OPS-1`.

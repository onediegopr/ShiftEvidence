# HITO ADVISOR-3F-SMOKE — Authenticated Admin Visibility Smoke

## 1. Objetivo

Validar de forma controlada la nueva visibilidad admin de Senior Advisor Methodology Context, confirmando health publico, validaciones locales y disponibilidad del flujo admin sin exponer informacion sensible ni declarar full public launch.

Estado: PARCIAL / BLOQUEADO EN AUTHENTICATED ADMIN SMOKE.

## 2. Contexto

ADVISOR-3F quedo implementado y pusheado en `6441fc1 feat: add advisor methodology admin visibility`.

La funcionalidad agregada incluye:

* runtime flag status;
* KB health;
* usage stats desde `AiUsageEvent`;
* pestana interna `Advisor Metodologia` en `/dashboard/admin`;
* resumen en la vista principal admin.

Full public launch: NO declarado.

## 3. Validaciones locales

Precheck Git:

* Branch: `main`.
* HEAD inicial: `6441fc1 feat: add advisor methodology admin visibility`.
* `origin/main`: alineado con `main`.
* Working tree inicial: limpio.
* Stashes preservados:
  * `stash@{0}: On main: park unrelated Hero/index changes before ADVISOR-2C`
  * `stash@{1}: On main: park beta invite docs before functional readiness`

Validaciones ejecutadas:

* `npm run lint`: OK.
* `npm run typecheck`: OK.
* `npm run test:run`: OK, 58 files / 274 tests.
* `npm run test:run -- admin advisor methodology`: OK, 23 files / 126 tests.
* `npm run build`: BLOQUEADO dos veces por `EPERM: operation not permitted, unlink` sobre artefacto en `.next/static`.

El bloqueo de build coincide con el problema ambiental local ya observado previamente. No se limpio `.next` ni se hicieron acciones destructivas.

## 4. Produccion publica

Health check anonimo con `curl.exe -L`:

* `https://shiftevidence.com/`: 200.
* `https://shiftevidence.com/shiftreadiness`: 200.
* `https://shiftevidence.com/sign-in`: 200.
* `https://shiftevidence.com/sign-up`: 200.
* `https://shiftevidence.com/dashboard`: redirect efectivo a `https://shiftevidence.com/sign-in`, 200 final.
* `https://shiftevidence.com/dashboard/assessments`: redirect efectivo a `https://shiftevidence.com/sign-in`, 200 final.
* `https://shiftevidence.com/dashboard/admin`: redirect efectivo a `https://shiftevidence.com/sign-in`, 200 final.

Assets `/_next` muestreados desde home:

* 8 assets revisados.
* 8/8 respondieron 200.

Resultado: produccion publica sana para rutas publicas y redirects anonimos esperados para rutas privadas. No se observo Hostinger 404 en el health check anonimo.

## 5. Admin authenticated smoke

No se pudo completar smoke autenticado admin desde Codex porque el canal seguro de Chrome no quedo disponible.

Checks realizados sin inspeccionar cookies, localStorage, passwords ni datos de sesion:

* Chrome instalado: OK.
* Chrome corriendo: OK.
* Codex Chrome Extension instalada y habilitada: OK.
* Native host manifest: BLOQUEADO por registry key faltante para `com.openai.codexextension`.

Por esta razon no se navego autenticado a `/dashboard/admin` y no se pudo verificar visualmente la pestana `Advisor Metodologia` en produccion.

No se usaron credenciales. No se inspeccionaron cookies ni localStorage.

## 6. Runtime status observado

Produccion autenticada: no observado por bloqueo de canal Chrome/auth.

Validado por codigo y tests locales:

* Flag esperado: `ADVISOR_METHODOLOGY_CONTEXT_ENABLED`.
* Activacion: env-only.
* Default: disabled.
* Solo `true` exacto habilita.
* Valores no `true` no se exponen como raw value.

Si el usuario observa flag OFF en produccion pese a haber cargado `true`, las causas probables a investigar en hito separado son: runtime sin reload/restart, env no tomada por el proceso, lectura desde runtime distinto o deploy no sincronizado.

## 7. KB health observado

Produccion autenticada: no observado por bloqueo de canal Chrome/auth.

Validado por codigo y tests locales:

* Registry valido.
* Catalogo activo esperado con bloques:
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
* La vista admin usa summaries seguros: id, title, version, status, exposureLevel, domain y lastReviewedAt.
* No se retorna `content` de bloques.

## 8. Usage stats observado

Produccion autenticada: no observado por bloqueo de canal Chrome/auth.

Validado por codigo y tests locales:

* Ventana default: 30 dias.
* Metricas agregadas:
  * eventos Advisor;
  * eventos con metadata metodologica;
  * included;
  * skipped;
  * error;
  * disabled;
  * average block count;
  * warnings;
  * blocked reasons;
  * top block IDs.
* Empty state seguro cubierto por fallback.
* La agregacion no devuelve metadata cruda, prompts, respuestas, preview completo ni contenido de bloques.

## 9. Sensitivity check

Confirmado por implementacion, tests y revision del smoke local:

* No prompts completos.
* No respuestas crudas.
* No `previewText`.
* No block content completo.
* No secrets.
* No cookies.
* No localStorage.
* No raw customer data.
* No restricted block content.
* No `needs_review` como fact.

## 10. Admin regression

Produccion autenticada: no observado por bloqueo de canal Chrome/auth.

Cobertura local:

* `npm run typecheck`: OK.
* Suite completa: OK.
* Focused admin/advisor/methodology: OK.
* Public private-route redirects anonimos: OK.

No se detecto regresion por test o health anonimo.

## 11. DB read-only

No se ejecuto consulta DB read-only.

Motivo: este smoke no requirio acceso DB directo y no habia canal autenticado admin disponible para comparar UI vs DB. No se forzo uso de secrets ni se imprimio `DATABASE_URL`.

## 12. Issues detectados

* Build local bloqueado por `EPERM unlink` en `.next/static`, repetido dos veces. Tratado como ambiental por historial previo y porque lint/typecheck/tests pasaron.
* Authenticated admin smoke bloqueado porque Chrome extension backend no pudo comunicarse con el native host. Chrome y extension existen, pero falta registry key del native host.

## 13. Hotfixes

No hubo hotfixes.

No se modifico codigo de producto.
No se modifico Prisma schema.
No se crearon migraciones.
No se tocaron env vars, Hostinger, deploy, billing ni providers.

## 14. Estado final

Estado del hito: PARCIAL / BLOQUEADO EN AUTHENTICATED ADMIN SMOKE.

Completado:

* Precheck git.
* Validaciones locales relevantes.
* Health publico anonimo.
* Asset sample.
* Verificacion de bloqueo seguro del canal Chrome/auth.
* Documentacion del resultado.

Pendiente:

* Smoke autenticado real de `/dashboard/admin`.
* Confirmacion visual de la pestana `Advisor Metodologia`.
* Observacion productiva de runtime status, KB health y usage stats desde sesion admin.

Full public launch: NO declarado.

## 15. Riesgos pendientes

* Observacion productiva real prolongada.
* Verificacion autenticada admin.
* Deeper KB curation.
* Optional embeddings/RAG.
* Billing real.
* Retention/export/delete.
* Full public launch.

## 16. Proximo paso recomendado

Reintentar ADVISOR-3F-SMOKE con canal Chrome reparado o con user-attestation manual del usuario desde una sesion admin. Si la visibilidad queda suficiente, avanzar a cierre documental Advisor-3; si se quiere endurecer metodologia antes, continuar con ADVISOR-3G — Methodology KB Curation Hardening.

# Production Cutover Plan 2

Fecha: 2026-06-05

## 1. Objetivo

Documentar un plan completo, accionable y seguro para un futuro cutover productivo de ShiftEvidence, sin ejecutar produccion durante este hito.

Este documento define el orden recomendado de preparacion, criterios go/no-go, variables productivas requeridas, smoke tests post-cutover, rollback y riesgos pendientes.

## 2. Estado actual

Estado inicial del hito:

| Area | Avance |
| --- | ---: |
| PRODUCTION-CUTOVER-PLAN-2 | 0% |
| Production/cutover readiness | 86% |
| Vercel readiness | 88% |
| Storage/R2 | 97% |
| Billing | 95% |
| Stripe live readiness | 65% |
| Admin ops | 94% |
| General technical | 97% |

Resumen tecnico actual:

- El branch local `main` esta alineado con `origin/main`.
- El ultimo hito de readiness dejo el veredicto en planificacion productiva solamente.
- El proyecto Vercel auditado para recovery no tiene variables de Production configuradas.
- Preview tiene smokes completados para origen confiable, Neon preview, R2 preview, Upstash preview, admin autenticado y Stripe test mode.
- R2 preview fue validado con bucket `shift-evidence-preview-evidence`.
- El bucket productivo planificado `shift-evidence-prod-evidence` no fue usado ni smoked.
- Stripe test mode alcanza Hosted Checkout correctamente.
- Stripe live no esta listo para habilitar pagos reales.
- Upstash preview esta configurado; Upstash productivo no debe asumirse creado.
- La validacion visual final de PDF sigue pendiente antes de un cutover publico.

## 3. Veredicto actual

No-Go para cutover productivo inmediato.

Ready for production cutover planning only.

El sistema esta en buen estado tecnico para planificar el cutover, pero no debe ejecutarse produccion hasta cerrar los bloqueos de Vercel Production env, Neon production DB, R2 production storage smoke, Upstash production rate limit, Stripe live/webhook, DNS/Hostinger, admin production access y QA visual PDF final.

## 4. Fases de cutover

### Fase 0 Pre-flight business/governance

Objetivo: alinear decision comercial, responsabilidades y ventana operativa antes de tocar produccion.

Tareas:

- Confirmar responsable de aprobacion final del cutover.
- Definir ventana de cutover y ventana de rollback.
- Confirmar dominio final a exponer.
- Confirmar politica de soporte durante las primeras 24-48 horas.
- Confirmar que no se anunciaran pagos live hasta pasar smoke productivo.
- Confirmar plan de comunicacion interna.

Criterio de salida:

- Decision go/no-go registrada.
- Ventana y responsables definidos.
- Nadie espera launch publico automatico por configurar infraestructura.

### Fase 1 Vercel Pro / proyecto production

Objetivo: dejar el entorno Vercel productivo listo sin depender de Preview.

Tareas:

- Confirmar plan Vercel requerido para dominios, protecciones, logs y limites.
- Elegir proyecto productivo definitivo.
- Confirmar si el proyecto productivo sera `shiftevidence` o `infrashift-r2-recovery`.
- Configurar variables en Production solamente cuando se apruebe el hito de preparacion.
- Revisar Node runtime, framework settings y build command.
- Confirmar que los pushes de docs no promuevan cambios no deseados.

Criterio de salida:

- Proyecto productivo definitivo elegido.
- Production env completo y auditado.
- Ultimo deployment productivo identificado.
- No hay confusion entre Preview, Production y dominios legacy.

### Fase 2 Neon production DB

Objetivo: preparar base de datos productiva aislada y migraciones controladas.

Tareas:

- Crear o confirmar branch/database productiva.
- Configurar connection pooling segun runtime.
- Preparar `DATABASE_URL` y `DIRECT_URL` productivas en Vercel Production.
- Ejecutar migraciones solamente en hito aprobado de DB production.
- Validar health check productivo sin datos reales sensibles.
- Confirmar backup/restore o punto de recuperacion.

Criterio de salida:

- DB productiva existe.
- Migraciones aplicadas de forma controlada.
- Prisma/runtime conecta correctamente.
- Rollback de DB entendido antes de launch.

### Fase 3 R2 production storage

Objetivo: validar almacenamiento productivo sin mezclarlo con preview.

Tareas:

- Confirmar bucket productivo `shift-evidence-prod-evidence`.
- Crear token productivo con scope minimo al bucket productivo.
- Configurar variables R2 productivas en Vercel Production.
- Ejecutar smoke productivo controlado con objeto sintetico.
- Confirmar write, head, read, content verification, delete y cleanup.
- Confirmar que bucket preview no se usa en `VERCEL_ENV=production`.

Criterio de salida:

- Bucket productivo validado con objeto sintetico.
- Token scopeado solo al bucket productivo.
- No hay secretos impresos ni documentados.
- No quedan objetos basura del smoke.

### Fase 4 Upstash production rate limit

Objetivo: activar rate limiting productivo sin reutilizar credenciales preview.

Tareas:

- Crear Redis productivo o confirmar recurso productivo dedicado.
- Configurar REST URL y token en Vercel Production.
- Ejecutar smoke productivo de rate limit en rutas seguras.
- Confirmar comportamiento normal bajo limites esperados.
- Confirmar logs y mensajes de error aceptables.

Criterio de salida:

- Upstash productivo dedicado activo.
- Rate limit funcional en produccion.
- No se bloquean rutas publicas criticas de forma accidental.

### Fase 5 Auth/admin production

Objetivo: validar autenticacion y permisos admin en produccion con identidad controlada.

Tareas:

- Configurar `BETTER_AUTH_URL` productiva.
- Configurar `BETTER_AUTH_SECRET` productivo.
- Configurar `ADMIN_EMAILS` con allowlist exacta.
- Validar login/logout con identidad controlada.
- Confirmar que usuarios demo no sean admin.
- Confirmar acceso a consola admin y acciones no destructivas.

Criterio de salida:

- Login productivo funciona.
- Admin production funciona solo para emails permitidos.
- No hay wildcard ni elevacion accidental.

### Fase 6 Stripe live readiness

Objetivo: preparar pagos live con doble aprobacion y sin habilitarlos antes de tiempo.

Tareas:

- Crear productos y Price IDs live en Stripe.
- Configurar secret key live en Vercel Production.
- Configurar webhook secret live en Vercel Production.
- Configurar Price IDs live por plan.
- Confirmar `STRIPE_CHECKOUT_ENABLED`.
- Confirmar `STRIPE_CHECKOUT_MODE`.
- Confirmar `STRIPE_LIVE_PAYMENTS_APPROVED`.
- Crear webhook endpoint live hacia dominio productivo.
- Ejecutar smoke live seguro solo cuando negocio apruebe.
- Confirmar que los errores live no otorguen entitlements.

Criterio de salida:

- Hosted Checkout live abre correctamente solo tras aprobacion.
- Webhook live recibe eventos esperados.
- No se otorgan entitlements sin pago confirmado.
- Runbook de reembolso/cancelacion/revocacion listo.

### Fase 7 Wise/manual invoice

Objetivo: mantener flujo manual de invoice como respaldo operativo.

Tareas:

- Confirmar copy comercial para transferencia manual.
- Confirmar proceso de conciliacion manual.
- Confirmar responsable de validacion de pago.
- Confirmar runbook de unlock manual.
- No automatizar Wise sin hito dedicado.

Criterio de salida:

- Flujo manual documentado y operable.
- No hay automatizacion financiera no validada.

### Fase 8 DNS/Hostinger

Objetivo: mover trafico hacia el target productivo final sin romper acceso ni email.

Tareas:

- Confirmar DNS actual y ownership.
- Confirmar registros que dependen de Hostinger.
- Confirmar si email usa Hostinger u otro proveedor.
- Preparar cambio de dominio en Vercel.
- Reducir TTL si corresponde.
- Ejecutar cambio DNS solo en ventana aprobada.
- Verificar HTTPS, redirects y canonical host.

Criterio de salida:

- Dominio productivo resuelve al target correcto.
- Email no se rompe.
- Hostinger legacy queda entendido como fallback o retirado.

### Fase 9 QA visual PDF final

Objetivo: validar manualmente el entregable principal antes de uso comercial real.

Tareas:

- Generar PDF sintetico completo.
- Revisar portada, tablas, cortes de pagina, secciones premium y disclaimers.
- Confirmar legibilidad en desktop y mobile.
- Confirmar que no haya datos reales en artefactos de QA.
- Registrar evidencia visual de aceptacion.

Criterio de salida:

- PDF aprobado visualmente.
- Riesgos de layout documentados o cerrados.

### Fase 10 Production cutover execution

Objetivo: ejecutar el cutover solamente cuando todos los criterios previos esten verdes.

Tareas:

- Congelar cambios no relacionados.
- Confirmar ultimo commit aprobado.
- Confirmar variables Production.
- Ejecutar deployment productivo controlado.
- Ejecutar smoke post-cutover.
- Monitorear logs.
- Registrar decision final.

Criterio de salida:

- Produccion responde correctamente.
- Smokes criticos pasan.
- Rollback sigue disponible hasta estabilizacion.

## 5. Env vars productivas

No documentar valores. Esta tabla enumera nombres y proposito esperado.

| Variable | Area | Requerida para cutover | Nota |
| --- | --- | --- | --- |
| `APP_BASE_URL` | App | Si | Debe apuntar al dominio productivo final. |
| `PREVIEW_TRUSTED_ORIGINS` | App | No para Production | Mantener para Preview; no usar wildcard. |
| `BETTER_AUTH_URL` | Auth | Si | Debe coincidir con el origen productivo. |
| `BETTER_AUTH_SECRET` | Auth | Si | Secret productivo unico. |
| `ADMIN_EMAILS` | Admin | Si | Allowlist exacta, sin wildcard. |
| `DATABASE_URL` | Neon | Si | Conexion runtime productiva. |
| `DIRECT_URL` | Neon | Si | Conexion directa para migraciones controladas. |
| `R2_ACCOUNT_ID` | R2 | Si | Cuenta Cloudflare. |
| `R2_ACCESS_KEY_ID` | R2 | Si | Access key productiva scopeada. |
| `R2_SECRET_ACCESS_KEY` | R2 | Si | Secret productivo, no imprimir. |
| `R2_BUCKET_PREVIEW` | R2 | No para Production | Referencia de preview. |
| `R2_BUCKET_PRODUCTION` | R2 | Si | Debe ser `shift-evidence-prod-evidence`. |
| `R2_PUBLIC_BASE_URL` | R2 | Segun uso | Solo si se publican assets via URL publica. |
| `UPSTASH_REDIS_REST_URL` | Rate limit | Si | Recurso productivo dedicado. |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limit | Si | Token productivo, no imprimir. |
| `STRIPE_CHECKOUT_ENABLED` | Billing | Si para pagos | Gate general de checkout. |
| `STRIPE_CHECKOUT_MODE` | Billing | Si para pagos | Debe ser coherente con claves y Price IDs. |
| `STRIPE_LIVE_PAYMENTS_APPROVED` | Billing | Si para live | Segundo gate explicito para pagos reales. |
| `STRIPE_SECRET_KEY` | Stripe | Si para pagos | Clave del entorno correspondiente. |
| `STRIPE_WEBHOOK_SECRET` | Stripe | Si para webhooks | Secret del endpoint productivo. |
| `STRIPE_PRICE_STARTER` | Stripe | Si para plan Starter | Price ID live cuando el modo sea live. |
| `STRIPE_PRICE_PROFESSIONAL` | Stripe | Si para plan Professional | Price ID live cuando el modo sea live. |
| `STRIPE_PRICE_MSP` | Stripe | Si para plan MSP | Price ID live cuando el modo sea live. |
| `WISE_API_TOKEN` | Wise | No para cutover inicial | No automatizar sin hito dedicado. |

## 6. Go / No-Go checklist

Go solamente si todo esto esta completo:

- Vercel Production env completo y revisado.
- Proyecto productivo definitivo confirmado.
- Neon production DB creada, migrada y validada.
- R2 production bucket validado con smoke sintetico.
- Upstash production rate limit validado.
- Auth production validado con usuario controlado.
- Admin production validado con allowlist exacta.
- Stripe live configurado y aprobado explicitamente si se aceptaran pagos reales.
- Webhook live validado si se otorgaran entitlements por pago.
- Flujo manual de invoice listo como respaldo.
- DNS/Hostinger/email planificado y aprobado.
- QA visual PDF final aprobado.
- Rollback documentado y disponible.
- Logs productivos observables durante la ventana.

No-Go si ocurre cualquiera de estos puntos:

- Falta una variable Production critica.
- Hay duda sobre cual proyecto Vercel sirve produccion.
- DB productiva no fue migrada de forma controlada.
- R2 productivo no fue smoked.
- Stripe live devuelve error de Price ID o webhook no validado.
- Admin no puede acceder o un usuario no admin obtiene privilegios.
- DNS puede romper email o dominio principal.
- PDF final tiene problemas visuales graves.
- Aparece un secreto en diff, logs o documentacion.

## 7. Smoke post-cutover

Ejecutar despues del deployment productivo y antes de declarar estabilidad:

- `GET /`
- `GET /pricing`
- `GET /demo`
- `GET /demo/replay`
- `GET /demo/workspace`
- `GET /sample-report`
- `GET /dashboard` con usuario autenticado.
- Login/logout con identidad controlada.
- Admin console con email allowlisted.
- Crear assessment sintetico.
- Upload/download con evidencia sintetica.
- Generar o abrir reporte PDF sintetico.
- Checkout Starter en modo esperado.
- Checkout Professional en modo esperado.
- Checkout MSP en modo esperado.
- Bank transfer Professional.
- Webhook Stripe live solamente si pagos live fueron aprobados.
- Rate limit smoke no destructivo.
- Logs sin errores criticos.

## 8. Rollback plan

Rollback tecnico:

- Revertir alias o dominio en Vercel al deployment estable anterior.
- Restaurar variables previas si el problema fue configuracion.
- Pausar checkout live desde env gates si aparece riesgo de pagos.
- Deshabilitar temporalmente rutas de checkout si hay inconsistencia de billing.
- Volver DNS al target anterior si el cambio de dominio rompe resolucion.
- Mantener Hostinger legacy como fallback hasta confirmar estabilidad.

Rollback de datos:

- No borrar datos productivos durante rollback.
- Si una migracion de DB falla, detener cutover y usar procedimiento de restore/branch previamente definido.
- Si R2 falla, detener uploads productivos y conservar objetos para diagnostico.
- Si webhooks fallan, pausar otorgamiento automatico y reconciliar manualmente.

Rollback operativo:

- Informar internamente estado parcial.
- No anunciar launch publico.
- Documentar causa, hora, impacto y decision.

## 9. Risk matrix

| Riesgo | Probabilidad | Impacto | Mitigacion |
| --- | --- | --- | --- |
| Production env incompleto en Vercel | Media | Alto | Checklist env y smoke antes de DNS. |
| Confusion entre proyectos Vercel | Media | Alto | Elegir proyecto definitivo antes de configurar dominios. |
| Stripe live con Price IDs invalidos | Media | Alto | Crear Price IDs live, doble gate y smoke seguro. |
| Webhook live no entrega eventos | Media | Alto | Validar endpoint live antes de entitlements automaticos. |
| DB production sin migraciones correctas | Media | Alto | Hito dedicado Neon production con rollback. |
| R2 production con credenciales incorrectas | Baja-media | Alto | Token scopeado y smoke sintetico antes del cutover. |
| DNS rompe email o dominio legacy | Media | Alto | Inventario DNS/Hostinger y ventana controlada. |
| Admin production inaccesible | Baja-media | Medio-alto | Validar `ADMIN_EMAILS` y login antes de launch. |
| PDF con defectos visuales | Media | Medio-alto | QA visual final con evidencia. |
| Secret filtrado en docs/logs | Baja | Alto | Secret scan antes de commit/push. |

## 10. Recommended next hito order

Orden recomendado:

1. `PDF-VISUAL-QA-1`
2. `PRODUCTION-ENV-PREP-1`
3. `NEON-PRODUCTION-DB-PREP-1`
4. `R2-PRODUCTION-STORAGE-SMOKE-1`
5. `UPSTASH-PRODUCTION-RATE-LIMIT-SMOKE-1`
6. `AUTH-ADMIN-PRODUCTION-SMOKE-1`
7. `STRIPE-LIVE-READINESS-1`
8. `DNS-HOSTINGER-CUTOVER-PREP-1`
9. `PRODUCTION-CUTOVER-EXECUTION-1`
10. `POST-CUTOVER-STABILITY-WATCH-1`

## 11. Recommendation

Recomendacion: avanzar primero con `PDF-VISUAL-QA-1` o `PRODUCTION-ENV-PREP-1`.

No se recomienda ejecutar cutover productivo todavia. El camino mas seguro es cerrar primero la validacion visual del entregable y despues preparar Production env en Vercel con un hito dedicado, sin DNS ni pagos live en la misma ventana.

Este hito no ejecuto produccion, no configuro secretos, no uso bucket productivo, no cambio DNS, no habilito pagos live, no ejecuto migraciones y no creo recursos productivos.

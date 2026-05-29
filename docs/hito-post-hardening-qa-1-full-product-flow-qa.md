# HITO POST-HARDENING-QA-1 - Full Product Flow QA After Hardening

## Objetivo

Ejecutar QA funcional integral post-hardening sobre localhost para detectar regresiones en flujos principales antes de decidir push, deploy o migracion.

Este hito fue de QA/auditoria funcional. No se hicieron fixes funcionales, no se hizo push, no se hizo deploy y no se aplico migracion en produccion.

## Estado Git

- Branch: `main`
- HEAD inicial: `c03bafa docs: audit post-hardening technical regression`
- Ahead/behind inicial: `main...origin/main [ahead 14]`
- Working tree inicial: limpio
- Stash: preservado, no aplicado
- Push realizado: NO
- Production deploy: NO
- Production migration applied: NO
- Production launched: NO

## Validaciones tecnicas

- `npm run test:run`: OK, 6 archivos / 25 tests.
- `npm run lint`: OK, 0 errores, 10 warnings preexistentes de `<img>`.
- `npm run typecheck`: OK.
- `npm run build`: OK.
- `npm run hostinger:diagnose`: OK.
- `npx prisma validate`: OK cargando `.env.local` solo dentro del proceso, sin imprimir valores.
- `npx prisma generate`: OK despues de detener temporalmente el servidor local que bloqueaba el engine Prisma en Windows/OneDrive.

Notas:

- `npm run build` conserva el warning NFT conocido de Turbopack. No bloqueante.
- `prisma generate` puede fallar con `EPERM` si `next start` mantiene abierto el engine Prisma. Se detuvo solo el proceso local de Next, se regenero Prisma y se volvio a levantar localhost.
- `npm run hostinger:diagnose` no imprime secretos y no conecta a DB.

## Validaciones publicas

Rutas principales:

- `/`: `200 OK`
- `/shiftreadiness`: `200 OK`
- `/sign-in`: `200 OK`
- `/sign-up`: `200 OK`
- `/demo`: `200 OK`
- `/sample-report`: `200 OK`
- `/vmware-to-proxmox-readiness`: `200 OK`
- `/contact`: `200 OK`
- `/forgot-password`: `200 OK`
- `/reset-password?token=invalid`: `200 OK`

Assets:

- Se valido un asset `/_next/static/...js`: `200 OK`, `Content-Type: application/javascript`.
- HTML de rutas publicas no mostro contenido sospechoso de pagina blanca, `Application error`, `Hydration failed`, `Internal Server Error` ni Hostinger 404.

PDF publico:

- `/sample-reports/proxmox-migration-readiness-sample-report.pdf`: `200 OK`
- `Content-Type`: `application/pdf`
- `Content-Length`: `108520`

Resultado: OK.

## Validaciones protegidas

Sin sesion:

- `/dashboard`: `307` a `/sign-in`
- `/dashboard/assessments`: `307` a `/sign-in`
- `/dashboard/admin`: `307` a `/sign-in`
- `/api/admin/audit?limit=500`: `307` a `/sign-in`
- `/api/admin/ai/usage?limit=500`: `307` a `/sign-in`
- `/api/admin/ai/status`: `307` a `/sign-in`
- `/api/assessments/test-assessment/reports/generate`: `303` a `/sign-in`
- `/api/assessments/test-assessment/files/test-file/download`: `307` a `/sign-in`
- `/api/assessments/test-assessment/reports/test-report/download`: `307` a `/sign-in`
- `/api/assessments/test-assessment/reports/test-report/delete`: `303` a `/sign-in`

Resultado: OK. Las rutas protegidas no quedan publicas sin sesion.

## Headers y CSP

Validado con `curl -I` sobre `/`, `/shiftreadiness` y `/sign-in`.

Headers presentes:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy-Report-Only: ...`

Confirmaciones:

- CSP Report-Only: presente.
- CSP bloqueante `Content-Security-Policy`: ausente.

Resultado: OK.

## Auth y password reset

Validaciones sin revelar usuarios:

- Password reset request con email ficticio `qa-nonexistent@example.invalid`: `200 OK`.
- Respuesta: `If an account exists, we'll send recovery instructions.`
- Password reset confirm con token invalido y JSON valido: `400 Bad Request`.
- Respuesta: `This reset link is invalid or has expired.`
- No se revelo si el email existe.
- No se revelo si el token existe.
- Rate limiting local fail-open no rompio el flujo.

Hallazgo:

- Password reset confirm con body JSON malformado devuelve `500 Internal Server Error` con mensaje generico `Unable to reset password.`
- No expone email, token ni stack trace al cliente.
- El evento queda logueado con logger estructurado y error sanitizado.
- Recomendacion: corregir en hito separado para devolver `400 Bad Request` ante JSON malformado.

Login/logout:

- No validado por falta de cuenta QA/sesion local disponible.
- No se crearon usuarios nuevos.
- No se enviaron emails reales.

## Dashboard y assessment

Sin sesion:

- Dashboard redirige correctamente a `/sign-in`.
- Lista de assessments redirige correctamente a `/sign-in`.

Con sesion QA:

- No validado. No habia cuenta QA/sesion local disponible y no se crearon usuarios durante este hito.

Flujos no validados por falta de sesion QA:

- Dashboard autenticado.
- Lista autenticada de assessments.
- Creacion de assessment.
- Detalle de assessment.
- Validacion real de input limits en formularios autenticados.
- Tabs internos de assessment.

## Evidence y upload

Sin sesion:

- Endpoints de evidence/download redirigen correctamente a `/sign-in`.

Con assessment QA:

- No validado por falta de sesion QA y datos QA disponibles.

Flujos no validados:

- Upload de evidencia.
- Error controlado para archivo invalido.
- Download autenticado.
- Delete/soft delete autenticado.
- Storage containment en flujo real de upload/download.

La cobertura tecnica de storage containment ya existe en tests unitarios y auditoria tecnica previa.

## Reports y PDF

Validado:

- PDF publico sample: `200 OK`, `application/pdf`.
- Endpoints protegidos de reportes redirigen sin sesion.

No validado:

- Generacion autenticada de reportes.
- Descarga autenticada de reportes.
- Delete autenticado de reportes.
- Smoke PDF generado desde assessment QA.

Motivo: no habia sesion QA, entitlement local ni assessment QA disponible.

## Admin

Sin sesion:

- `/dashboard/admin`: `307` a `/sign-in`.
- `/api/admin/audit?limit=500`: `307` a `/sign-in`.
- `/api/admin/ai/usage?limit=500`: `307` a `/sign-in`.
- `/api/admin/ai/status`: `307` a `/sign-in`.

Con usuario admin local:

- No validado por falta de sesion admin local disponible.

No validado:

- Admin dashboard autenticado.
- Audit pagination autenticada.
- AI usage pagination autenticada.
- Contrato `{ events/items, pagination }` consumido por UI admin.

La cobertura tecnica de paginacion fue revisada en el hito de auditoria tecnica post-hardening.

## AI

- No se llamo proveedor AI real.
- No se consumio budget.
- Tests de AI JSON handling siguen pasando.
- Report generation autenticada no se valido por falta de sesion/assessment QA.
- Fallback AI no se valido en flujo UI real.

Resultado: OK dentro del alcance seguro sin proveedor real.

## Rate limiting

- Upstash real no fue configurado.
- `.env.example` contiene:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
- En local, el sistema queda en modo fail-open cuando faltan env vars Upstash.
- Se observo warning estructurado seguro: `rate_limit_misconfigured` con `reason: missing_upstash_env`.
- No se imprimieron secrets.
- El fail-open local no rompio password reset ni rutas protegidas.

Resultado: OK como comportamiento esperado local. Rate limiting efectivo requiere configurar Upstash antes de depender de esa capa en produccion.

## DB y migracion

- No se aplico migracion en produccion.
- No se ejecuto `prisma migrate deploy`.
- `prisma validate`: OK.
- `prisma generate`: OK.
- Migracion de indices sigue pendiente para produccion.
- App compila con schema actual.

Warning observado:

- Al tocar password reset local, `pg-connection-string` emitio un warning sobre semantica futura de `sslmode=prefer/require/verify-ca`.
- No se imprimio el connection string.
- Recomendacion: revisar en hito separado que el connection string de Neon/produccion use SSL mode explicito y compatible antes de deploy.

## Hallazgos por severidad

### Criticos

- Ninguno.

### Altos

- Ninguno nuevo en QA funcional.

### Medios

- No se pudo validar flujo autenticado end-to-end por falta de cuenta QA/sesion local disponible. Esto limita la decision de deploy funcional completo.
- Rate limiting sigue fail-open si Upstash no esta configurado. Esperado, pero debe resolverse antes de depender de esa proteccion en produccion.

### Bajos

- `password-reset/confirm` devuelve `500` para body JSON malformado. Deberia responder `400 Bad Request` con mensaje seguro.
- `prisma generate` puede fallar localmente con `EPERM` si `next start` bloquea Prisma Client en Windows/OneDrive.
- Warning de SSL mode futuro en `pg-connection-string`.
- Lint conserva warnings preexistentes de `<img>`.
- Build conserva warning NFT conocido de Turbopack.

### Informativos

- Browser/visual automation no quedo disponible de forma confiable en este entorno; se hizo smoke funcional por `curl`, HTML y headers.
- No se hicieron cambios funcionales.
- No se creo usuario QA.
- No se enviaron emails reales.
- No se llamo AI real.

## Flujos no validados y motivo

- Login/logout QA: falta de cuenta QA/sesion local disponible.
- Dashboard autenticado: falta de cuenta QA/sesion local disponible.
- Creacion/edicion de assessment: falta de cuenta QA/sesion local disponible.
- Upload/download/delete de evidence autenticado: falta de cuenta QA, assessment QA y archivo QA preparado.
- Generacion/descarga/delete de reportes autenticados: falta de cuenta QA, entitlement y assessment QA.
- Admin dashboard autenticado: falta de usuario admin local/sesion admin.
- AI fallback en flujo real de reporte: no se llamo AI real ni se genero reporte autenticado.
- QA visual manual en navegador: automatizacion visual no disponible de forma confiable en este entorno.

## Recomendacion sobre push

Veredicto: apto para push con condiciones.

Condiciones:

- Confirmar si el push dispara deploy automatico.
- Si dispara deploy, no hacer push hasta tener plan de migracion DB, Upstash y smoke de produccion.
- Aceptar que la QA autenticada quedo limitada por falta de cuenta QA local.

## Recomendacion sobre deploy

Veredicto: no recomendado todavia como accion automatica.

Condiciones antes de deploy:

- Crear o confirmar una cuenta QA local/admin para validar flujos autenticados.
- Validar assessment, evidence y report generation end-to-end.
- Configurar Upstash si se espera rate limiting efectivo.
- Planificar migracion de indices en produccion.
- Resolver o aceptar temporalmente el hallazgo bajo de malformed JSON en reset confirm.
- Revisar warning SSL mode de connection string.

## Recomendacion sobre migracion produccion

Veredicto: tecnicamente apta segun auditoria previa, pero no ejecutada.

Condiciones:

- Ejecutar solo en hito/deploy controlado.
- Usar `prisma migrate deploy`.
- No usar `prisma migrate dev` en produccion.
- Smoke posterior de admin, assessments, evidence y reports.

## Confirmaciones finales

- Push realizado: NO.
- Production deploy: NO.
- Production migration applied: NO.
- Production launched: NO.

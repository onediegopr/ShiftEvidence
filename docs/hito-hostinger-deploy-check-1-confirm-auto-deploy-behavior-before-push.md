# HITO HOSTINGER-DEPLOY-CHECK-1 - Confirm Auto-Deploy Behavior Before Push

## Objetivo

Determinar, usando solo evidencia local/documental/configuracion accesible, si un push a `main` debe considerarse capaz de disparar deploy en Hostinger.

Este hito no ejecuta push, deploy, migracion, cambios Hostinger ni cambios funcionales.

## Estado Git

- Branch: `main`
- HEAD inicial: `84952d8 docs: prepare controlled hardening release`
- Ahead/behind inicial: `main...origin/main [ahead 17]`
- Working tree inicial: limpio
- Stash: preservado, no aplicado
- Push realizado: NO
- Deploy realizado: NO
- Production migration applied: NO
- Production launched: NO

## Evidencia revisada

### Configuracion local

- `package.json` contiene scripts manuales:
  - `build`
  - `start`
  - `prisma:deploy`
  - `deploy:check`
  - `hostinger:diagnose`
- No hay `.github/workflows` en el repo local.
- No se encontro archivo local de CI/CD que pruebe por si solo el trigger actual de Hostinger.
- No se encontro config local concluyente tipo `main -> deploy` en un archivo de infraestructura versionado.

### Runbooks Hostinger

`docs/hostinger-deployment-runbook-v1.md` describe comandos recomendados:

- `npm ci`
- `npx prisma generate`
- `npm run build`
- `npx prisma migrate deploy`
- `npm run start`

Interpretacion:

- El runbook documenta deploy manual/controlado.
- No prueba que auto-deploy este apagado.
- Tampoco prueba que auto-deploy este activo actualmente.

### Hito AUTH-1-PROD

Archivo revisado:

- `docs/hito-auth-1-prod-password-recovery-migration-provider-smoke.md`

Evidencia relevante:

- `main` fue pusheado de `5b559b9` a `51dc931`.
- El documento registra: `Hostinger git deployment completed successfully at 2026-05-27T14:49:20Z`.
- Tambien registra smoke productivo despues del deploy.

Interpretacion:

- Esta es evidencia historica fuerte de que el repositorio estuvo conectado a un mecanismo de deploy Git en Hostinger.
- No confirma que la configuracion siga identica hoy, pero establece que un push a `main` no debe asumirse como inocuo.

### Hito 9.2S.1

Archivo revisado:

- `docs/hito-9-2s-1-production-safe-redirects.md`

Evidencia relevante:

- El documento dice: `Re-smoke productivo reducido ejecutado despues de push/autodeploy.`

Interpretacion:

- Esta es evidencia historica adicional de que al menos un flujo previo trato el push como conectado a autodeploy.

### Hito CACHE-1 / HCDN

Archivo revisado:

- `docs/hito-cache-1-hcdn-landing-purge-verification.md`

Evidencia relevante:

- La URL con query string mostraba el HTML nuevo ya desplegado.
- La URL limpia seguia sirviendo HTML viejo por HCDN.

Interpretacion:

- Esto confirma que en hitos recientes hubo codigo nuevo llegando a produccion y luego quedando condicionado por cache HCDN.
- No prueba el mecanismo exacto de deploy, pero refuerza que cambios pusheados pueden terminar reflejados en produccion.

### Release prep reciente

Archivo revisado:

- `docs/hito-release-prep-1-controlled-push-deployment-decision-plan.md`

Evidencia relevante:

- El hito dejo el estado como no confirmado y recomendo no hacer push hasta verificar Hostinger.

Interpretacion:

- Con la revision adicional de AUTH-1-PROD y 9.2S.1, la postura debe endurecerse: push a `main` debe tratarse como potencial deploy.

## Conclusion sobre auto-deploy

- Push a `main` dispara deploy: no probado en vivo desde hPanel en este hito.
- Push a `main` debe tratarse como deploy-triggering: SI.
- Nivel de confianza: medio-alto.

Motivo:

- Hay evidencia historica explicita de `Hostinger git deployment completed successfully` despues de push a `main`.
- Hay evidencia historica explicita de `push/autodeploy`.
- No hay acceso hPanel/Hostinger en este hito para confirmar si la integracion sigue activa o fue modificada.

## Recomendacion

Recomendacion principal:

- NO hacer push como "push only".
- Tratar cualquier `git push origin main` como posible deploy productivo.

Antes de push:

1. Confirmar manualmente en hPanel si el sitio/app esta conectado a repositorio Git y branch `main`.
2. Confirmar si Hostinger tiene auto-deploy habilitado.
3. Confirmar build command, install command, application root, startup command y logs.
4. Confirmar si el deploy ejecuta o no migraciones.
5. Preparar plan de smoke productivo.
6. Preparar plan de rollback.

Si hPanel confirma auto-deploy activo:

- Ejecutar un hito de release controlado, no un push aislado.
- Configurar Upstash o aceptar explicitamente rate limiting fail-open temporal.
- Aplicar migracion de indices con `prisma migrate deploy` en ventana controlada.
- Ejecutar smoke publico, privado, auth, admin, evidence/report/PDF.

Si hPanel confirma auto-deploy inactivo:

- Push-only podria ser viable.
- Aun asi confirmar con el usuario antes de pushear porque el batch contiene 17 commits locales.

## Donde mirar en hPanel

Validar manualmente:

- Websites -> Manage -> Git o Deployments.
- Websites -> Manage -> Node.js.
- Application Root.
- Startup file / startup command.
- Build/install command si existe.
- Branch conectado.
- Auto-deploy / deploy on push / webhook status.
- Ultimo deployment y timestamp.
- Logs de build/runtime.
- Variables de entorno sin imprimir valores.

## Riesgos pendientes

- Upstash no configurado: rate limiting queda fail-open si el batch se despliega.
- Migracion produccion pendiente: `20260529120000_add_high_value_query_indexes`.
- `xlsx` / npm audit: vulnerabilidad alta sin fix disponible.
- QA autenticada: faltan pruebas completas con usuario/admin QA despues del batch.
- CSP: sigue en report-only.
- HCDN/cache: puede servir HTML viejo o assets desfasados despues del deploy.
- Rollback: debe estar preparado antes de tocar produccion.

## Proximo paso recomendado

Camino recomendado:

1. Usuario confirma en hPanel si auto-deploy de `main` esta activo.
2. Si esta activo, abrir `RELEASE-CONTROLLED-1` para push + deploy + migrate + smoke.
3. Si no esta activo, abrir `PUSH-ONLY-1` para subir commits sin deploy y validar remoto Git.
4. En paralelo o antes de release amplio, abrir `DEPENDENCY-RISK-1` para decidir mitigacion de `xlsx`.

## Confirmaciones finales

- Push realizado: NO.
- Deploy realizado: NO.
- Production migration applied: NO.
- Production launched: NO.

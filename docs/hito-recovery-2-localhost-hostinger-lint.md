# HITO RECOVERY-2 - Localhost, Hostinger y lint gate antes de DEMO-1

Fecha: 2026-05-28  
Estado: recovery operativo completado  
Full public launch: NO  
OpenAI: NO activo  
Demo: `/demo` no implementado

## 1. Objetivo

Recuperar el estado operativo antes de DEMO-1:

- Confirmar y recuperar localhost.
- Confirmar produccion Hostinger.
- Corregir el lint gate `react-hooks/set-state-in-effect` en sign-up.
- Validar rutas locales y productivas.
- Mantener el stash BETA-INVITE-1 preservado y sin aplicar.
- No implementar `/demo`.

## 2. Estado Git inicial

- Branch: `main`.
- HEAD inicial: `3c4cbf15203cbad0a49c5e9a036c25cf9113e11e`.
- origin/main inicial: `3c4cbf15203cbad0a49c5e9a036c25cf9113e11e`.
- Working tree inicial: limpio.
- Divergencia: no detectada.
- Stash preservado: `stash@{0}: On main: park beta invite docs before functional readiness`.
- Stash aplicado: NO.

## 3. Diagnostico localhost

Estado inicial observado:

- Puerto `3000`: escuchando.
- PID inicial: `28012`.
- `/`: 200.
- `/shiftreadiness`: 200.
- `/sign-in`: 200.
- `/dashboard`: 307 a `/sign-in`.
- `/dashboard/admin`: 307 a `/sign-in`.

Problema encontrado durante validaciones:

- `npm run build` fallo inicialmente por lock EPERM en `.next`.
- `npx prisma generate` fallo inicialmente por lock EPERM sobre `node_modules/.prisma/client/query_engine-windows.dll.node`.

Causa:

- Servidor local `next start -p 3000` mantenia locks sobre artefactos generados.
- No fue un error de codigo ni de rutas.

Recovery aplicado:

- Se identifico el proceso Node/Next del workspace en `:3000`.
- Se detuvo solo ese proceso.
- Se borro unicamente `.next` dentro del workspace verificado.
- Se reejecutaron build y Prisma.
- Se reinicio localhost con `npm run start -- -p 3000`.

Estado final:

- Puerto `3000`: escuchando.
- PID final: `15740`.
- Comando recomendado: `npm run build && npm run start -- -p 3000`.

## 4. Diagnostico produccion Hostinger

Estado inicial observado:

- `https://shiftevidence.com/`: 200.
- `https://shiftevidence.com/shiftreadiness`: 200.
- `https://shiftevidence.com/sign-in`: 200.
- `https://shiftevidence.com/sign-up`: 200.
- `https://shiftevidence.com/dashboard`: 307 a `/sign-in`.
- `https://shiftevidence.com/dashboard/admin`: 307 a `/sign-in`.

Resultado:

- Produccion Hostinger respondia correctamente.
- No se detecto Hostinger 404.
- No se detecto 500/503/504.
- No se detecto timeout/DNS/SSL.
- No se ejecuto redeploy.
- No se ejecuto restart Hostinger.
- No se modificaron variables de entorno.

## 5. Lint sign-up

Error inicial:

- Regla: `react-hooks/set-state-in-effect`.
- Archivos:
  - `src/app/sign-up/page.tsx`.
  - `src/views/SignUpPage.tsx`.

Causa:

- Ambos componentes inicializaban `email` como string vacio y luego sincronizaban `?email=` con `setEmail()` dentro de `useEffect`.
- React Hooks lint lo marca como render cascaded innecesario.

Fix aplicado:

- Se agrego helper local `readEmailParam()`.
- El primer render mantiene `email` vacio para evitar mismatch de hidratacion.
- La carga de `?email=` se agenda con `requestAnimationFrame`, evitando `setState` sincronico dentro del efecto.
- No se cambio el flujo de signup, auth, onboarding, pricing, entitlements ni estilos.

Resultado:

- `npm run lint`: OK.

## 6. Validaciones

Validaciones ejecutadas:

- `npm run hostinger:diagnose`: OK.
- `npm run ai:guardrails`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK.
- `npx prisma validate`: OK, cargando `.env.local` solo al proceso y sin imprimir valores.
- `npx prisma generate`: OK, despues de liberar el lock del servidor local.

Warnings:

- Build mantiene warning NFT/Turbopack conocido relacionado con `src/server/reports/reportStorageService.ts` y ruta de descarga de reportes.
- No bloqueante para este recovery.

## 7. Rutas locales finales

- `http://localhost:3000/`: 200.
- `http://localhost:3000/shiftreadiness`: 200.
- `http://localhost:3000/sign-in`: 200.
- `http://localhost:3000/sign-up`: 200.
- `http://localhost:3000/dashboard`: 307 a `/sign-in`.
- `http://localhost:3000/dashboard/admin`: 307 a `/sign-in`.

## 8. Rutas produccion finales

Validacion inicial de produccion fue correcta y no requirio recovery Hostinger:

- `/`: 200.
- `/shiftreadiness`: 200.
- `/sign-in`: 200.
- `/sign-up`: 200.
- `/dashboard`: 307 a `/sign-in`.
- `/dashboard/admin`: 307 a `/sign-in`.

Debe repetirse despues del push del hotfix para confirmar deploy automatico si Hostinger despliega desde `main`.

## 9. Seguridad

Confirmaciones:

- No se imprimio `DATABASE_URL`.
- No se imprimio `GEMINI_API_KEY`.
- No se imprimio `OPENAI_API_KEY`.
- No se imprimio `BETTER_AUTH_SECRET`.
- No se commiteo `.env`.
- No se commiteo `.env.local`.
- No se tocaron datos reales.
- No se toco Hostinger config.
- No se activo OpenAI.
- No se implemento `/demo`.
- No se aplico stash BETA-INVITE-1.
- No hubo hard-delete.

## 10. Cambios realizados

Codigo:

- `src/app/sign-up/page.tsx`: lectura segura de email desde query string sin `setState` sincronico en el efecto.
- `src/views/SignUpPage.tsx`: misma correccion para mantener consistencia y cerrar lint.

Documentacion:

- `docs/hito-recovery-2-localhost-hostinger-lint.md`.

## 11. Riesgos pendientes

- Hostinger puede tardar en reflejar el nuevo commit si el deploy automatico no es inmediato.
- Warning NFT/Turbopack conocido sigue pendiente de hardening tecnico futuro.
- DEMO-1 todavia no debe iniciarse hasta confirmar que origin/main contiene este recovery y produccion responde despues del push.

## 12. Decision final

- Localhost recovered: SI.
- Hostinger production recovered: SI, no requirio accion porque respondia correctamente.
- Lint gate clean: SI.
- Ready for DEMO-1: SI, despues de push y smoke final de produccion.
- Ready for full public launch: NO.

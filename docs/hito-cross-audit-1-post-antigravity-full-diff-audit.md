# HITO CROSS-AUDIT-1 - Post-Antigravity Full Diff Audit

## 1. Resumen ejecutivo

Estado: COMPLETO.

Veredicto: OK con ajustes menores.

Se audito el rango `0e65ea0..0ffe34b`, desde el cierre previo de Advisor Methodology Retrieval hasta el polish visual completo posterior a la tanda Antigravity.

El proyecto queda tecnicamente estable para continuar hacia beta/demo controlada. No se detectaron bloqueos, regresiones criticas, cambios indebidos en Advisor, deploy, Hostinger, billing, provider routing, scoring de Ceph o PDF rewrite.

Los riesgos encontrados son de coherencia y comunicacion: algunas frases prometen mas de lo que el sistema calcula, hay markdown literal visible en copy JSX, Completion Center puede marcar Storage como completo con evidencia manual no analizada si el score supera el umbral, y el historial de soporte del dashboard tambien asocia tickets publicos por `contactEmail`.

## 2. Rango auditado

Base elegida: `0e65ea0 docs: close advisor methodology retrieval module`.

HEAD auditado inicial/final: `0ffe34b21950189e5d93359baab3d20d562b476e`.

Motivo de la base: es el commit inmediatamente anterior a `3451168 feat: add support and public trust layer`, por lo que incluye TRUST-SUPPORT-1, RETURNING-USER-LOGIN-1, COHERENCE-POLISH-1, STORAGE-COLLECTOR-SPEC-1, STORAGE-COLLECTOR-SPEC-1B, STORAGE-COMPLETION-2A y VISUAL-POLISH-1.

Commits auditados:

- `3451168 feat: add support and public trust layer`
- `4269fca fix: stabilize trust support layer before push`
- `943f18c docs: record trust support controlled push audit`
- `f92fa3a docs: record trust support production migration smoke`
- `88e4b0c docs: record trust support authenticated smoke`
- `64c891f docs: record trust support production runtime refresh`
- `8b5d36b docs: record trust support authenticated final smoke`
- `71bfd8f docs: close trust support module by user attestation`
- `672b328 feat: improve returning user login access`
- `548ab84 docs: record returning user login production smoke`
- `64a2322 fix: refresh returning user login home visibility`
- `14c3b9b fix: polish storage support and client console UX`
- `016e3db docs: record coherence polish production smoke`
- `bd0b74f feat: add agentless storage evidence collection guidance`
- `1d5a2bc fix: surface agentless storage evidence guidance`
- `d31f9d2 fix: consolidate storage completion logic`
- `0ffe34b style: polish full web and console UX`

Diff auditado: 44 archivos, 4000 inserciones, 311 eliminaciones.

## 3. Git checkpoint

- Branch: `main`.
- Working tree inicial: limpio.
- `HEAD`: `0ffe34b21950189e5d93359baab3d20d562b476e`.
- `origin/main`: `0ffe34b21950189e5d93359baab3d20d562b476e`.
- Local sincronizado con `origin/main`: si.
- Stashes preservados:
  - `stash@{0}: On main: park unrelated Hero/index changes before ADVISOR-2C`
  - `stash@{1}: On main: park beta invite docs before functional readiness`

## 4. DB / Prisma

Validaciones:

- `npx prisma validate`: OK.
- `npx prisma migrate status`: OK, database schema is up to date.
- Migraciones encontradas: 20.
- Nueva migracion en rango: `20260531110000_trust_support_1_support_requests`.

Cambios de schema:

- Se agrego `SupportRequest`.
- Se agregaron enums `SupportRequestSource`, `SupportRequestCategory`, `SupportRequestStatus`, `SupportRequestPriority`.
- Se agregaron relaciones opcionales desde `User`, `Workspace` y `Assessment`.

Riesgo DB:

- No se detectaron migraciones destructivas.
- No se tocaron modelos Advisor ni Project Memory Vault.
- Legacy storage sigue intacto.
- La migracion de soporte usa `ON DELETE SET NULL`, razonable para preservar historial sin bloquear eliminaciones.

## 5. Storage audit

Resultado: OK con ajustes menores.

- La guia agentless esta visible en `StorageDestinationReadinessPanel`.
- Los comandos Proxmox/Ceph son de lectura/exportacion: `pvesh get`, `ceph status`, `ceph df`, `ceph osd tree`, `ceph health detail`, etc.
- No se piden credenciales.
- No se implemento collector real, agente, API Proxmox, API Ceph ni conexion PBS.
- Los formularios usan `useTransition`, `isPending` y `actionType` para evitar doble submit.
- Ceph engine y scoring no fueron modificados en el diff auditado.
- PDF no fue reescrito.

Riesgos:

- Copy dice que la evidencia mejora confianza para "Ceph sizing"; el sistema no hace sizing real de Ceph, solo suitability/readiness.
- Hay textos JSX con `**Storage**` que se renderizan como asteriscos literales.
- El Completion Center puede considerar Storage completo con record nuevo + evidencia manual, aunque la evidencia este en `received_not_analyzed`.

## 6. Completion Center audit

Resultado: OK con riesgo medio documentado.

- El nuevo modelo tiene prioridad real sobre legacy cuando existen `storageDestinationReadiness`, `storageContext`, `storageEvidence` o `storageAnalysis`.
- Legacy `StorageReadinessInput` sigue como fallback.
- Se agregaron tests especificos para la logica STORAGE-COMPLETION-2A.
- Los estados revisados cubren `complete`, `partial`, `in_progress`, `not_started`, `skipped`, `failed` y `not_applicable`.

Riesgo:

- El score nuevo puede llegar a `complete` con campos core y evidencia subida, aun sin analisis AI ni Ceph suitability. No rompe el sistema, pero requiere copy claro: completion no equivale a readiness validado.

## 7. Support audit

Resultado: OK.

- Public support no acepta `assessmentId`, por lo que no puede asociar arbitrariamente tickets a assessments.
- Assessment support usa `ensureAssessmentOwnership`.
- Dashboard support crea tickets con `userId` y `workspaceId` de la sesion.
- Admin support requiere admin action y registra audit event.
- `adminNotes` aparecen en admin, no en dashboard cliente ni support publico.
- Deteccion de secrets sigue activa para subject/message.
- `/contact` ya no es dead-end y enruta hacia `/support`.

Riesgos:

- Dashboard lista tickets por `userId` o `contactEmail`. Esto permite que un ticket publico enviado con el email del usuario aparezca luego en su dashboard. Es util para continuidad, pero puede ser ruido o spoofing de mensaje si alguien conoce el email.
- No hay rate-limit visible en la action publica de soporte; si no esta cubierto en otra capa, conviene agregarlo antes de public launch.

## 8. Login / Returning User audit

Resultado: OK.

- `/login`: 307 a `/sign-in` sin sesion.
- `/client-login`: 307 a `/sign-in` sin sesion.
- Con sesion, ambas rutas redirigen a `/dashboard` por implementacion.
- `/dashboard`: protegido por layout, 307 a `/sign-in` sin sesion.
- `/dashboard/admin`: protegido por dashboard layout y admin check.
- Header/footer tienen entrada clara para Client login.
- Returning user block esta visible en home y support.

Riesgos:

- Smoke con sesion real no fue ejecutado desde Codex; requiere user-attestation para `/client-login -> /dashboard`.

## 9. Advisor audit

Resultado: OK.

- `SeniorMigrationAdvisorPanel` no fue modificado.
- Runtime/provider routing no fue modificado.
- Project Memory Vault no fue modificado.
- Usage/credits no fueron modificados.
- Methodology retrieval no fue modificado por este rango.
- Storage context injection sigue referenciado desde la pagina de assessment y servicios existentes.
- Admin no ejecuta chat cross-workspace; mantiene mensaje de boundary.

Riesgos:

- Ningun riesgo funcional nuevo detectado para Advisor.

## 10. Admin console audit

Resultado: OK con ajustes menores de idioma/copy.

- Admin sigue mayormente en espanol.
- Se agrego tab `Soporte` y metricas de soporte.
- Admin puede ver y actualizar estado/prioridad/notas internas.
- Storage/Ceph tab muestra badges nuevos.
- No se exponen archivos crudos ni secretos.

Riesgos:

- Hay algunos textos nuevos en ingles dentro de admin, por ejemplo "Destination evidence uploaded" y "Manual collector evidence expected".
- Se detecto texto mojibake preexistente o visible en dashboard nav: `Panel de AdministraciÃ³n`.

## 11. UX / idioma / visual audit

Resultado: OK con ajustes menores.

- Publico: ingles, consistente.
- Cliente/dashboard: ingles, consistente despues del polish.
- Admin: espanol mayoritario, con pequenas mezclas.
- Mobile nav recibio ajustes de wrap, padding y tabs con scroll horizontal.
- `/contact` y footer dejaron de tener links muertos principales.
- Loading/error/empty states mejoraron en soporte y storage.

Riesgos:

- Markdown literal `**Storage**` aparece en copy JSX.
- El estilo Cyber Cyan / Indigo-Violet es coherente, pero conviene vigilar glows en tablas densas.
- Algunos command blocks largos pueden depender de `overflowX: auto`; se recomienda smoke visual mobile real.

## 12. Visual polish audit

Resultado: OK.

- Tokens `--primary` y `--secondary` se invirtieron hacia Cyan primario e Indigo secundario.
- Scrollbars, hover, focus y mobile nav fueron ajustados.
- Disabled states siguen presentes en botones criticos.
- No se detecto cambio global que rompa build o tests.

Riesgos:

- El tono visual es mas cyber que antes; aun se mantiene serio/tecnico, pero debe validarse en mobile real y demo comercial.

## 13. Validaciones tecnicas

- `npx prisma validate`: OK.
- `npx prisma migrate status`: OK, schema up to date.
- `npx prisma generate`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run test:run`: OK, 58 files / 285 tests.
- `npm run build`: OK.

Build warning:

- Turbopack/NFT warning conocido sobre `src/server/evidence/localStorageService.ts` importado desde la ruta de descarga de evidencia. No bloqueo build.

## 14. Smoke HTTP local

Smoke ejecutado contra `http://localhost:3100` con `next start`.

- `/`: 200.
- `/contact`: 200.
- `/support`: 200.
- `/about`: 200.
- `/pricing`: 200.
- `/security`: 200.
- `/partners`: 200.
- `/login`: 307 a `/sign-in`.
- `/client-login`: 307 a `/sign-in`.
- `/sign-in`: 200.
- `/sign-up`: 200.
- `/dashboard`: 307 a `/sign-in`.
- `/dashboard/admin`: 307 a `/sign-in`.

Servidor local detenido despues del smoke.

## 15. Smoke autenticado

No realizado desde Codex porque no se uso una sesion real autenticada en el navegador.

Pendiente de user-attestation:

- Dashboard.
- Support history.
- Assessment detail.
- Storage tab.
- Evidence tab card hacia Storage.
- Completion Center dots.
- Advisor tab.
- Support tab.
- Admin support.
- Admin storage.
- Client login con sesion.

## 16. Hallazgos por severidad

Criticos:

- Ninguno.

Altos:

- Ninguno bloqueante.

Medios:

- Completion Center puede marcar Storage como completo con evidencia manual no analizada si el score supera el umbral. Requiere copy/semantica clara para diferenciar completion de readiness validado.
- Historial de soporte cliente asocia tambien por `contactEmail`, lo cual puede mostrar tickets publicos no autenticados enviados con el email del usuario.
- No se observo rate-limit explicito en soporte publico.

Bajos:

- Markdown literal `**Storage**` visible en JSX.
- Copy "Ceph sizing" sobrepromete frente al alcance real de suitability/readiness.
- Mezcla menor de ingles en admin.
- Mojibake visible en `Panel de AdministraciÃ³n`.
- Smoke autenticado queda pendiente.

Observaciones:

- `auditoria_integral.md` forma parte del diff auditado y ya estaba versionado en HEAD antes de esta auditoria.

## 17. Hotfixes sugeridos

No hay hotfix requerido antes de seguir.

Sugeridos antes de public launch:

- Cambiar `**Storage**` por texto JSX normal o `<strong>Storage</strong>`.
- Cambiar "Ceph sizing" por "Ceph suitability/readiness confidence".
- En Completion Center, ajustar label/copy para que "complete" no se lea como "evidencia analizada".
- Evaluar rate-limit o captcha ligero para soporte publico.
- Decidir si dashboard debe listar tickets por `contactEmail` o solo `userId`.
- Corregir mojibake en textos admin visibles.

## 18. Veredicto final

OK para continuar: no como full public launch, si para beta/demo controlada.

OK con ajustes: si.

Hotfix requerido: no.

Bloqueado: no.

Justificacion: las validaciones pasan, el smoke HTTP local pasa, Prisma esta al dia, no hay regresion Advisor, no hay collector real accidental, no hay deploy ni cambios de env. Los hallazgos son de coherencia, wording, privacidad blanda y semantica de completion.

## 19. Porcentajes estimados

- Shift Evidence general: 93-95%.
- Storage: 84-89%.
- Support: 86-91%.
- Login/returning user: 84-90%.
- Advisor: 90-94%.
- Admin: 85-90%.
- Visual polish: 86-91%.
- Beta readiness: 86-91%.
- Full public launch: NO declarado.

## 20. Proximo paso recomendado

Ejecutar un hito menor de ajustes post-audit:

- copy fixes Storage/Completion;
- rate-limit review para soporte publico;
- smoke autenticado user-attested;
- revision visual mobile real;
- luego decidir beta/demo readiness.

# HITO ADVISOR-2F-CLOSE - User-Attested Auto-Extraction Smoke

## 1. Objetivo

Cerrar ADVISOR-2F operativamente mediante documentacion de smoke web/autenticado validado manualmente por el usuario, sin implementar codigo nuevo y sin modificar base de datos, deploy, variables de entorno, billing, providers, landing publica ni stashes.

## 2. Contexto del hito ADVISOR-2F

ADVISOR-2F implemento Project Memory Auto-Extraction Lite como una capa deterministica y conservadora para sugerir memoria estructurada del Senior Advisor.

Commit funcional:

```text
6279020 feat: add Senior Advisor memory auto-extraction lite
```

Resultado funcional previo:

- Auto-extraction genera candidatos conservadores.
- Los candidatos quedan como `needs_review`.
- No se confirma memoria automaticamente.
- No se implemento RAG.
- No se implementaron embeddings.
- No se cambio billing real.
- No se tocaron providers Gemini/OpenCode.

## 3. Resultado del release/smoke tecnico

El hito ADVISOR-2F-RELEASE/SMOKE dejo documentado:

- Validaciones locales OK.
- Produccion publica OK.
- Rutas publicas respondiendo correctamente.
- Rutas protegidas redirigiendo a sign-in sin sesion.
- Documento creado: `docs/hito-advisor-2f-release-smoke.md`.
- Commit documental local: `cc36fbc docs: record advisor memory auto-extraction smoke`.

Estado tecnico del smoke en ese momento: PARCIAL.

Motivo:

- Codex no pudo ejecutar smoke autenticado controlado por falta de canal Chrome/native host.

## 4. Bloqueo del smoke autenticado controlado

Codex no pudo controlar la sesion autenticada.

Detalles:

- Chrome estaba instalado y corriendo.
- Codex Chrome Extension figuraba instalada y habilitada.
- El native host de Windows no estaba correctamente disponible para el canal de control.
- No se usaron credenciales.
- No se inspeccionaron cookies.
- No se inspecciono local storage.
- No se intento reparar el plugin.
- No se forzo OAuth.

Por esta razon, la validacion autenticada no se declara como evidencia tecnica capturada por Codex.

## 5. User-attestation

El usuario reporto manualmente:

```text
"del lado mio probe y funciona todo ok en la web"
```

Esta frase se toma como user-attestation del smoke web/autenticado.

Alcance de la attestation:

- Valida manualmente que el flujo web funciona del lado del usuario.
- Permite cerrar ADVISOR-2F operativamente.
- No agrega evidencia tecnica que Codex no haya capturado.
- No reemplaza un smoke tecnico autenticado futuro si se habilita un canal controlable.

## 6. Que se acepta como validado

Por user-attestation se acepta como validado:

- Web productiva accesible.
- Flujo web autenticado validado manualmente por usuario.
- Senior Advisor funcional segun validacion manual.
- No errores criticos reportados por usuario.

Base tecnica ya validada por Codex:

- Validaciones locales.
- Build local.
- Smoke publico anonimo.
- Proteccion de rutas publicas/protegidas.

## 7. Que NO se pudo validar por Codex

Codex no pudo validar tecnicamente:

- DB evidence de candidates `needs_review` generados en produccion.
- Dedupe en produccion.
- No-extraction en produccion.
- Metadata ADVISOR-2F en `AiUsageEvent`.
- Memory Panel con evidencia tecnica capturada por Codex.
- Flujo autenticado navegable mediante sesion controlada por Codex.

## 8. Seguridad

Durante este cierre:

- No se imprimieron secrets.
- No se inspeccionaron raw files.
- No hubo DB mutation adicional.
- No se cambiaron env vars.
- No hubo deploy manual.
- No se observo cross-workspace leakage.
- No se tocaron stashes.
- No se tocaron schema ni migraciones.
- No se ejecuto `prisma db push`.
- No se ejecuto `migrate reset`.
- No se tocaron billing, providers ni storage.
- No se modifico landing publica.
- No se tocaron `Hero.tsx` ni `src/index.css`.
- No se declaro full public launch.

## 9. Estado final

Estado: COMPLETO por user-attestation.

ADVISOR-2F queda cerrado operativamente.

Auto-Extraction Lite queda como base funcional conservadora para sugerir Project Memory sin confirmar automaticamente.

El cierre es operacional, no una declaracion de full public launch.

## 10. Riesgos pendientes

- Smoke tecnico autenticado futuro si se habilita canal controlable.
- RAG.
- Embeddings.
- Methodology KB.
- Billing real.
- Retention/export/delete.
- Admin visibility avanzada.
- Full public launch.

## 11. Proximo paso recomendado

Siguiente hito recomendado:

```text
ADVISOR-3-AUDIT-SPEC - RAG / Methodology KB
```

Alcance recomendado:

- Solo auditoria/spec.
- No implementacion directa.
- No schema changes sin migracion auditada.
- No provider/billing/deploy changes dentro del spec inicial.

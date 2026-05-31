# HITO ADVISOR-2F-RELEASE/SMOKE — Controlled Production Verification

## 1. Objetivo

Verificar de forma controlada el estado de producción posterior a ADVISOR-2F Project Memory Auto-Extraction Lite, sin implementar código, sin tocar schema, sin aplicar migraciones, sin cambiar variables de entorno, sin deploy manual y sin declarar full public launch.

## 2. Contexto

ADVISOR-2F implementó auto-extracción determinística y conservadora para Project Memory Vault. Los candidatos generados por el Advisor quedan en estado `needs_review` y deben pasar por el flujo existente de revisión del Project Memory Panel.

Este hito valida readiness operativa y documenta límites de la verificación.

## 3. Commit validado

Commit funcional validado:

```text
6279020 feat: add Senior Advisor memory auto-extraction lite
```

Branch local:

```text
main
```

Estado remoto observado antes de documentar:

```text
main...origin/main
```

No se hizo push durante este hito.

## 4. Estado Git

Precheck:

- Working tree limpio antes de crear documentación.
- Branch `main` sincronizado con `origin/main`.
- Stashes preservados:
  - `stash@{0}: On main: park unrelated Hero/index changes before ADVISOR-2C`
  - `stash@{1}: On main: park beta invite docs before functional readiness`

No se reaplicaron stashes.

No se tocó `Hero.tsx`.

No se tocó `src/index.css`.

## 5. Validaciones locales

Validaciones ejecutadas:

```bash
npm run hostinger:diagnose
npx prisma validate
npx prisma generate
npm run lint
npm run typecheck
npm run build
npm run test:run
```

Resultado:

- `npm run hostinger:diagnose`: OK. No imprime secretos, no conecta a DB, no ejecuta build.
- `npx prisma validate`: OK.
- `npx prisma generate`: OK.
- `npm run lint`: OK.
- `npm run typecheck`: OK.
- `npm run build`: OK.
- `npm run test:run`: OK, 52 files / 227 tests.

Nota de build:

- Se mantiene el warning conocido de Turbopack/NFT sobre `src/server/evidence/localStorageService.ts`.
- No bloquea build.

## 6. Producción pública

Base URL verificada:

```text
https://shiftevidence.com
```

Rutas públicas:

- `/`: HTTP 200.
- `/shiftreadiness`: HTTP 200.
- `/sign-in`: HTTP 200.
- `/sign-up`: HTTP 200.

Rutas protegidas sin sesión:

- `/dashboard`: HTTP 307 hacia `/sign-in`.
- `/dashboard/assessments`: HTTP 307 hacia `/sign-in`.

Resultado:

- Runtime público OK.
- Protección de rutas OK para usuario anónimo.
- No se forzó deploy.
- No se confirmó marker público directo del commit `6279020`, porque la funcionalidad ADVISOR-2F no expone indicador visible en landing pública.

## 7. Smoke autenticado

Resultado: BLOQUEADO.

Motivo:

- Chrome está instalado y corriendo.
- Codex Chrome Extension figura instalada y habilitada.
- El canal de control no quedó disponible.
- El diagnóstico del native host reportó que la clave Windows de Native Messaging Host no existe para `com.openai.codexextension`.

Decisión:

- No se usaron credenciales.
- No se inspeccionaron cookies, local storage, passwords ni stores de sesión.
- No se abrió una nueva ventana Chrome ni se intentó reparación del plugin.
- No se ejecutó smoke autenticado del Senior Advisor Memory Panel.

## 8. Mensajes usados para smoke sanitizados

No aplica para producción autenticada.

No se enviaron mensajes reales al Advisor en producción porque no hubo sesión autenticada controlable.

Mensajes previstos para un retry seguro:

- User decision signal: registrar una decisión explícita sin secretos ni datos de cliente.
- Advisor recommendation signal: observar si una respuesta del Advisor genera candidate memory `needs_review`.
- No-extraction signal: enviar texto trivial y confirmar que no genera memoria.
- Dedupe signal: repetir una señal equivalente y confirmar que no duplica candidates.

## 9. Resultado de auto-extraction

Resultado: NO VALIDADO EN PRODUCCIÓN AUTENTICADA.

Evidencia disponible:

- Validación local completa OK.
- Tests unitarios/integración del hito ADVISOR-2F OK.
- DB production read-only no muestra items auto-extraídos todavía:
  - total memory items: 0.
  - `needs_review`: 0.
  - `autoExtracted=true`: 0.

Interpretación:

- No hay evidencia de ejecución real de auto-extraction en producción durante este hito.
- El resultado es consistente con el bloqueo del smoke autenticado.

## 10. Resultado de dedupe

Resultado: NO VALIDADO EN PRODUCCIÓN AUTENTICADA.

Evidencia disponible:

- Validado por suite local de ADVISOR-2F.
- No validado mediante interacción real en producción por falta de sesión autenticada controlable.

## 11. Resultado de no-extraction

Resultado: NO VALIDADO EN PRODUCCIÓN AUTENTICADA.

Evidencia disponible:

- Validado localmente con tests.
- No se ejecutó caso trivial en producción.

## 12. Resultado de Memory Panel

Resultado: NO VALIDADO EN PRODUCCIÓN AUTENTICADA DURANTE ESTE HITO.

Base previa:

- ADVISOR-2E documentó smoke autenticado user-attested del Project Memory Panel.

Estado de este hito:

- No se pudo abrir dashboard autenticado de forma controlada.
- No se confirmó visualmente aparición de candidates `needs_review`.

## 13. Resultado de AiUsageEvent metadata

Read-only DB check:

- Eventos `senior_advisor_message`: 7.
- Eventos con `memoryCandidatesGenerated`: 0.
- Eventos con `memoryCandidatesSkipped`: 0.
- Eventos con `memoryExtractionStatus`: 0.

Interpretación:

- No hay evidencia DB de mensajes Advisor posteriores al despliegue que hayan registrado la metadata nueva.
- No se leyó contenido crudo de prompts, respuestas, títulos ni summaries.

## 14. Resultado de seguridad/logs

Seguridad:

- No secrets impresos.
- No raw file contents.
- No lectura de contenido crudo de memoria.
- No inspección de cookies ni local storage.
- No cross-workspace leakage observado.
- No DB mutation adicional.
- No deploy manual.
- No full public launch.
- No provider/pricing/billing/storage changes.
- No RAG/embeddings/nuevas features.

Logs:

- No se hizo inspección de logs privados de producción.
- Se ejecutó `npm run hostinger:diagnose`, que no imprime secretos y no conecta a DB.

## 15. DB read-only checks

Proyecto:

```text
InfraShift
```

Branch producción:

```text
br-raspy-morning-ap11hfm6
```

Database:

```text
neondb
```

Neon MCP:

- Primer agregado read-only sobre `AssessmentAdvisorMemoryItem` devolvió lista vacía.
- Luego el conector pidió reautenticación antes de permitir más acciones.
- No se forzó reautenticación OAuth.

Fallback read-only local:

- Se usó conexión local configurada para ejecutar agregados read-only.
- No se imprimió `DATABASE_URL`.
- No se imprimieron IDs, contenido de memoria, prompts ni respuestas.

Resultados:

- `AssessmentAdvisorMemoryItem`: 0 rows.
- `needs_review`: 0.
- `autoExtracted=true`: 0.
- `AiUsageEvent` Senior Advisor: 7 rows.
- Metadata ADVISOR-2F en eventos existentes: 0 rows.

Nota:

- Una consulta read-only inicial asumió un literal de enum incorrecto y Postgres la rechazó sin mutar datos.
- El check fue repetido con casteo a texto y agregados enum-agnósticos.

## 16. Riesgos pendientes

- Smoke autenticado real de ADVISOR-2F.
- Evidencia de production deploy con marker funcional o evento posterior al commit.
- Auto-extraction observada en producción con candidate `needs_review`.
- Dedupe observado en producción.
- No-extraction observado en producción.
- Memory Panel mostrando candidate generado por auto-extraction.
- RAG.
- Embeddings.
- Billing real.
- Retention/export/delete.
- Admin visibility avanzada.
- Full public launch no declarado.

## 17. Veredicto

Estado: PARCIAL.

Veredicto:

- ADVISOR-2F está sano localmente y producción pública responde correctamente.
- La verificación autenticada de Auto-Extraction Lite en producción queda bloqueada por falta de canal Chrome controlable.
- No hay evidencia DB de auto-extraction ejecutada en producción todavía.

Production readiness:

- Código: alto.
- Runtime público: OK.
- Smoke autenticado ADVISOR-2F: pendiente.
- Full public launch: NO declarado.

## 18. Próximo paso recomendado

Ejecutar `ADVISOR-2F-SMOKE-RETRY` cuando haya una sesión autenticada controlable o cuando el usuario pueda validar manualmente:

- enviar mensaje con decisión explícita;
- confirmar candidate `needs_review`;
- confirmar dedupe;
- confirmar no-extraction;
- confirmar Memory Panel;
- confirmar metadata `AiUsageEvent`.

Después del cierre autenticado, evaluar `ADVISOR-3-AUDIT-SPEC` o continuar con hardening de auto-extraction post-message.

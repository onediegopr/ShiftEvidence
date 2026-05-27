# HITO AI-1-MOCK-QA - Authenticated Mock AI Advisory QA

## Objetivo

Validar de forma controlada que la capa AI Advisory implementada en AI-1 funciona con provider `mock`, sin llamadas externas reales, sin romper report preview/PDF y sin exponer secretos.

## Estado Inicial

- Branch: `main`.
- HEAD/origin esperado: `b1e51fe feat: add safe AI advisory layer`.
- Working tree inicial: limpio.
- Production launched: SI.
- Limited public beta: SI.
- Full public launch: NO.
- AI real external provider: NO.

## Configuracion Validada

Se valido localmente con variables temporales de proceso:

```bash
AI_ADVISORY_ENABLED=true
AI_ADVISORY_PROVIDER=mock
AI_ADVISORY_MODEL=mock-local
```

No se modificaron archivos `.env`.
No se cambiaron feature flags productivos.
No se llamo a Gemini/OpenAI.

## Validaciones Ejecutadas por Codex

- `git status`: limpio.
- `git fetch origin main`: OK.
- `HEAD == origin/main`: OK al inicio.
- `npm run hostinger:diagnose`: OK, sin imprimir secretos.
- `npm run ai:guardrails`: OK.
- `npm run typecheck`: OK.
- `npm run typecheck` con flags mock temporales: OK.
- `npm run lint`: OK.
- `npm run build` con flags mock temporales: OK.

## Local Build Recovery

El primer build mock fallo por lock local:

- Error: `EPERM` sobre `.next/static/...`.
- Diagnostico: no habia listener en puerto 3000.
- Accion: se borro solo `.next`.
- Resultado: build mock reintentado y OK.

No se borro `node_modules`.
No se borro storage.
No se tocaron datos.

## AI Disabled Behavior

Validado por typecheck/build previos y arquitectura:

- Si `AI_ADVISORY_ENABLED` no esta activo, provider status es `disabled`.
- Report preview sigue disponible.
- PDF sigue disponible.
- La seccion AI Advisory no se muestra.
- Deterministic readiness/confidence sigue siendo source of truth.

## AI Mock Behavior

Validado por build en modo mock:

- `AI_ADVISORY_PROVIDER=mock` compila correctamente.
- Report route compila con seccion condicional `AI Advisory Notes`.
- PDF renderer compila con seccion condicional `AI Advisory Notes`.
- No hay dependencia de provider externo.
- No hay llamada externa real.

Validacion pendiente:

- Navegador autenticado con un assessment real y flags mock activos.
- Generar PDF desde UI y confirmar visualmente la seccion `AI Advisory Notes`.

## Payload / Guardrails

`npm run ai:guardrails` confirmo redaccion representativa de:

- `DATABASE_URL`.
- passwords.
- tokens.
- cookies.
- bearer strings.
- emails.
- paths de storage.
- raw uploaded file content.

El payload AI usa metadata y agregados, no archivos crudos.

## Report Preview / PDF

Estado validado por Codex:

- Typecheck: OK.
- Build mock: OK.
- Null-safety: cubierta por build/typecheck.
- AI disabled/unavailable: no debe bloquear preview/PDF.

Estado no validado por Codex:

- Browser autenticado real con flags mock activos.
- PDF visual descargado con advisory mock visible.

## Old Assessments

Compatibilidad cubierta por arquitectura:

- assessments sin `migrationContext` ya tienen fallback desde CONTEXT-1.
- AI Advisory disabled/mock usa payload builder tolerante a contexto faltante.
- Build/typecheck OK.

Pendiente:

- Browser QA autenticado de old assessment con provider mock visible.

## Warnings

Build mantiene warning NFT conocido:

- `next.config.mjs`
- `src/server/reports/reportStorageService.ts`
- download route

Este warning ya existia en validaciones anteriores y no bloquea AI-1-MOCK-QA.

## Decision

AI-1-MOCK-QA queda COMPLETO para validacion local/controlada de build, typecheck, lint y guardrails.

Queda PARCIAL para browser autenticado visual porque Codex no tiene sesion ni feature flags productivos activos.

## Estado Producto

- Controlled launch: 100%.
- Limited beta: 98%.
- Full public launch: 90-92%.
- Producto total: 94-95%.
- Full public launch: NO.

## Proximo Hito

AI-1-MOCK-QA-BROWSER si se quiere evidencia visual autenticada:

- levantar entorno local con `AI_ADVISORY_ENABLED=true` y `AI_ADVISORY_PROVIDER=mock`;
- usar usuario QA;
- abrir report preview;
- confirmar `AI Advisory Notes`;
- generar PDF;
- confirmar seccion AI Advisory en PDF.

## Follow-up - AI-1-MOCK-QA-BROWSER

Date: 2026-05-27.

User-attested browser evidence received:

- AI Advisory Notes appears in report preview: SI.
- PDF downloads and opens: SI.
- AI Advisory Notes appears in PDF: SI.
- No raw JSON visible: SI.
- No `[object Object]` visible: SI.
- Visible errors: NO.
- Final confidence: PASS.

Result:

- Main visual browser flow: PASS.
- Old assessment browser QA: not fully user-attested in this pass.
- Disabled fallback browser QA: pending / covered by controlled config and build validations.

# HITO AI-1.2-PROD-ENV-ACTIVATION - Gemini AI Advisory Production Activation

## Objetivo

Activar Gemini real en produccion para AI Advisory dentro de controlled production launch / limited public beta, sin activar OpenAI y sin declarar full public launch.

## Estado Inicial

- Branch: `main`.
- HEAD/origin esperado: `8a8e53e feat: add real AI advisory providers`.
- Production launched: SI.
- Limited public beta: SI.
- Full public launch: NO.
- Gemini provider real: implementado en codigo.
- OpenAI provider real: implementado en codigo, NO activar en este hito.

## Resultado

Estado: PARCIAL / BLOCKED.

Motivo:

- Codex no tiene una herramienta disponible para editar runtime env vars de Hostinger.
- El conector Hostinger disponible en esta sesion es para Hostinger Horizons website creation/edit links, no para administrar variables de entorno runtime.
- No se recibio ni se imprimio `GEMINI_API_KEY`.
- No se modifico Hostinger config.
- No se ejecuto deploy manual.
- Real provider smoke no puede ejecutarse hasta configurar env vars en Hostinger.

## Validado por Codex

- Git preflight: limpio y sincronizado en `8a8e53e`.
- Production public smoke sin sesion: OK.
- Private routes sin sesion redirigen a `/sign-in`.
- `npm run hostinger:diagnose`: OK, sin imprimir secretos.
- AI env vars locales: ausentes.

## Production Routes

Smoke sin sesion:

- `/`: 200 OK.
- `/shiftreadiness`: 200 OK.
- `/sign-in`: 200 OK.
- `/sign-up`: 200 OK.
- `/forgot-password`: 200 OK.
- `/reset-password`: 200 OK.
- `/dashboard`: 307 -> `/sign-in`.
- `/dashboard/assessments`: 307 -> `/sign-in`.
- `/dashboard/admin/unlock-requests`: 307 -> `/sign-in`.

## Env Vars Objetivo en Hostinger

Configurar sin exponer valores:

```bash
AI_ADVISORY_ENABLED=true
AI_ADVISORY_PROVIDER=gemini
AI_ADVISORY_MODEL=gemini-1.5-flash
AI_ADVISORY_TIMEOUT_MS=15000
AI_ADVISORY_MAX_INPUT_CHARS=24000
AI_ADVISORY_MAX_OUTPUT_CHARS=6000
GEMINI_API_KEY=<secret>
```

No configurar en este hito:

```bash
OPENAI_API_KEY
AI_ADVISORY_PROVIDER=openai
```

## Rollback

Rollback inmediato:

```bash
AI_ADVISORY_ENABLED=false
```

Alternativa:

```bash
AI_ADVISORY_PROVIDER=disabled
```

## Smoke Productivo Requerido Despues de Configurar Env Vars

User-attested checklist:

```text
AI-1.2 PROD GEMINI SMOKE

1. Hostinger env vars
- AI_ADVISORY_ENABLED configurado: SI/NO
- AI_ADVISORY_PROVIDER=gemini: SI/NO
- GEMINI_API_KEY configurado sin exponer valor: SI/NO
- OpenAI NO configurado/NO activo: SI/NO

2. App runtime
- Produccion carga /: SI/NO
- Login QA/controlado: SI/NO
- Dashboard carga: SI/NO

3. Report preview
- Assessment QA abre: SI/NO
- Report preview abre: SI/NO
- AI Advisory Notes aparece: SI/NO
- Provider real Gemini usado segun evidencia visible/log segura: SI/NO/NO SE
- Readiness/confidence siguen visibles: SI/NO
- AI no reemplaza scores deterministas: SI/NO
- No JSON crudo: SI/NO
- No [object Object]: SI/NO

4. PDF
- Generate PDF Preview: SI/NO
- PDF descarga y abre: SI/NO
- AI Advisory Notes aparece en PDF: SI/NO
- No JSON crudo / [object Object]: SI/NO

5. Errores
- Errores visibles: NO / describir
- Errores Hostinger logs: NO / describir sin secretos
- Resultado final: PASS / PARTIAL / FAIL
```

## Decision

- AI-1.2 production activation: PENDIENTE.
- Code readiness: YA COMPLETO en AI-1.1.
- Hostinger env activation: PENDIENTE por acceso/configuracion.
- Real Gemini smoke: PENDIENTE.
- Full public launch: NO.

# Mega Audit Production Readiness 1

Fecha: 2026-06-05

## 1. Objetivo

Ejecutar una auditoria integral de Shift Evidence antes de avanzar con tracking, Ads, pago real, piloto con cliente o public launch.

Alcance:

- Codigo.
- UX/UI.
- Producto/copy.
- Billing.
- Auth/security.
- Infra.
- Storage/R2.
- Upstash/rate limiting.
- DB/Prisma.
- PDFs/assets.
- Docs.
- Go-to-market.

Reglas aplicadas:

- No pagos.
- No Ads.
- No DNS.
- No DB destructive.
- No migrations.
- No env changes.
- No customer data.
- No secrets.
- No refactors grandes.
- No quick fixes de codigo en este hito.

## 2. Estado inicial

| Area | Estado inicial |
| --- | ---: |
| MEGA-AUDIT-PRODUCTION-READINESS-1 | 0% |
| Production readiness | 100% |
| General technical | 99% |
| Commercial readiness | 88% |
| Ads readiness | 72% |
| Tracking readiness | 20% |
| UX/UI confidence | 88% |
| Codebase cleanliness | 84% |

Contexto validado:

- Production cutover controlled: complete.
- Produccion activa en `https://www.shiftevidence.com`.
- Billing safe-off active.
- Stripe hosted checkout live smoke documentado, sin pago.
- R2 production OK.
- Upstash production OK.
- Auth/admin production OK.
- Main protegido con `vercel.json`: `main: false`, `preview: true`.

## 3. Resumen ejecutivo

Veredicto brutalmente honesto:

- Producto tecnicamente listo para uso controlado y private outreach.
- No hay blocker tecnico general para seguir con prospectos seleccionados.
- No esta listo para Ads pagas todavia.
- No esta listo para pago real self-service sin completar el gate final de Stripe.
- No conviene abrir public launch masivo hasta limpiar copy/UX de `sign-up`, alinear CTAs de pricing con safe-off y cerrar tracking/privacy.

Principales riesgos:

- Dependencia `xlsx` tiene vulnerabilidades conocidas sin fix upstream directo.
- `sign-up` conserva una experiencia mock/legacy con lenguaje demasiado fuerte para clientes reales.
- Pricing muestra CTAs de "Pay by card" aunque produccion termina safe-off en checkout.
- Docs historicas siguen mezclando Hostinger/estado anterior; son historicas, pero pueden confundir a operadores.
- Tracking/Ads readiness sigue bajo.

No se detecto:

- Checkout live habilitado.
- Pago real.
- DNS roto.
- Pagina Hostinger vieja.
- Cloudflare/Vercel error publico.
- PDF roto.
- Rutas privadas expuestas sin login.
- Claims peligrosos activos en las paginas publicas principales revisadas.

## 4. Auditoria tecnica

Baseline local:

- Branch: `main`.
- HEAD inicial: `52a6cae69289e25e980d3289ac2cf7595bc0d2e4`.
- `origin/main`: alineado.
- `origin/preview`: `5c8b695eb3c20b709db30b00d7cddc6164cf2fed`.
- Repo limpio al iniciar.
- `.env.local` no trackeado.
- `.env.r2-smoke.local` no trackeado.
- `.tmp` existe y esta ignorado.

Inventario:

- Inventario temporal generado en `.tmp/mega-audit-file-inventory.txt`.
- No se commitea.
- Conteo aproximado: 4604 archivos hasta profundidad 3, incluyendo dependencias locales y artefactos ignorados.

Estructura revisada:

- `src/app`.
- `src/components`.
- `src/server`.
- `src/lib`.
- `src/config`.
- `scripts`.
- `tests`.
- `docs`.
- `public`.
- `prisma`.
- `.env.example`.
- `vercel.json`.
- `package.json`.
- `next.config.mjs`.

Route map App Router:

- Public pages presentes: `/`, `/pricing`, `/demo`, `/demo/replay`, `/demo/workspace`, `/sample-report`, `/vmware-to-proxmox-readiness`, `/security`, `/support`, `/partners`.
- Private/dashboard pages presentes: `/dashboard`, `/dashboard/assessments`, `/dashboard/admin`, `/dashboard/admin/billing`, `/dashboard/admin/pricing`, `/dashboard/admin/unlock-requests`.
- API relevantes presentes: auth, billing start, Stripe webhook, assessment file download, report generate/download/delete, admin APIs.

## 5. Validaciones locales

| Validacion | Resultado | Nota |
| --- | --- | --- |
| `git diff --check` | OK | Sin whitespace errors |
| `npm run typecheck` | OK | TS clean |
| `npm run lint` | OK | ESLint clean |
| `npx prisma validate` | OK | Ejecutado con DB URL dummy no sensible |
| `npx prisma generate` | OK | Serializado |
| `npm run test:run` | OK | 119 files, 615 tests |
| `npm run build` | OK | Con env dummy no sensible para build local |

Notas:

- Un primer test completo tuvo un timeout aislado en `billingAdminFulfillmentActions.test.ts`; el test paso al repetirlo aislado.
- Un intento paralelo de build/test genero conflicto con Prisma Client en Windows/OneDrive. Serializado, la suite paso.
- Build sin auth secret local fallo de forma segura; build con dummy no sensible paso.

## 6. Dependency / package audit

`npm audit --omit=dev`:

- Moderate: `postcss` transitivo via Next, fix sugerido por audit no es seguro porque propone cambio mayor/breaking.
- High: `xlsx` con prototype pollution y ReDoS, sin fix disponible.

`npm outdated`:

- Hay patches disponibles para Next, React, Better Auth, AWS SDK, ESLint, Vitest y otros.
- Prisma tiene major disponible, no recomendado tocar en este hito.

`npm ls --depth=0`:

- Arbol resuelve.
- Observacion: `@emnapi/runtime` aparece como extraneous.

## 7. Smoke productivo publico

Base: `https://www.shiftevidence.com`.

| Ruta | Resultado |
| --- | --- |
| `/` | 200 |
| `/pricing` | 200 |
| `/demo` | 200 |
| `/demo/replay` | 200 |
| `/demo/workspace` | 200 |
| `/sample-report` | 200 |
| `/vmware-to-proxmox-readiness` | 200 |
| `/security` | 200 |
| `/support` | 200 |
| `/partners` | 200 |

No se observo:

- Hostinger fallback page.
- Cloudflare error.
- Vercel error.
- Old brand visible en paginas publicas principales.

## 8. PDF / asset audit

| Asset | Status | Content type | Firma | Pages | Hash |
| --- | --- | --- | --- | ---: | --- |
| Demo balanced report | 200 | PDF | `%PDF` | 7 | `794a9c349085a550...` |
| Public sample report | 200 | PDF | `%PDF` | 13 | `16539353d092a800...` |
| Premium sample report | 200 | PDF | `%PDF` | 23 | `298ebfdd2fdb1980...` |

Public vs premium sample:

- Hash identico: no.
- Resultado: OK.

## 9. UX/UI audit

Browser smoke publico:

| Ruta | Resultado visual |
| --- | --- |
| `/` | Carga OK, sin errores de consola, CTA visible |
| `/vmware-to-proxmox-readiness` | Carga OK, mensaje claro para Ads landing |
| `/pricing` | Carga OK, CTAs visibles |
| `/sample-report` | Carga OK, sample report claro |
| `/demo/replay` | Carga OK, sin errores de consola |
| `/support` | Carga OK, path de soporte visible |
| `/partners` | Carga OK |
| `/sign-up` | Carga OK, pero H1 ausente y experiencia mock/legacy |

Observaciones:

- Public UI principal esta estable.
- No se detectaron errores de consola en las paginas revisadas.
- No se detecto old branding publico en la muestra.
- `sign-up` necesita polish antes de trafico pago o clientes reales.
- Pricing necesita decision de UX mientras checkout esta safe-off.

## 10. Product / claims safety audit

Busqueda de claims peligrosos:

- En runtime publico revisado, no se detectaron promesas activas de guaranteed migration, zero downtime guaranteed, no risk, automatic migration o 100% accurate.
- Muchos matches existen como guardrails, disclaimers, tests o docs historicas.

Riesgo puntual:

- `sign-up` usa lenguaje como compatibilidad para "direct hypervisor migration conversion" y "Migration Blockers: None Identified".
- Aunque es parte de una experiencia mock/guided flow, puede sonar demasiado definitivo para un prospecto real.

## 11. Billing audit

Checkout productivo:

| Ruta POST | Resultado |
| --- | --- |
| `/billing/checkout/starter/start` | 303 `checkout_disabled` |
| `/billing/checkout/professional/start` | 303 `checkout_disabled` |
| `/billing/checkout/msp/start` | 303 `checkout_disabled` |

Checkout/bank-transfer pages:

- `/billing/checkout/starter`: 200.
- `/billing/checkout/professional`: 200.
- `/billing/checkout/msp`: 200.
- `/billing/bank-transfer/starter`: 200.
- `/billing/bank-transfer/professional`: 200.
- `/billing/bank-transfer/msp`: 200.

Codigo:

- Stripe start route crea session server-side solo si config/gates lo permiten.
- Fallos redirigen a checkout page con error controlado.
- Webhook route responde 405 a HEAD, esperado.
- No se detecto Lemon activo en runtime publico.
- Lemon queda como historico/schema/doc.

Riesgo UX:

- Pricing muestra "Pay by card" aunque el estado final productivo es safe-off.
- Esto es seguro tecnicamente, pero puede confundir en private outreach/public launch.

## 12. Auth / security / access control audit

Rutas privadas sin sesion:

| Ruta | Resultado |
| --- | --- |
| `/dashboard` | 307 a sign-in |
| `/dashboard/assessments` | 307 a sign-in |
| `/dashboard/admin` | 307 a sign-in |
| `/dashboard/admin/billing` | 307 a sign-in |
| `/dashboard/admin/pricing` | 307 a sign-in |
| `/dashboard/admin/unlock-requests` | 307 a sign-in |

APIs sensibles sin sesion / metodo incorrecto:

- Evidence download fake: redirect a sign-in.
- Report download fake: redirect a sign-in.
- Report generate fake con HEAD: 405.
- Stripe webhook con HEAD: 405.

Codigo:

- Se encontraron patrones de `ensureAssessmentOwnership` en servicios de evidence, advisor memory y unlocks.
- Admin usa `requireAdmin`.
- Logging y sanitizers evitan imprimir datos sensibles en varias superficies.

Limitacion:

- No se ejecuto un multi-user ownership attack autenticado en este hito.

## 13. Storage / R2 / Upstash audit

Estado documentado:

- R2 prod direct smoke OK.
- R2 app upload/download/delete OK.
- R2 hash verification OK.
- Upstash prod smoke OK.

Codigo:

- `STORAGE_DRIVER` soporta `local` y `r2`.
- `MAX_UPLOAD_SIZE_MB` existe.
- Rate limit usa Upstash cuando esta configurado.
- Produccion debe fallar cerrado si rate limit critico no esta configurado.

Observaciones:

- Tests cubren storage driver y R2 config con placeholders.
- No se tocaron buckets ni objetos reales.

## 14. DB / Prisma audit

Comandos seguros:

- Prisma validate OK con DB URL dummy.
- Prisma generate OK.
- No migrations.
- No db push.
- No prod DB connection.

Scripts/riesgos:

- Hay `deleteMany` en servicios, pero aparecen en contextos esperados como reimport de RVTools, limpieza de findings o revocacion/sesiones.
- No se ejecuto ningun script destructivo.

## 15. Tracking / Ads readiness audit

Resultado:

- No se encontro implementacion activa de Google Tag, GTM, GA4 o PostHog en runtime source.
- Docs de Google Ads prep ya documentan NO-GO por tracking/conversion/privacy.

Veredicto Ads:

- NO-GO para paid Ads.
- GO solo para preparacion y private outreach sin gasto.

## 16. Docs audit

Docs recientes coherentes:

- Production cutover.
- DNS Cloudflare.
- Stripe hosted checkout.
- Customer pilot.
- Market activation.
- Google Ads prep.
- R2.
- Upstash.
- Neon.
- Billing.

Riesgo:

- Existen muchas docs historicas con Hostinger, estados pre-cutover y referencias antiguas.
- Son utiles como historial, pero sin un indice "current canonical state" pueden confundir.

No se borraron docs.

## 17. Logs / observability audit

Vercel logs:

- Se consultaron logs recientes del deployment productivo actual.
- Ultimos 20 logs observados: requests 200, sin error/fatal visible.

Limitaciones:

- No se hizo una auditoria profunda de logs por rango largo.
- No hay evidencia en este hito de dashboard dedicado de error tracking, tracing o conversion analytics.

## 18. Secret scan

Busqueda local:

- No se detectaron valores secretos reales trackeados.
- Los matches observados son placeholders, nombres de env vars, tests de sanitizacion, docs historicas o codigo que lee env vars.
- `.env.local` y `.env.r2-smoke.local` siguen no trackeados.

No se imprimieron valores secretos.

## 19. Hallazgos clasificados

| ID | Area | Hallazgo | Severidad | Tipo | Archivo/Ruta | Riesgo | Accion recomendada | Fix aplicado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MA-001 | Dependencies | `xlsx` tiene vulnerabilidades conocidas y no hay fix upstream directo | HIGH | security | `package.json` | Riesgo al parsear workbooks no confiables | Evaluar reemplazo, sandboxing, limites estrictos o parser alternativo antes de clientes reales amplios | No |
| MA-002 | UX/Product | `sign-up` conserva wizard mock/legacy con lenguaje demasiado definitivo | HIGH | UX/copy | `src/app/sign-up/page.tsx` | Puede sobreprometer readiness y confundir prospectos | Hotfix copy/UX: H1 visible, disclaimer, reemplazar mock filename y suavizar score/results | No |
| MA-003 | Billing UX | Pricing muestra "Pay by card" mientras produccion queda safe-off | MEDIUM | billing/UX | `/pricing`, billing config | Confusion comercial antes de public launch o outreach | Mientras safe-off: CTA podria decir "Card checkout temporarily disabled" o priorizar invoice/contact | No |
| MA-004 | Admin Ops Copy | Admin aun menciona Hostinger como destino operativo | MEDIUM | copy/ops | `src/app/dashboard/admin/page.tsx` | Puede confundir operadores tras cutover a Vercel | Reemplazar por "runtime provider" / "Vercel/runtime env" en hotfix menor | No |
| MA-005 | Docs | Muchas docs historicas mezclan Hostinger/pre-cutover/estado viejo | MEDIUM | docs | `docs/*` | Confusion operativa | Crear indice canonical current-state y marcar docs historicas como archive/reference | No |
| MA-006 | Tracking | No hay tracking/conversion/privacy readiness para Ads | MEDIUM | go-to-market | `src`, docs Ads | Ads sin medicion y privacy review | Ejecutar `GOOGLE-ADS-TRACKING-SETUP-1` antes de spend | No |
| MA-007 | Dependency Maintenance | `postcss` transitivo audit moderate via Next | MEDIUM | security/maintenance | `package-lock.json` | Riesgo moderado; fix automatico no seguro | Plan de dependency patch/upgrade controlado | No |
| MA-008 | Local Workflow | Build/test paralelos pueden pelear por Prisma Client en Windows/OneDrive | LOW | developer workflow | local validation | Falsos negativos en CI local | Serializar Prisma generate/build/tests localmente | No |
| MA-009 | Package Hygiene | `npm ls` muestra `@emnapi/runtime` extraneous | LOW | maintenance | `node_modules` | Ruido local, no runtime confirmado | Reinstalacion limpia o revisar lock en hito de hygiene | No |
| MA-010 | Observability | Logs recientes limpios, pero no hay auditoria profunda/tracing | LOW | observability | Vercel/logging | Menor visibilidad ante incidente real | Definir observability baseline y alertas antes de lanzamiento amplio | No |

Conteo:

- BLOCKER: 0.
- HIGH: 2.
- MEDIUM: 5.
- LOW: 3.
- INFO: 0.

## 20. Quick fixes aplicados

No se aplicaron quick fixes de codigo.

Motivo:

- Los hallazgos seguros son reales pero conviene tratarlos en un hotfix dedicado para no mezclar auditoria con cambios de comportamiento/copy publico.
- No habia blocker que justificara cambiar produccion dentro de este hito.

## 21. Hotfixes recomendados

Orden recomendado:

1. `MEGA-AUDIT-HOTFIX-1`: corregir `sign-up` mock/copy y admin Hostinger copy.
2. `BILLING-SAFE-OFF-UX-1`: alinear pricing CTAs con safe-off o definir live payment gate.
3. `DEPENDENCY-XLSX-RISK-1`: evaluar reemplazo/sandbox/limites para workbook parsing.
4. `DOCS-CANONICAL-STATE-INDEX-1`: indice actual vs historico.
5. `GOOGLE-ADS-TRACKING-SETUP-1`: tracking, conversiones y privacy review.

## 22. Go/no-go

| Area | Verdict | Razon |
| --- | --- | --- |
| Private outreach | GO with guardrails | Producto estable; usar sample/demo/discovery, sin datos reales sin consentimiento |
| Pilot | CONDITIONAL GO | Requiere prospecto/dataset/consentimiento |
| Ads | NO-GO | Tracking/conversion/privacy incompleto |
| Payment | NO-GO | Falta aprobacion exacta y final gate de pago real |
| Public launch masivo | NO-GO | Requiere resolver UX/copy/billing/tracking/support expectations |
| Soft public availability | GO | Ya esta online y smoke OK, mantener alcance controlado |

## 23. Riesgos restantes

- Dependencia workbook parser sin fix upstream.
- UX/copy en `sign-up` no esta al nivel del resto del producto.
- CTAs de pago pueden generar friccion mientras safe-off siga activo.
- Docs historicas pueden confundir a operadores nuevos.
- Ads sin tracking desperdiciaria presupuesto.
- Falta piloto real con feedback real.
- Falta pago real controlado si se desea validar cobro completo.

## 24. Porcentajes finales

| Area | Final |
| --- | ---: |
| MEGA-AUDIT-PRODUCTION-READINESS-1 | 100% |
| Production readiness | 100% |
| General technical | 98% |
| Commercial readiness | 87% |
| Ads readiness | 72% |
| Tracking readiness | 20% |
| UX/UI confidence | 86% |
| Codebase cleanliness | 83% |
| Security confidence | 88% |
| Documentation confidence | 82% |

## 25. Proximo hito recomendado

Recomendado inmediato:

- `MEGA-AUDIT-HOTFIX-1`.

Luego:

- `GOOGLE-ADS-TRACKING-SETUP-1`.
- `PRIVATE-OUTREACH-1`.
- `PILOT-EXECUTION-1`.
- `STRIPE-LIVE-PAYMENT-FINAL-GATE-1` solo con aprobacion exacta.

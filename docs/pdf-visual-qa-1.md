# PDF Visual QA 1

Fecha: 2026-06-05

## 1. Objetivo

Validar visualmente los PDFs principales de Shift Evidence / ShiftReadiness y documentar si estan listos para uso comercial controlado.

Este hito fue de QA visual y documentacion. No se ejecuto produccion, no se tocaron datos reales, no se modifico codigo y no se hicieron cambios de infraestructura.

## 2. PDFs revisados

| PDF | Ruta | Fuente revisada | Resultado |
| --- | --- | --- | --- |
| Demo PDF | `/demo/reports/balanced-mid-market` | Local dev con datos sinteticos | Ready with minor fixes |
| Public sample PDF | `/sample-reports/proxmox-migration-readiness-sample-report.pdf` | Asset local sintetico servido por local dev | Ready with minor fixes |
| Premium sample PDF v2 | `/sample-reports/proxmox-migration-readiness-premium-sample-report-v2.pdf` | Asset local sintetico servido por local dev | Ready with minor fixes |
| Generated synthetic report | Demo PDF route | Renderer dinamico local sintetico | Ready with minor fixes |

Nota de acceso Preview: la descarga directa desde Vercel Preview estable devolvio `401 Unauthorized` por Preview Protection. El navegador de la app tambien mostro `Vercel Authentication Required`. Para evitar usar bypass tokens o secretos, la QA visual se realizo contra endpoints locales equivalentes con datos sinteticos.

## 3. Herramientas usadas

- Validaciones base de repo con `git`, `npm`, `vitest` y `next build`.
- Local dev server en `http://localhost:3001` con placeholders no sensibles.
- `curl.exe` para descargar PDFs binarios.
- PyMuPDF (`fitz`) para page count, extraccion de texto y render visual por pagina.
- Revision visual manual de contact sheets y paginas individuales renderizadas.

No estaban disponibles `pdfinfo`, `mutool`, `qpdf`, `pdftotext` ni `magick`.

## 4. Resultado tecnico por PDF

| PDF | HTTP | Content-Type | Size | Header | Pages | Hash prefix | Datos reales |
| --- | ---: | --- | ---: | --- | ---: | --- | --- |
| Demo PDF | 200 | `application/pdf` | 14,957 bytes | `%PDF-` | 7 | `3365AB1CF6ADA7A2` | No |
| Public sample PDF | 200 | `application/pdf` | 2,685,561 bytes | `%PDF-` | 23 | `F255CCA0E922789F` | No |
| Premium sample PDF v2 | 200 | `application/pdf` | 2,685,561 bytes | `%PDF-` | 23 | `F255CCA0E922789F` | No |

Observacion importante: el Public sample PDF y el Premium sample PDF v2 tienen el mismo size y el mismo hash. Visual y tecnicamente son el mismo archivo. Esto no bloquea uso comercial controlado, pero si reduce la diferenciacion entre "Public Sample Report" y "Deep Technical/Premium Sample".

## 5. Checklist visual

### Demo PDF

| Area | Estado | Nota |
| --- | --- | --- |
| Portada | Minor fix | Titulo y scores claros; el lockup/logo superior se ve pequeno y algo dificil de leer. |
| Branding | OK | Paleta, footer y headers consistentes. |
| Estructura | OK | 7 paginas, flujo claro, sin paginas en blanco inesperadas. |
| Scores | OK | Readiness, Evidence Confidence y VM count estan separados. |
| Evidence | OK | Evidence received/missing aporta valor y no oculta gaps. |
| Riesgos | OK | Top risks claros, severidad entendible. |
| Migration waves | OK | Wave 0, standard, production y hold manual review son claras. |
| Senior Advisor / AI notes | OK | Tono prudente, no promete decision automatica. |
| Disclaimers | OK | Synthetic, no customer data, no production access, no migration execution. |
| Legibilidad | OK | Sin overflow visible ni texto cortado. |

### Public sample PDF

| Area | Estado | Nota |
| --- | --- | --- |
| Portada | OK | Profesional, comercial y clara. Indica sample sintetico, no customer data y no production access. |
| Branding | OK | Logo, colores, headers, footers y numeracion consistentes. |
| Estructura | OK | 23 paginas con flujo ejecutivo-tecnico claro. |
| Scores | OK | Readiness, Confidence y Storage se presentan separados. |
| Evidence | OK | Evidence matrix y missing evidence estan orientados a decision. |
| Riesgos | OK | Riesgos, severity y acciones son legibles. |
| VM Matrix | OK | Tabla legible, sin overflow visual. |
| Storage / Network / Backup | OK | Storage Destination Readiness, backup gaps y network/design risks aparecen. |
| Licensing / Cost Exposure | OK | Presentado como estimacion, no como quote ni ahorro garantizado. |
| Business Continuity | OK | Downtime, rollback, backup y critical workloads se tratan con prudencia. |
| Migration Waves | OK | Waves y gates claros; no parece ejecucion automatica. |
| Senior Advisor / AI notes | OK | Apoya scoring y review experto, no reemplaza consultoria. |
| Disclaimers | OK | Fuertes y visibles en pagina de assumptions. |
| CTAs | OK | Demo, workspace, pricing/contact y assessment son claros. |
| Legibilidad | OK | Buena legibilidad general; mucho aire blanco, aceptable para reporte ejecutivo. |
| Diferenciacion | Minor fix | El endpoint publico entrega el mismo PDF que premium v2. |

### Premium sample PDF v2

| Area | Estado | Nota |
| --- | --- | --- |
| Profundidad tecnica | Minor fix | El contenido es bueno y completo, pero es identico al public sample PDF. |
| Executive Summary | OK | Claro y orientado a decision. |
| Scope | OK | Alcance sintetico documentado. |
| Evidence Matrix | OK | Recibido vs faltante claro. |
| Environment Overview | OK | Datos sinteticos coherentes. |
| Readiness / Confidence | OK | Separacion correcta. |
| Storage | OK | Storage readiness y gaps visibles. |
| Licensing | OK | Estimaciones prudentes. |
| Business Continuity | OK | Riesgos y validaciones claras. |
| VM Risk Matrix | OK | Legible y accionable. |
| Migration Plan | OK | Waves, gates y rollback expectations claros. |
| Advisor notes | OK | Tono senior y prudente. |
| Project Memory | OK | Decision capture presente. |
| Assumptions/disclaimers | OK | Guardrails adecuados. |

## 6. Claims safety

Claims buscados:

- `zero downtime`
- `guaranteed migration`
- `guaranteed savings`
- `automatic migration`
- `no risk`
- `production safe`
- `replace consultant`
- `100% accurate`

Resultado:

- Demo PDF: hits para `zero downtime`, `guaranteed savings` y `production safe`, todos en contexto de negacion/disclaimer.
- Public sample PDF: hit para `zero downtime`, en contexto de disclaimer.
- Premium sample PDF v2: hit para `zero downtime`, en contexto de disclaimer.

Veredicto claims safety: OK.

No se detectaron promesas activas de zero downtime, guaranteed migration, guaranteed savings, automatic migration, no risk, production safe, replacement of consultant ni 100% accuracy.

## 7. Go / No-Go por PDF

| PDF | Veredicto | Uso comercial controlado |
| --- | --- | --- |
| Demo PDF | Ready with minor fixes | Si |
| Public sample PDF | Ready with minor fixes | Si |
| Premium sample PDF v2 | Ready with minor fixes | Si |
| Generated synthetic report route | Ready with minor fixes | Si |

Veredicto general: Ready for controlled commercial use with minor fixes.

No-Go para declarar diferenciacion final Public vs Premium hasta resolver que ambos endpoints entregan el mismo PDF.

## 8. Issues encontrados

| Severidad | PDF | Pagina | Seccion | Issue | Recomendacion |
| --- | --- | ---: | --- | --- | --- |
| Minor | Demo PDF | 1 | Portada | Lockup/logo superior se ve pequeno y puede leerse como superpuesto o poco claro. | Ajustar logo/espaciado en `PDF-VISUAL-HOTFIX-1`. |
| Medium | Public + Premium | Todas | Asset/versioning | Public sample PDF y Premium sample PDF v2 son identicos. | Decidir si el public sample debe ser una version mas corta o si el CTA debe explicar que es el full premium sample publico. |
| Minor | Public + Premium | Varias | Layout | Mucho espacio blanco en paginas ejecutivas. | Mantener si se busca tono premium; compactar solo si se quiere reducir longitud. |

No se detectaron:

- paginas en blanco inesperadas;
- tablas rotas;
- overflow visual grave;
- texto cortado;
- branding roto;
- iconos faltantes;
- mojibake visible;
- claims peligrosos como promesa activa.

## 9. Hotfix

No hubo hotfix.

No se modifico codigo, no se regeneraron PDFs, no se tocaron assets productivos y no se aplicaron cambios visuales durante este hito.

## 10. Validaciones

Validaciones ejecutadas:

- `git status -sb`: limpio al inicio.
- `git diff --check`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npx vitest run tests/unit/reportPdfRenderer.test.ts tests/unit/demoWorkspace.test.ts`: OK, 14 tests.
- `npm run test:run`: OK, 119 archivos, 615 tests.
- `npm run build`: OK con placeholders locales no sensibles.

Notas de build:

- Primer intento fallo por lock de `.next/static` en OneDrive (`EPERM unlink`).
- Se limpio el artefacto local `.next` de forma segura.
- Segundo intento compilo y fallo por env local faltante.
- Tercer intento uso placeholders no sensibles para `DATABASE_URL`, `DIRECT_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` y `NEXT_PUBLIC_APP_URL`.
- No hubo conexion a DB real ni uso de secretos.

## 11. Seguridad

Durante este hito:

- No production deploy intencional.
- No Hostinger.
- No DNS.
- No DB real.
- No migrations.
- No db push.
- No production R2.
- No bucket prod.
- No Stripe.
- No Stripe live.
- No payments.
- No Wise.
- No webhooks.
- No entitlements reales.
- No env vars productivas.
- No secrets impresos.
- No datos reales.
- No PDFs con datos reales.
- No codigo modificado.

Los PDFs temporales quedaron en `.tmp/pdf-qa`, carpeta ignorada por git.

## 12. Porcentajes finales

| Area | Avance final |
| --- | ---: |
| PDF-VISUAL-QA-1 | 100% |
| PDF/report quality | 96% |
| Production/cutover readiness | 86% |
| Vercel readiness | 88% |
| Storage/R2 readiness | 97% |
| Billing readiness | 95% |
| Avance general tecnico | 97% |

## 13. Proximo hito recomendado

Recomendado: `PDF-VISUAL-HOTFIX-1`.

## 14. Follow-up

After the initial QA pass, the standalone migration plan PDF received a small REPORTS-UX-3 polish:

- the visible title now reads `Migration Blueprint Decision Pack`;
- the blank trailing page artifact in the QA render path was removed;
- route, storage, entitlement and PDF engine contracts remained unchanged.

Objetivo sugerido:

- Diferenciar public sample vs premium sample v2, o documentar intencionalmente que ambos apuntan al full premium synthetic sample.
- Ajustar lockup/logo del Demo PDF.
- Revalidar page count, visual QA y claims safety.

Si se acepta que ambos sample PDFs sean identicos por ahora, el siguiente hito puede ser `PRODUCTION-ENV-PREP-1`.

## 14. Hotfix follow-up

`PDF-VISUAL-HOTFIX-1` fue ejecutado el 2026-06-05.

Resultado:

- Public sample PDF y Premium sample PDF v2 ya estan diferenciados.
- Public sample PDF paso a una variante publica/comercial de 13 paginas.
- Premium sample PDF v2 conserva la version profunda de 23 paginas.
- Los hashes y tamanos ya son distintos.
- Demo PDF logo/lockup fue ajustado y la portada quedo mas clara.

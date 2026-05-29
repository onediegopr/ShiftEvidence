# HITO ACC-PDF-FIX-1 - Assessment Coverage PDF Layout Clipping

## 1. Objetivo

Corregir el layout PDF de la seccion `Assessment Coverage & Assumptions` para eliminar clipping horizontal del texto introductorio y reemplazar continuaciones genericas de limitations por encabezados profesionales.

## 2. Hallazgos corregidos

Hallazgos detectados en `ACC-RELEASE-QA-1`:

- Texto introductorio de `Assessment Coverage & Assumptions` cortado hacia el margen derecho.
- Continuacion de limitations con heading generico `CONTINUED / List`.

## 3. Causa probable del clipping

El helper `addContentPage()` renderiza el subtitle del header con coordenadas a la derecha. Despues dejaba `doc.y = 92`, pero no reseteaba `doc.x`.

El helper `paragraph()` llamaba a `doc.text()` sin coordenadas explicitas. PDFKit reutilizaba el `doc.x` anterior, por lo que el intro de Section 2A comenzaba cerca del margen derecho y el `width` disponible terminaba excediendo el area visible.

## 4. Fix aplicado

Archivo principal:

- `src/server/reports/reportPdfRenderer.ts`

Cambios:

- `addContentPage()` ahora resetea `doc.x = MARGIN` al terminar el header.
- `paragraph()` fuerza `x = MARGIN` y `width = contentWidth(doc)`.
- `h2()` fuerza `x = MARGIN` y `width = contentWidth(doc)` para headings y notes.
- `bulletList()` acepta `continuationTitle` opcional.
- El bloque de `Report Limitations` reserva espacio antes del heading.
- La nota USD reserva espacio antes de renderizar el callout.

## 5. Continuation heading corregido

Antes:

- `CONTINUED / List`

Ahora:

- `CONTINUED / Report Limitations continued`

Esto evita un encabezado tecnico/generico en paginas de continuacion.

## 6. PDF smoke

Se genero un PDF sintetico usando el renderer real:

- Sin DB real.
- Sin AI real.
- Sin datos sensibles.
- Sin commitear binarios.

Resultado:

- Buffer PDF generado correctamente.
- Header: `%PDF`.
- Tamano: 28.116 bytes.
- Page count: 14.
- `Assessment Coverage & Assumptions`: presente.
- Tabla de modulos: presente.
- Limitations: presentes.
- USD note: presente.
- Page numbers: presentes.
- Heading generico `List`: no aparece en la continuacion.
- Heading profesional `Report Limitations continued`: presente.

Visual QA:

- Intro ya respeta margen izquierdo y ancho disponible.
- Intro hace wrapping correcto.
- No se observo clipping horizontal en Section 2A.
- Continuacion de limitations es profesional.

## 7. Tests

Archivo agregado:

- `tests/unit/reportPdfRenderer.test.ts`

Caso agregado:

- Render smoke del PDF con `Assessment Coverage & Assumptions`, optional modules y limitations largas.
- Verifica header `%PDF`.
- Verifica tamano de buffer mayor a 20 KB.

Resultado:

- `npm run test:run`: OK, 13 archivos / 56 tests.

## 8. Validaciones

Validaciones ejecutadas:

- `npm run test:run`: OK.
- `npm run lint`: OK con 10 warnings preexistentes de `<img>`.
- `npm run typecheck`: OK.
- `npm run build`: OK.
- `npm run hostinger:diagnose`: OK.
- `npx prisma validate`: OK.
- `npx prisma generate`: OK.

Nota:

- Primer `npm run build` fallo por `EPERM` al borrar un archivo generado dentro de `.next` en OneDrive/Windows.
- Se verifico que `.next` estaba dentro del workspace y se limpio solo ese cache generado.
- El build posterior paso correctamente.
- El warning NFT/Turbopack conocido permanece como deuda tecnica separada.

## 9. Que no se toco

- DB schema: no tocado.
- Migraciones: no creadas.
- Parser RVTools: no tocado.
- AI providers/prompts: no tocados.
- Scoring: no tocado.
- Pricing/cost formulas: no tocadas.
- Dashboard UI web: no tocado.
- Auth: no tocado.
- CSP/headers: no tocados.
- Rate limiting: no tocado.
- Sample public report: no regenerado ni modificado.
- `.env.local`: no modificado.
- Hostinger: no tocado.

## 10. Riesgos pendientes

- QA autenticada real con cuenta/DB QA aislada.
- PDF visual acceptance con assessment real o QA aislado.
- Warning NFT/Turbopack.

## 11. Confirmaciones

- Push realizado: NO.
- Production deploy: NO.
- Production launched: NO.
- DB migration: NO.

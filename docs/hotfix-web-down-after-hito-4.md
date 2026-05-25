# Hotfix - Web Down After Hito 4

Fecha: 2026-05-25

## Síntoma

Después del Hito 4, la aplicación no parecía levantar correctamente en el puerto esperado. En la práctica, el servidor de desarrollo estaba desviándose a otro puerto porque `3000` ya estaba ocupado por un proceso Node previo.

## Comandos ejecutados

- `git status --short`
- `node -v`
- `npm -v`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run dev`
- `npm run start`

## Error / evidencia exacta

- `npm run typecheck`: OK
- `npm run lint`: OK
- `npm run build`: OK
- `npm run dev`: inicialmente mostró que `3000` estaba ocupado y levantó en `3001`
- `npm run start`: pudo arrancar cuando el puerto estaba libre

Evidencia relevante del problema:

- `Port 3000 is in use by process 31692, using available port 3001 instead.`

Evidencia de recuperación:

- el servidor de desarrollo quedó respondiendo en `http://localhost:3000`
- las rutas públicas y privadas volvieron a responder correctamente

## Causa raíz

Categoría principal:

- `K. Error of Windows/OneDrive/.next lock`

Causa concreta:

- un proceso Node previo estaba ocupando `3000`, haciendo que `npm run dev` se desplazara a `3001`
- esto daba la impresión de que la web estaba caída cuando en realidad el runtime seguía vivo en otro proceso/puerto

Observación secundaria de auth:

- al probar `Better Auth` por API directa sin `Origin`, el endpoint devolvió `403` con `MISSING_OR_NULL_ORIGIN`
- eso no rompía el runtime, pero sí invalidaba el smoke test si se hacía sin encabezados de navegador

## Fix aplicado

Acción operativa:

- se cerró el estado de diagnóstico
- se dejó un único runtime estable respondiendo en `localhost:3000`
- se validó que el dashboard, la landing y `/shiftreadiness` respondieran con sesión y sin sesión según correspondía

No hubo cambios de producto.
No hubo cambios de schema.
No hubo reset de Prisma.
No hubo borrado de datos.

## Validaciones

### Build y calidad

- `npm run lint`: OK
- `npm run typecheck`: OK
- `npm run build`: OK
- `npx prisma validate`: OK
- `npx prisma generate`: OK

### Runtime

- `/`: OK
- `/shiftreadiness`: OK
- `/sign-in`: OK
- `/dashboard`: redirige sin sesión y responde con sesión
- `/dashboard/assessments`: responde con sesión
- `/dashboard/assessments/[id]`: responde con sesión

### Auth smoke test

- signup con `Origin` válido: OK
- cookie de sesión emitida: OK
- dashboard protegido: OK

## Qué quedó pendiente

- parser RVTools no se cambió
- no hubo refactor de runtime
- no se modificó el flujo de upload/download
- no se tocó la landing
- no se tocó `/shiftreadiness`

## Rollback

Si vuelve a aparecer el síntoma:

1. revisar qué proceso ocupa `3000`
2. cerrar el proceso Node previo
3. volver a levantar `npm run dev`
4. volver a validar rutas públicas y dashboard

## Recomendación antes del Hito 5

- mantener una rutina de arranque limpia para evitar procesos huérfanos en `3000`
- si se repite el síntoma en Windows/OneDrive, limpiar `.next` y reiniciar el runtime antes de asumir un bug de aplicación
- validar siempre auth con `Origin: http://localhost:3000` para no confundir un rechazo de Better Auth con una caída de la app

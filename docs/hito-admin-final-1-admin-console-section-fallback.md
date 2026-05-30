# HITO ADMIN-FINAL-1 — Admin Console Section-Level Fallback

## Objetivo

Corregir el comportamiento de `/dashboard/admin` para que una falla en una query o métrica opcional no degrade toda la consola admin.

## Contexto

Storage/Ceph ya fue cerrado operativamente en producción con migraciones aplicadas y smoke autenticado confirmado por el usuario. El fallback global de la consola admin todavía mostraba un mensaje desactualizado que indicaba que las métricas Storage/Ceph no estaban disponibles hasta aplicar migraciones Storage.

## Causa

`src/app/dashboard/admin/page.tsx` llamaba a `getAdminConsoleData` dentro de un único `catch`. A su vez, `src/server/admin/adminConsoleService.ts` cargaba múltiples secciones administrativas en un único flujo. Si fallaba una sección opcional, la página completa terminaba en fallback global.

Riesgo observado:

- una query de usuarios, evaluaciones, IA, oportunidades, auditoría o runtime podía tumbar todo `/dashboard/admin`;
- el fallback global ocultaba la sección exacta afectada;
- el copy de Storage/Ceph estaba desactualizado.

## Solución

Se incorporó un patrón de carga por sección:

- `AdminSectionResult<T>`;
- `AdminSectionFailure`;
- `resolveAdminSection`;
- logging sanitizado con `sectionKey` y `errorKey`;
- fallback local por bloque.

La consola conserva su layout principal y recibe `sectionFailures`. La UI muestra un banner de degradación sólo para la pestaña activa cuando una sección relacionada falla.

## Secciones Aisladas

- Métricas principales.
- Usuarios.
- Evaluaciones.
- Auditoría reciente.
- Accesos y planes.
- Oportunidades comerciales.
- Presupuesto IA.
- Auditoría avanzada.
- Configuración operativa.
- Emails de propietarios.
- Estado IA runtime.
- Consumo IA.

## Copy Actualizado

Se eliminó la referencia falsa a migraciones Storage pendientes. El fallback global ahora indica que una o más secciones operativas no pudieron cargar y que se deben revisar logs sanitizados para identificar la sección afectada.

## Archivos Modificados

- `src/server/admin/adminConsoleService.ts`
- `src/app/dashboard/admin/page.tsx`
- `tests/unit/adminConsoleSectionFallback.test.ts`

## Exclusiones Respetadas

- No se modificó schema.
- No se crearon migraciones.
- No se aplicaron migraciones.
- No se tocó DB productiva.
- No se tocaron env vars.
- No se tocó pricing real.
- No se tocó Storage/Ceph engine.
- No se declaró full public launch.

## Estado Admin Final

Resultado objetivo: admin parcial controlado o completo según disponibilidad real de cada query en runtime.

El diseño ya no requiere fallback global por fallas de métricas opcionales. El fallback global queda sólo como última defensa ante una falla catastrófica no aislable.

## Riesgos Pendientes

- Validación autenticada real de `/dashboard/admin` en producción.
- Si una sección específica sigue fallando, revisar `sectionKey` y `errorKey` en logs.
- Admin principal puede quedar parcial controlado si una métrica opcional falla en runtime.
- Full public launch sigue no declarado.

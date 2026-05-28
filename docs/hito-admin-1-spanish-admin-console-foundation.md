# HITO ADMIN-1 - Spanish Admin Console Foundation

Fecha: 2026-05-27.

## Objetivo

Crear la primera consola interna de administracion para ShiftReadiness, en espanol, usando el mismo login del producto y sin exponer secretos ni cambiar schema de base de datos.

## Estado heredado

- Production launched: SI, controlled production launch.
- Limited public beta: SI.
- Full public launch: NO.
- Gemini AI Advisory real: activo en produccion por hitos previos.
- OpenAI: NO activo.
- AI runtime status existente: `src/server/ai/aiRuntimeStatus.ts`.
- Endpoint admin AI status existente: `GET /api/admin/ai/status`.

## Acceso

Ruta principal:

- `/dashboard/admin`

Ruta admin existente preservada:

- `/dashboard/admin/unlock-requests`

Reglas:

- Usuario no autenticado: redirect a `/sign-in`.
- Usuario autenticado sin permisos admin: pantalla en espanol con el mensaje `No tenes permisos para acceder a esta consola.`
- Usuario admin: puede ver la consola.
- Clientes normales no ven el link admin en el dashboard.

## Criterio admin

ADMIN-1 usa el criterio existente:

- `ADMIN_EMAILS`.

No se agrego rol nuevo en DB y no se hizo migracion Prisma.

## Vistas creadas

La ruta `/dashboard/admin` implementa tabs internas:

- Resumen.
- Estado del Sistema.
- Usuarios.
- Evaluaciones.
- IA y Consumo.
- Configuracion.
- Auditoria.

Tambien deja acceso a la cola existente de solicitudes manuales de desbloqueo.

## Centro Operativo

La consola muestra luces operativas para:

- Sistema general.
- Base de datos.
- Autenticacion.
- Storage privado.
- Uploads.
- Parser / Evidence.
- Report preview.
- PDF.
- IA Advisory.
- Email.
- Produccion Hostinger.

Estados visibles:

- Operativo.
- Atencion.
- Degradado.
- Critico.
- Desconocido.
- No configurado.

Cada card incluye descripcion y accion recomendada.

## IA y consumo

La seccion IA y Consumo reutiliza el runtime status seguro:

- IA activa.
- Proveedor.
- Modelo.
- Gemini API Key configurada/no configurada.
- OpenAI API Key configurada/no configurada.
- Ultimo estado.
- Ultimo error.
- Fallback disponible.
- Secretos expuestos.
- Archivos crudos enviados.
- Metricas en memoria.

Limitacion:

- Consumo detallado, costos estimados, presupuesto mensual y consumo por usuario/assessment quedan para ADMIN-2.

ADMIN-2A update:

- La consola ahora muestra metricas IA en memoria, eventos recientes, duracion ultima/promedio, alertas operativas y placeholders claros para tokens/costos persistentes.
- No se agrego DB schema ni migracion.
- La persistencia de consumo queda para ADMIN-2B.

## Configuracion segura

La consola muestra solamente estados seguros:

- Variables secretas: `Configurada` / `No configurada`.
- Valores visibles solo para variables no secretas.

Nunca muestra:

- `DATABASE_URL`.
- `DIRECT_URL`.
- `BETTER_AUTH_SECRET`.
- `GEMINI_API_KEY`.
- `OPENAI_API_KEY`.
- Cookies.
- Tokens.
- Storage paths privados completos.

## Usuarios

Vista read-only con:

- Usuario.
- Email.
- Fecha de alta.
- Ultimo acceso.
- Rol.
- Estado.
- Evaluaciones.
- Plan.
- Acciones informativas.

No se implemento bloqueo/desbloqueo ni impersonation.

## Evaluaciones

Vista read-only con:

- Assessment.
- Cliente/usuario.
- Estado.
- Evidencia.
- Contexto.
- PDF.
- IA.
- Readiness.
- Confidence.
- Actualizado.
- Acciones para ver detalle o reporte.

## Auditoria y errores

Si existen eventos persistidos, se muestran los ultimos eventos disponibles.

Si no hay eventos, la consola muestra un placeholder honesto:

- Auditoria persistente pendiente o sin eventos recientes.

Consola avanzada de errores queda para ADMIN-2.

## Cola de unlock requests

La vista existente `/dashboard/admin/unlock-requests` fue alineada al ADMIN-1:

- Textos visibles en espanol.
- Acciones administrativas traducidas.
- Errores conocidos traducidos.
- Flujo manual de approve/fulfill/reject/cancel preservado.

## Seguridad

- No se agrego DB schema.
- No se ejecuto Prisma reset.
- No se tocaron env vars ni Hostinger config.
- No se activo OpenAI.
- No se exponen secrets.
- No se exponen raw files.
- No se exponen storage paths privados.
- Endpoints admin existentes siguen protegidos server-side.

## Validaciones

Validaciones requeridas para cierre:

- `npm run hostinger:diagnose`.
- `npm run ai:guardrails`.
- `npm run typecheck`.
- `npm run lint`.
- `npm run build`.

Validacion funcional esperada:

- `/dashboard/admin` sin sesion redirige a `/sign-in`.
- Usuario no admin ve acceso denegado en espanol.
- Admin ve consola.
- Link admin solo aparece para admin.
- Configuracion segura no muestra secrets.

## Limitaciones

- ADMIN-2B agrega persistencia de eventos IA, tokens/costos estimados y consumo por usuario/evaluacion.
- No hay acciones destructivas sobre usuarios o assessments.
- No hay impersonation.
- No hay billing automatico.
- Full public launch sigue NO.

## Decision

ADMIN-1 deja una base funcional para operacion interna:

- Consola admin en espanol: SI.
- Centro Operativo: SI.
- Estado IA Gemini: SI.
- Config health seguro: SI.
- Usuarios/assessments read-only: SI.
- Ready for ADMIN-2: SI.
- Ready for full public launch: NO.

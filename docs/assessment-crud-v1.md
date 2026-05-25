# Assessment CRUD v1

## Objetivo
Definir la primera version funcional del CRUD de assessments dentro de ShiftReadiness.

## Rutas
- `/dashboard/assessments`
- `/dashboard/assessments/new`
- `/dashboard/assessments/[id]`

## Crear
- Se crea un draft assessment.
- `Cost / Risk Engine` queda incluido por defecto.
- `Storage Destination Readiness` puede quedar activo o no.
- Se registra `assessment_created`.

## Listar
- La lista se filtra por el workspace actual.
- Se excluyen assessments archivados.
- Se muestran estado, storage, plan y preview si existe.

## Ver detalle
- El detail page muestra overview, intake, assumptions, preview, storage y completion.
- El acceso esta protegido por session y ownership.

## Editar
- La edicion se realiza inline en el detail page.
- Se puede editar:
  - title
  - client/company label
  - infraestructura manual
  - cost/risk assumptions
  - storage enabled state

## Archivar
- Se implemento archive suave.
- El assessment cambia a `archived` y recibe `archivedAt`.
- No se borra data historica.

## Ownership
- Un assessment solo es accesible si pertenece a un workspace donde el usuario es miembro.
- El helper `ensureAssessmentOwnership` aplica este control.

## Estados
- `draft`
- `uploaded`
- `processing`
- `completed`
- `failed`
- `archived`

## Errores
- Si el usuario no tiene session, se redirige a `/sign-in`.
- Si el assessment no existe o no pertenece al usuario, se responde con 404 o bloqueo de ownership.

# Production Smoke Test Checklist v1

## Public pages
- `/` responde 200.
- `/shiftreadiness` responde 200.
- `/sign-in` responde 200.
- `/sign-up` responde 200.

## Auth
- Sign-up funciona con usuario ficticio.
- Sign-in funciona.
- Sign-out funciona.
- `/dashboard` redirige si no hay sesion.

## Assessments
- `/dashboard/assessments` carga.
- Crear assessment ficticio.
- Abrir `/dashboard/assessments/[id]`.
- Abrir `/dashboard/assessments/[id]/report`.

## Evidence
- Subir CSV/RVTools ficticio.
- Confirmar metadata en Neon.
- Descargar evidencia.
- Soft-delete evidencia.
- Confirmar download posterior devuelve 404/denied.

## Parser/Risk
- Parse RVTools con archivo ficticio.
- Generate risk insights.
- Confirmar Risk Overview y VM matrix.

## Reports/PDF
- Generate PDF Preview.
- Confirmar Report record.
- Confirmar PDF en storage persistente.
- Descargar PDF.
- Soft-delete PDF.
- Confirmar download posterior falla seguro.

## Admin/unlock
- Sin sesion: admin redirige o bloquea.
- No-admin: admin deniega acceso.
- Admin en `ADMIN_EMAILS`: admin carga.
- Crear unlock request.
- Approve.
- Fulfill.
- Confirmar entitlement.
- Confirmar commercial status.

## No payment
- No checkout visible.
- No payment successful.
- No invoice generated.

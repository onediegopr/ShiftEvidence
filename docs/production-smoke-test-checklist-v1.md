# Production Smoke Test Checklist v1

## Status
- Local pre-deploy checks: passed on 2026-05-26.
- Real Hostinger execution: pending.
- Hito 9.2 was stopped at initial audit because real Hostinger access details and a clean readiness gate were not available.
- Do not mark production smoke as passed until a real HTTPS Hostinger domain, production env vars, persistent storage, migrations, runtime logs and functional flows are verified.
- Complete `docs/hostinger-production-access-gate.md` before reattempting Hito 9.2.

## Hostinger prerequisites
- Production domain available.
- Hostinger app root known.
- Node.js runtime supports the project engine requirement.
- Runtime logs are accessible.
- App restart control is available.
- `DATABASE_URL` points to the intended Neon database.
- `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` are HTTPS production URLs, not localhost.
- `HOSTINGER_STORAGE_ROOT` is absolute, private and persistent.
- `ADMIN_EMAILS` includes the real admin test email.
- `npx prisma migrate deploy` is used in production, not `migrate dev`.

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

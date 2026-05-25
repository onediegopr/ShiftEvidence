# Hito 8 - Manual Payment / Unlock Flow

## Objetivo
Implementar un flujo comercial manual para pedir, revisar y conceder desbloqueos sin checkout automático.

## Alcance
- Unlock requests persistidas en Neon.
- Estado pending / approved / rejected / fulfilled / cancelled.
- Mini admin interno protegido por `ADMIN_EMAILS`.
- Entitlements manuales por assessment.
- Commercial status visible en assessment y report preview.
- PDF behavior alineado con el unlock manual.
- AuditEvents y UpgradeEvents.

## Avance
- Antes del hito: 86%
- Despues del hito: 91%
- Hito actual: 100%
- Justificacion: el usuario puede pedir unlock, ver pending review, y un admin autorizado puede aprobar y conceder el entitlement.

## Flujo de usuario
1. El usuario abre `/dashboard/assessments/[id]/report`.
2. Click en un CTA de upgrade.
3. Se crea un `UnlockRequest`.
4. La UI muestra `Pending manual review`.
5. El usuario ve el estado comercial en el report preview y en el assessment detail.

## Flujo de admin
1. Un usuario incluido en `ADMIN_EMAILS` entra a `/dashboard/admin/unlock-requests`.
2. Revisa las solicitudes pendientes.
3. Aprueba, rechaza o marca como fulfilled manualmente.
4. Al fulfilled se conceden entitlements de forma idempotente.

## Modelos
- `UnlockRequest`
- `AssessmentEntitlement` existente, reutilizado para el grant manual
- `AuditEvent`
- `UpgradeEvent`

## Smoke tests
- Unlock request pending creado.
- Unlock manual aprobado y fulfilled.
- Entitlement concedido.
- PDF readiness report generado tras unlock.
- Download seguro y soft-delete siguen funcionando.

## Riesgos
- Admin mal configurado si `ADMIN_EMAILS` queda vacío.
- Entitlements inconsistentes si se aprueban requests repetidas sin idempotencia.
- Confundir preview preliminar con reporte final.

## Rollback
- Revertir `UnlockRequest`.
- Retirar el admin interno.
- Revertir el mapping de entitlements.
- Mantener report preview y PDF preview si el flow comercial necesita rehacerse.

## Proximo hito
- `HITO 9 - Stripe / MercadoPago Checkout` o `HITO 8.1 - Unlock hardening` si hiciera falta.

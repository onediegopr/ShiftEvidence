# Auth, Dashboard and Assessment Shell

## Rutas publicas
- `/`
- `/shiftreadiness`
- `/contact`

## Rutas auth
- `/sign-in`
- `/sign-up`

## Ruta privada
- `/dashboard`

## Shell de assessments
- `/dashboard/assessments`
- `/dashboard/assessments/new`
- `/dashboard/assessments/[id]`

## Estado funcional
- Sign-in y sign-up estan implementados con Better Auth client.
- Dashboard esta protegido por session check en layout.
- Existe un shell de assessment con formulario y server action.
- Existe service layer para workspace, user profile y assessments.

## Lo que queda como placeholder o pendiente
- No hay upload RVTools.
- No hay parser RVTools.
- No hay scoring real de Cost/Risk.
- No hay storage analytics real.
- No hay pagos ni upgrades efectivos.

## Comportamiento de assessment shell
- Crea un draft inicial cuando la base real esta disponible.
- Marca Cost / Risk Engine como incluido.
- Storage Destination Readiness queda como opcional.
- Crea entitlements y eventos de auditoria basicos.

## Proteccion
- Si no existe session, `/dashboard` redirige a `/sign-in`.
- La ruta de creacion de assessment usa server action y vuelve al detalle del assessment creado.


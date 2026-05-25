# Local Storage Security v1

## Objetivo
Guardar archivos de evidencia en almacenamiento local privado sin exponer rutas reales ni usar storage publico.

## Root configurable
- `HOSTINGER_STORAGE_ROOT`
- Fallback de desarrollo: `./storage`

## Estructura
`storage/users/{userId}/workspaces/{workspaceId}/assessments/{assessmentId}/uploads/{evidenceType}/`

## Reglas de seguridad
- No guardar en `public`.
- No guardar en `.next`.
- No guardar en `node_modules`.
- No usar filename original como nombre final.
- No aceptar paths de usuario.
- No permitir path traversal.
- Verificar que el path final quede dentro del root.

## Naming
- `evidenceType_timestamp_baseName_randomSuffix.extension`
- El nombre original se preserva solo como metadata.

## Hashing
- SHA-256 calculado al guardar.
- El hash se persiste en Neon para auditoria y futura verificacion.

## Permisos y despliegue
- El storage local debe apuntar a una carpeta persistente en Hostinger en produccion.
- En desarrollo puede usarse `./storage`.
- No asumir filesystem efimero.

## Backups
- Definir backup/retention cuando se pase a produccion.
- No mezclar backups con el directorio de build.

## Riesgos
- Bloqueos de archivos en Windows/OneDrive durante rebuilds.
- Crecimiento del volumen si no hay retention.
- Permisos de filesystem incorrectos en deploy.

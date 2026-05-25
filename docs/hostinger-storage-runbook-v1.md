# Hostinger Storage Runbook v1

## Objetivo
Preparar un directorio persistente para almacenamiento privado de evidencias en Hostinger Node.js.

## Variables
- `HOSTINGER_STORAGE_ROOT=./storage` en desarrollo.
- En produccion debe apuntar a una carpeta persistente fuera del build y fuera de `public`.

## Recomendaciones
- Crear una ruta dedicada para uploads persistentes.
- No usar el directorio de build.
- No usar `public`.
- No usar carpetas temporales del sistema para datos permanentes.

## Validacion
- Comprobar permisos de escritura.
- Comprobar permisos de lectura para download.
- Comprobar que el proceso Node pueda crear subdirectorios.

## Backups
- Definir backup incremental de la carpeta de storage.
- Separar backups de los archivos activos.

## Troubleshooting
- `EPERM` en Windows/OneDrive suele requerir detener Node y borrar `.next` antes de reconstruir.
- Si el root no existe, el servicio debe crear la carpeta.
- Si el path no es persistente, los uploads se perderan en deploy.

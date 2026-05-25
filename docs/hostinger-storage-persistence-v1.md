# Hostinger Storage Persistence v1

## Root path
Usar una carpeta fuera del directorio reemplazado en deploy:

```bash
/home/<hostinger-user>/shiftreadiness-storage
```

Configurar:

```env
HOSTINGER_STORAGE_ROOT=/home/<hostinger-user>/shiftreadiness-storage
```

## Generated structure
La app genera rutas relativas internas bajo:

```text
users/
  <userId>/
    workspaces/
      <workspaceId>/
        assessments/
          <assessmentId>/
            uploads/
            reports/
```

## Forbidden locations
- Nunca `/public`.
- Nunca `.next`.
- Nunca `node_modules`.
- Nunca carpeta temporal.
- Nunca carpeta que se borra al subir un build.

## Permission smoke
Ejecutar:

```bash
npm run storage:check
```

El check:
- crea carpeta si hace falta;
- escribe archivo temporal;
- lee archivo temporal;
- borra archivo temporal.

## Backups
- Backup periodico de storage.
- Backup/PITR de Neon separado.
- Mantener DB y storage sincronizados para que `relativePath` siga resolviendo.

## Restore
1. Restaurar Neon.
2. Restaurar carpeta storage con misma estructura.
3. Validar `npm run storage:check`.
4. Descargar una evidencia y un PDF de prueba.

# Prisma Neon Production Migrations v1

## Local/dev
Permitido:

```bash
npx prisma validate
npx prisma generate
npx prisma migrate dev
npx prisma migrate status
```

## Production/Hostinger
Usar:

```bash
npx prisma generate
npx prisma migrate deploy
```

No usar en produccion:

```bash
npx prisma migrate dev
npx prisma migrate reset
npx prisma db push --force-reset
```

## Current status
El smoke local contra Neon reporto:
- 7 migraciones encontradas.
- Database schema up to date.

## Rollback DB
- Preferir Neon point-in-time restore.
- No borrar tablas manualmente.
- Si una migracion productiva falla, detener deploy y restaurar desde backup/PITR.

## Operational notes
- Ejecutar `migrate status` antes de `migrate deploy`.
- Guardar logs de deploy sin secretos.
- Alinear version Prisma CLI y Client.

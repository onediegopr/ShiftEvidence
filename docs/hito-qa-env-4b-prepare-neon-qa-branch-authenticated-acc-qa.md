# HITO QA-ENV-4B - Prepare Neon QA Branch for Authenticated ACC QA

## 1. Objetivo

Preparar el camino para usar una branch/base Neon explicitamente QA/staging como entorno aislado para QA autenticada real del Assessment Completion Center, sin tocar produccion ni la DB actual remote-managed.

## 2. Estado Git

- Branch: `main`
- HEAD inicial: `0b440bf`
- Ahead/behind inicial: `main...origin/main [ahead 12]`
- Working tree inicial: limpio
- Stash: preservado, no aplicado
- Push realizado: NO
- Production deploy: NO
- Production launched: NO

## 3. Estado `.env.qa.local`

- Existe: SI
- Commiteado: NO
- Ignorado por Git: SI, por regla `*.local`
- Contenido impreso: NO
- `DATABASE_URL` classification: `local`
- `DIRECT_URL` classification: `missing`
- Neon QA/staging configurado: NO

Conclusion: `.env.qa.local` sigue preparado para DB local dummy, no para Neon QA/staging.

## 4. Estado `.qa-storage`

- Existe: SI
- Commiteado: NO
- Ignorado por Git: SI, por regla `.qa-storage/`
- Classification: `local-qa`
- Produccion/storage remoto tocado: NO

## 5. Clasificacion de DB

- `.env.local` `DATABASE_URL`: `neon-unknown` / remote-managed no confirmado como QA.
- `.env.qa.local` `DATABASE_URL`: `local`.
- `.env.qa.local` `DIRECT_URL`: `missing`.
- QA/staging confirmado: NO
- Branch/database identificada: NO
- Produccion tocada: NO

La DB actual de `.env.local` no se usa para QA porque no esta confirmada como QA/staging.

## 6. Migraciones QA

- Migraciones aplicadas a Neon QA: NO
- Target: ninguno
- Motivo: no hay `neon-qa-confirmed` ni `neon-staging-confirmed` en `.env.qa.local`.
- `npx prisma migrate deploy`: NO ejecutado contra Neon.
- `npx prisma migrate reset`: NO ejecutado.
- DB remota/produccion tocada: NO

Validacion QA local/config:

- `npx prisma validate` cargando `.env.qa.local`: OK
- `npx prisma generate` cargando `.env.qa.local`: OK

Nota: estas validaciones no aplican migraciones ni crean datos.

## 7. Pasos Para Crear Branch Neon QA

El usuario debe realizar estos pasos en Neon Console o mediante flujo aprobado equivalente:

1. Entrar a Neon Console.
2. Seleccionar el proyecto correcto de ShiftReadiness / InfraShift.
3. Crear una branch nueva con nombre claro, por ejemplo:

```txt
shiftreadiness-qa
```

o:

```txt
qa-hardening-acc
```

4. Crear o seleccionar una database QA dentro de esa branch.
5. Copiar connection string pooled para runtime si ese es el patron del proyecto.
6. Copiar connection string directo/unpooled para migraciones si Neon/Prisma lo requiere.
7. Editar `.env.qa.local` localmente, sin commitearlo:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
BETTER_AUTH_SECRET="qa-local-secret-change-me"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
HOSTINGER_STORAGE_ROOT="./.qa-storage"
MAX_UPLOAD_SIZE_MB="50"
ADMIN_EMAILS="qa-admin@example.com"
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

8. Verificar nuevamente que `.env.qa.local` clasifique como `neon-qa-confirmed` o `neon-staging-confirmed`.
9. Solo entonces aplicar migraciones QA.

## 8. Comandos Seguros Para Migrar Solo QA

Usar estos comandos solo despues de confirmar que `.env.qa.local` apunta a una branch Neon QA/staging claramente identificada:

```powershell
$envLines = Get-Content .env.qa.local | Where-Object { $_ -match '^\s*[A-Z0-9_]+\s*=' }
foreach ($line in $envLines) {
  $idx = $line.IndexOf('=')
  if ($idx -gt 0) {
    $key = $line.Substring(0, $idx).Trim()
    $value = $line.Substring($idx + 1).Trim().Trim('"').Trim("'")
    [Environment]::SetEnvironmentVariable($key, $value, 'Process')
  }
}

npx prisma validate
npx prisma generate
npx prisma migrate deploy
```

No ejecutar este flujo si la clasificacion es `neon-unknown`, `remote-managed-unknown`, `local` o `missing`.

No usar `.env.local` para QA.

## 9. Datos QA

- Usuario QA creado: NO
- Assessment QA creado: NO
- Evidence QA creada: NO
- QA data created: NO
- Remote production DB touched: NO

La creacion de usuario QA, assessment QA, evidencia y PDF queda para `ACC-AUTH-QA-2`, despues de confirmar y migrar la branch QA.

## 10. Validaciones Tecnicas

- `npm run test:run`: OK, 13 archivos / 56 tests.
- `npm run lint`: OK, con 10 warnings preexistentes de `<img>`.
- `npm run typecheck`: OK.
- `npm run build`: OK, con warning NFT/Turbopack conocido.
- `npm run hostinger:diagnose`: OK.
- `npx prisma validate`: OK.
- `npx prisma generate`: OK.
- `npx prisma validate` con `.env.qa.local`: OK.
- `npx prisma generate` con `.env.qa.local`: OK.

## 11. Riesgos Pendientes

- Falta crear/configurar branch Neon QA.
- Falta cargar `DATABASE_URL`/`DIRECT_URL` QA en `.env.qa.local`.
- Falta aplicar migraciones a QA.
- Falta crear usuario QA.
- Falta ejecutar QA autenticada real del ACC.
- Storage QA existe, pero no fue probado con upload real.

## 12. Proximo Hito Recomendado

Si el usuario crea y carga la branch Neon QA:

- `QA-ENV-5 - Apply migrations to confirmed Neon QA branch`

Despues:

- `ACC-AUTH-QA-2 - Authenticated QA Against Isolated QA Database`

## 13. Confirmaciones

- `.env.local modified: NO`
- `.env.qa.local committed: NO`
- `.qa-storage committed: NO`
- `Production DB touched: NO`
- `QA data created: NO`
- `Push realizado: NO`
- `Production deploy: NO`
- `Production launched: NO`

# HITO QA-ENV-2 - Create Isolated Local QA Database and Seed Account

## 1. Objetivo

Preparar un entorno QA local/aislado para ejecutar QA autenticada real del Assessment Completion Center sin tocar la DB remota/gestionada actual, sin modificar `.env.local`, sin crear datos en remoto y sin desplegar.

## 2. Estado Git

- Branch: `main`
- HEAD inicial: `644cc0c`
- Ahead/behind inicial: `main...origin/main [ahead 10]`
- Working tree inicial: limpio
- Stash: preservado, no aplicado
- Push realizado: NO
- Production deploy: NO
- Production launched: NO

## 3. Estado Postgres Local

- `psql`: no disponible en PATH.
- `createdb`: no disponible en PATH.
- Docker: no disponible en PATH.
- Resultado: no hay mecanismo local disponible desde este entorno para crear o validar una DB PostgreSQL local.

## 4. DB QA Local

- DB esperada: `shiftreadiness_qa`
- DB local creada: NO
- Motivo: no hay `psql`, `createdb` ni Docker disponibles en el entorno actual.
- Clasificacion de `DATABASE_URL` actual en `.env.local`: `remote-managed`
- Clasificacion de `DATABASE_URL` en `.env.qa.local`: `local`
- DB segura para escribir datos QA: NO, hasta que el usuario instale/exponga Postgres local o confirme una DB QA/staging aislada.

## 5. `.env.qa.local`

- Archivo creado localmente: SI
- Archivo commiteado: NO
- Ignorado por Git: SI, por regla `*.local`
- Contiene secretos reales: NO
- Proposito: servir como configuracion local QA aislada para `ACC-AUTH-QA-2`.
- `.env.local` modificado: NO

Variables incluidas en `.env.qa.local`:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `HOSTINGER_STORAGE_ROOT`
- `MAX_UPLOAD_SIZE_MB`
- `ADMIN_EMAILS`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## 6. Storage QA

- Carpeta creada localmente: `.qa-storage`
- Commiteada: NO
- Ignorada por Git: SI, se agrego `.qa-storage/` a `.gitignore`
- Clasificacion: `local-path-like`
- Proposito: aislar archivos QA de storage productivo/remoto.

## 7. Migraciones QA

- Migraciones QA aplicadas: NO
- Clasificacion de DB destino para migraciones: local planificada, no disponible
- Produccion tocada: NO
- DB remota tocada: NO
- Motivo: no se ejecutan migraciones sin una DB local/QA confirmada.

Cuando Postgres local este disponible, el flujo recomendado es:

```powershell
createdb shiftreadiness_qa

$envLines = Get-Content .env.qa.local | Where-Object { $_ -match '^\s*[A-Z0-9_]+\s*=' }
foreach ($line in $envLines) {
  $idx = $line.IndexOf('=')
  if ($idx -gt 0) {
    $key = $line.Substring(0, $idx).Trim()
    $value = $line.Substring($idx + 1).Trim().Trim('"').Trim("'")
    [Environment]::SetEnvironmentVariable($key, $value, 'Process')
  }
}

npx prisma migrate dev
npx prisma validate
npx prisma generate
```

No usar este flujo contra DB remota o produccion.

## 8. Usuario QA

- Usuario QA creado: NO
- Assessment QA creado: NO
- Evidence QA creada: NO
- QA data created in remote DB: NO
- Motivo: el usuario QA debe crearse en `ACC-AUTH-QA-2` por UI/sign-up local una vez que `shiftreadiness_qa` exista y las migraciones esten aplicadas contra esa DB local.

## 9. Fixtures Disponibles

- RVTools-like XLSX sintetico: `qa-artifacts/hito-10-2-3-rvtools-mapping-review/evidence/rvtools-like-sample.xlsx`
- CSV sintetico de upload gate: `qa-artifacts/hito-12-0-8-browser-upload-gate-e2e/evidence/browser-upload-gate-sample.csv`
- Binarios nuevos agregados: NO
- Datos sensibles reales usados: NO

## 10. Scripts / Soporte Existente

- Prisma migrations: existen en `prisma/migrations`.
- Seed oficial: no hay `prisma/seed.*` ni script oficial de seed en `package.json`.
- Script QA parser: existe `scripts/qa-rvtools-parser-p0.mjs`.
- Script oficial para crear usuario QA: NO.
- Recomendacion: crear usuario QA mediante flujo local de sign-up en `ACC-AUTH-QA-2`, no por escritura directa hasta tener un script dedicado y seguro.

## 11. Validaciones Ejecutadas

- `npm run test:run`: OK, 13 archivos / 56 tests.
- `npm run lint`: OK, con 10 warnings preexistentes de `<img>`.
- `npm run typecheck`: OK.
- `npm run build`: OK, con warning NFT/Turbopack conocido.
- `npm run hostinger:diagnose`: OK.
- `npx prisma validate`: OK.
- `npx prisma generate`: OK.

Notas:

- `hostinger:diagnose` no imprime secretos y no conecta a DB.
- `prisma validate/generate` se ejecutaron sin imprimir valores secretos.
- No se ejecuto `prisma migrate dev` porque no hay DB QA local disponible.
- No se ejecuto `prisma migrate deploy`.

## 12. Pasos Restantes Para ACC-AUTH-QA-2

1. Instalar o exponer Postgres local.
2. Crear DB local `shiftreadiness_qa`.
3. Confirmar que `.env.qa.local` apunta a esa DB local.
4. Aplicar migraciones con variables cargadas desde `.env.qa.local`.
5. Ejecutar `npx prisma validate` y `npx prisma generate` contra el entorno QA.
6. Levantar la app usando el entorno QA local.
7. Crear usuario QA por sign-up local.
8. Crear assessment QA.
9. Subir fixture RVTools-like sintetico.
10. Ejecutar `ACC-AUTH-QA-2`.

## 13. Riesgos Pendientes

- Postgres local no esta disponible todavia.
- DB `shiftreadiness_qa` no existe todavia.
- No hay seed/script oficial de usuario QA.
- Storage QA esta preparado localmente, pero no probado con upload real.
- Acceptance autenticada del ACC sigue pendiente.

## 14. Confirmaciones

- `.env.local modified: NO`
- `.env.qa.local committed: NO`
- `QA data created in remote DB: NO`
- `Production touched: NO`
- `Push realizado: NO`
- `Production deploy: NO`
- `Production launched: NO`

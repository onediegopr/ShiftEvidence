# HITO QA-ENV-3 - Local Postgres Availability & QA DB Creation

## 1. Objetivo

Verificar si hay PostgreSQL local disponible para crear la DB aislada `shiftreadiness_qa` y dejar listo el entorno para QA autenticada real sin tocar la DB remota/gestionada ni produccion.

## 2. Estado Git

- Branch: `main`
- HEAD inicial: `a1c2bf8`
- Ahead/behind inicial: `main...origin/main [ahead 11]`
- Working tree inicial: limpio
- Stash: preservado, no aplicado
- Push realizado: NO
- Production deploy: NO
- Production launched: NO

## 3. Herramientas Detectadas

- `psql`: NO disponible en PATH.
- `createdb`: NO disponible en PATH.
- Docker: NO disponible en PATH.
- Servicio PostgreSQL: existe `PostgreSQL_For_Odoo - PostgreSQL Server 12`, pero esta detenido.
- Puerto `localhost:5432`: no acepta conexiones TCP.
- Binarios Odoo revisados: `pg_ctl.exe` existe, pero `psql.exe` y `createdb.exe` no estan disponibles en el path de Odoo revisado.

Conclusion: no hay una instancia PostgreSQL local dedicada y utilizable para crear `shiftreadiness_qa` desde este entorno.

## 4. DB Local

- DB objetivo: `shiftreadiness_qa`
- DB creada: NO
- Motivo: faltan `psql`/`createdb` y no hay servicio PostgreSQL dedicado corriendo en `localhost:5432`.
- Servicio Odoo usado para QA: NO
- Motivo para no usar Odoo: es un servicio local de otra aplicacion, esta detenido y no es una instancia aislada del proyecto. Usarlo requeriria autorizacion explicita.

## 5. Migraciones QA

- Migraciones QA aplicadas: NO
- Target classification: `local` planificado por `.env.qa.local`, pero DB local no disponible.
- `prisma migrate deploy`: NO ejecutado.
- `prisma migrate dev`: NO ejecutado.
- Produccion tocada: NO
- DB remota tocada: NO

## 6. `.env.qa.local`

- Existe: SI
- Commiteado: NO
- Ignorado por Git: SI, por regla `*.local`
- Clasificacion de `DATABASE_URL`: `local`
- Contiene secretos reales: NO

Se valido Prisma cargando `.env.qa.local` solo al proceso:

- `npx prisma validate`: OK
- `npx prisma generate`: OK

Nota: esto valida schema/configuracion de Prisma, pero no crea DB ni aplica migraciones.

## 7. `.env.local`

- Existe: SI
- Modificado: NO
- Impreso: NO
- Clasificacion de `DATABASE_URL`: `remote-managed`
- Usado para crear datos QA: NO
- Usado para migraciones QA: NO

## 8. `.qa-storage`

- Existe: SI
- Commiteado: NO
- Ignorado por Git: SI, por regla `.qa-storage/`
- Clasificacion: `local-path-like`
- Upload real probado: NO

## 9. Pasos Manuales Para Preparar PostgreSQL Local

Opcion recomendada: instalar PostgreSQL local dedicado para QA.

Checklist:

1. Instalar PostgreSQL para Windows desde el instalador oficial o un metodo equivalente aprobado por el usuario.
2. Asegurar que `psql.exe` y `createdb.exe` queden en PATH.
3. Confirmar disponibilidad:

```powershell
psql --version
createdb --version
```

4. Confirmar que el servicio PostgreSQL dedicado esta corriendo:

```powershell
Get-Service *postgres* -ErrorAction SilentlyContinue
Test-NetConnection -ComputerName localhost -Port 5432
```

5. Crear la DB local QA:

```powershell
createdb -h localhost -p 5432 -U postgres shiftreadiness_qa
```

6. Confirmar que `.env.qa.local` apunta a la DB local QA y no a una DB remota.
7. Cargar variables de `.env.qa.local` solo al proceso y aplicar migraciones:

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

npx prisma migrate deploy
npx prisma validate
npx prisma generate
```

8. No ejecutar estos comandos contra `.env.local` ni contra una DB remota/gestionada.
9. Pasar a `ACC-AUTH-QA-2` para crear usuario QA por UI/sign-up local y ejecutar flujo autenticado real.

## 10. Validaciones Ejecutadas

- `npm run test:run`: OK, 13 archivos / 56 tests.
- `npm run lint`: OK, con 10 warnings preexistentes de `<img>`.
- `npm run typecheck`: OK.
- `npm run build`: OK, con warning NFT/Turbopack conocido.
- `npm run hostinger:diagnose`: OK.
- `npx prisma validate`: OK.
- `npx prisma generate`: OK.
- `npx prisma validate` con `.env.qa.local`: OK.
- `npx prisma generate` con `.env.qa.local`: OK.

## 11. Datos QA

- Usuario QA creado: NO
- Assessment QA creado: NO
- Evidence QA creada: NO
- QA data created in remote DB: NO
- Production touched: NO

## 12. Proximo Hito Recomendado

Si el usuario instala/configura PostgreSQL local:

- `QA-ENV-4 - Apply migrations to isolated local QA database`

Luego:

- `ACC-AUTH-QA-2 - Authenticated QA Against Isolated Local QA Database`

Si el usuario prefiere no instalar PostgreSQL local:

- crear una Neon branch QA/staging separada, con autorizacion explicita, y repetir la clasificacion antes de escribir datos.

## 13. Confirmaciones

- `.env.local modified: NO`
- `.env.qa.local committed: NO`
- `QA data created in remote DB: NO`
- `Production touched: NO`
- `Push realizado: NO`
- `Production deploy: NO`
- `Production launched: NO`

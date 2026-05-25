# Hotfix - Web not starting after Hito 9

Fecha: 2026-05-25

## Sintoma
El usuario reporto que ShiftReadiness no levantaba localmente despues del Hito 9.

## Comando que fallaba
No se encontro un comando fallando durante la investigacion.

El estado inicial de puertos/procesos mostro:
- `netstat -ano | findstr :3000`: sin listener.
- `netstat -ano | findstr :3001`: sin listener.
- `tasklist | findstr node`: sin procesos Node.

Esto indica que la web no estaba levantada porque no habia proceso Next activo.

## Error exacto
No hubo stack trace de Next, Prisma, Better Auth o filesystem.

`npm run dev -- -p 3000` levanto correctamente:

```text
> shift-evidence@0.0.0 dev
> next dev -p 3000

Next.js 16.2.6 (Turbopack)
- Local: http://localhost:3000
- Environments: .env.local
Ready
```

`npm run start -- -p 3000` levanto correctamente:

```text
> shift-evidence@0.0.0 start
> next start -p 3000

Next.js 16.2.6
- Local: http://localhost:3000
Ready
```

## Causa raiz
Categoria: proceso/runtime local no iniciado.

No se confirmo fallo de build, TypeScript, Prisma, Better Auth, env validation, storage o puerto ocupado.

Factores observados:
- No habia procesos Node activos.
- No habia listener en 3000 ni 3001.
- El repositorio estaba en rebase en curso, pero no bloqueo build/dev/start.
- `.env.local` estaba completo y no tenia `NODE_ENV=production`.

## Fix aplicado
No se aplico hotfix de codigo porque no habia fallo reproducible en codigo.

Acciones operativas:
- Se levanto `npm run dev -- -p 3000`.
- Se valido `npm run start -- -p 3000`.
- Se verificaron rutas con `curl`.
- Se documento el incidente.

## Archivos modificados
- `docs/hotfix-web-not-starting-after-hito-9.md`

## Comandos ejecutados
```bash
git status
node -v
npm -v
npm run lint
npm run typecheck
npx prisma validate
npx prisma generate
npm run build
netstat -ano | findstr :3000
netstat -ano | findstr :3001
tasklist | findstr node
npm run storage:check
npm run deploy:check
npm run dev -- -p 3000
curl.exe -I http://localhost:3000/
curl.exe -I http://localhost:3000/shiftreadiness
curl.exe -I http://localhost:3000/sign-in
curl.exe -I http://localhost:3000/dashboard
npm run start -- -p 3000
```

## Validaciones
- `npm run lint`: OK.
- `npm run typecheck`: OK.
- `npx prisma validate`: OK.
- `npx prisma generate`: OK.
- `npm run build`: OK con warning no bloqueante Turbopack/NFT por tracing filesystem.
- `npm run storage:check`: OK.
- `npm run deploy:check`: OK.
- `npm run dev -- -p 3000`: OK.
- `npm run start -- -p 3000`: OK.

## Smoke final
- `/`: 200.
- `/shiftreadiness`: 200.
- `/sign-in`: 200.
- `/dashboard`: 307 a `/sign-in` sin sesion.
- `/dashboard`: 200 con sesion smoke.
- `/dashboard/assessments`: 200 con sesion smoke.
- `/dashboard/assessments/[id]/report`: 200 con sesion smoke.
- `/dashboard/admin/unlock-requests`: 200 con admin smoke.
- PDF generation: generated.
- PDF download: 200 `application/pdf`.
- PDF download after soft-delete: 404.

## Si vuelve a pasar
1. Revisar si hay proceso escuchando:
   ```bash
   netstat -ano | findstr :3000
   netstat -ano | findstr :3001
   tasklist | findstr node
   ```
2. Si hay proceso viejo, cerrar PID:
   ```bash
   taskkill /PID <PID> /F
   ```
3. Regenerar Prisma si hubo lock:
   ```bash
   npx prisma generate
   ```
4. Levantar dev:
   ```bash
   npm run dev -- -p 3000
   ```
5. Validar rutas con curl.

## Clasificacion
- Puerto: no ocupado inicialmente.
- Env: OK.
- Storage: OK.
- Cache: no se requirio borrar `.next`.
- Prisma: OK.
- Runtime: no habia servidor activo; al iniciarlo, levanto correctamente.

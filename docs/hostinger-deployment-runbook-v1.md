# Hostinger Deployment Runbook v1

## Pre-flight local
Ejecutar:

```bash
npm ci
npm run lint
npm run typecheck
npm run build
npm run deploy:check
npm run storage:check
npx prisma validate
npx prisma generate
npx prisma migrate status
```

No ejecutar en produccion:

```bash
npx prisma migrate dev
npx prisma migrate reset
npx prisma db push --force-reset
```

## Hostinger build
Usar Node.js 22 o superior.

Comandos recomendados:

```bash
npm ci
npx prisma generate
npm run build
npx prisma migrate deploy
npm run start
```

Si Hostinger permite startup command separado:

```bash
npm run start
```

## Runtime
- Next.js debe correr como Node server, no solo static hosting.
- Las rutas `/api/*` requieren runtime Node.
- PDF generation requiere escritura en storage persistente.
- Upload/download requieren lectura/escritura fuera de `.next`.

## Post-deploy
Ejecutar smoke checklist:
- public pages;
- auth;
- dashboard;
- assessment report;
- upload/download;
- PDF generation/download;
- admin route;
- manual unlock.

## No secrets
No imprimir `DATABASE_URL`, `BETTER_AUTH_SECRET` ni emails reales completos en logs o reportes.

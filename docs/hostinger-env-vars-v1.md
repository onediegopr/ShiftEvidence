# Hostinger Environment Variables v1

## Required variables
```env
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
NEXT_PUBLIC_APP_URL=
HOSTINGER_STORAGE_ROOT=
MAX_UPLOAD_SIZE_MB=
ADMIN_EMAILS=
```

## Optional variables
```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Local values
```env
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
HOSTINGER_STORAGE_ROOT=./storage
MAX_UPLOAD_SIZE_MB=50
ADMIN_EMAILS=admin@example.com
```

## Production values
```env
BETTER_AUTH_URL=https://<dominio-real>
NEXT_PUBLIC_APP_URL=https://<dominio-real>
HOSTINGER_STORAGE_ROOT=/home/<hostinger-user>/shiftreadiness-storage
MAX_UPLOAD_SIZE_MB=50
ADMIN_EMAILS=admin@example.com,founder@example.com
```

## Rules
- No usar localhost en produccion.
- `BETTER_AUTH_URL` y `NEXT_PUBLIC_APP_URL` deben usar HTTPS.
- `BETTER_AUTH_SECRET` debe ser largo y aleatorio.
- `DATABASE_URL` debe apuntar a Neon production con SSL.
- `HOSTINGER_STORAGE_ROOT` debe ser absoluto y persistente.
- `ADMIN_EMAILS` no acepta wildcard.

## Check command
```bash
npm run deploy:check
```

Con `NODE_ENV=production`, el check bloquea URLs localhost.

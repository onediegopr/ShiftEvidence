# Production Env Prep 2

Fecha: 2026-06-05

## 1. Objetivo

Preparar la primera capa de entorno Production para el proyecto canonico `shiftevidence`, sin ejecutar cutover, sin modificar DNS, sin cargar secretos y sin habilitar pagos live.

Este hito documenta la auditoria segura y la decision operativa para la siguiente carga controlada de variables. No se cargaron variables nuevas porque el prompt de seguridad bloquea cambios de Production env en este hito y no se entregaron valores de capa 1 para ingresar manualmente.

## 2. Estado inicial

| Area | Estado inicial |
| --- | ---: |
| PRODUCTION-ENV-PREP-2 | 0% |
| Production/cutover readiness | 91% |
| Vercel readiness | 95% |
| Storage/R2 readiness | 97% |
| Billing readiness | 95% |
| Stripe live readiness | 65% |
| Admin ops | 94% |
| PDF/report quality | 98% |
| General technical | 97% |

## 3. Auditoria local

Repositorio:

- Branch actual: `main`.
- HEAD local antes del hito: `8086594978a5c5600900c643f23d1c1798038574`.
- `origin/main`: `8086594978a5c5600900c643f23d1c1798038574`.
- No habia commits locales sin pushear.
- No habia untracked files visibles por `git ls-files --others --exclude-standard`.
- No habia stashes reportados.
- `.env.local` no esta trackeado.
- `.env.r2-smoke.local` no esta trackeado.

Repo Vercel local:

- `.vercel/project.json` sigue linkeado a `infrashift-r2-recovery`.
- No se relinkeo el repo local.
- No se modifico `.vercel/project.json`.

## 4. Proyecto Production canonico

Proyecto auditado: `shiftevidence`.

Metadata no sensible observada:

| Campo | Valor |
| --- | --- |
| Team | `shift-evidence` |
| Project | `shiftevidence` |
| Project ID | `prj_vPebqKyHjmKQgoyvRpugXS6aulpP` |
| Framework | Next.js |
| Root Directory | `.` |
| Node.js Version | 24.x |
| Build Command | default `npm run build` / `next build` |
| Latest observed Production deployment | `shiftevidence-gqyeza3m4-shift-evidence.vercel.app` |
| Latest observed Production status | Ready |

Dominios/aliases observados en Production:

- `https://www.shiftevidence.com`
- `https://shiftevidence.com`
- `https://infra-evidence.vercel.app`
- `https://shiftevidence-shift-evidence.vercel.app`
- `https://shiftevidence-git-main-shift-evidence.vercel.app`

Conclusion:

- `shiftevidence` sigue siendo el proyecto productivo canonico.
- `infrashift-r2-recovery` sigue siendo recovery/Preview/staging tecnico.
- No se tocaron dominios.
- No se tocaron DNS.

## 5. Estado de Production env antes del hito

Auditoria segura:

| Proyecto | Environment | Resultado |
| --- | --- | --- |
| `shiftevidence` | Production | El CLI reporto que existen Environment Variables, pero no expuso nombres ni valores en la salida segura usada. |
| `infrashift-r2-recovery` | Production | El CLI reporto que no hay Environment Variables. |

Decision de seguridad:

- No se ejecuto `vercel env pull`.
- No se imprimieron valores.
- No se descargaron secretos a disco.
- No se intento inferir valores desde dashboard.
- No se modifico ningun Production env.

## 6. Veredicto de carga

Veredicto aplicado: documentar y no cargar variables en este hito.

Motivos:

- El prompt incluye una regla explicita de no hacer cambios de Production env.
- No se proveyeron valores para `BETTER_AUTH_SECRET` ni `ADMIN_EMAILS`.
- `shiftevidence` ya sirve dominios reales, por lo que cualquier carga debe ser controlada y auditable.
- La carga de variables puede requerir redeploy posterior, y el hito prohibe deploy intencional.
- Stripe live, DB prod, R2 prod y Upstash prod siguen bloqueados por hitos especificos.

Categorias cargadas en este hito:

- Ninguna.

## 7. Capa 1 preparada para carga posterior

Variables de App/Auth/Admin que deberian cargarse solo cuando el owner provea o ingrese valores:

| Variable | Tipo | Valor esperado / regla | Estado |
| --- | --- | --- | --- |
| `BETTER_AUTH_SECRET` | Secreto | Generado unico para Production | Pendiente |
| `BETTER_AUTH_URL` | URL no secreta | `https://shiftevidence.com` | Pendiente |
| `NEXT_PUBLIC_APP_URL` | URL publica | `https://shiftevidence.com` | Pendiente |
| `ADMIN_EMAILS` | Allowlist privada | Lista exacta de emails admin | Pendiente |

Notas:

- No usar wildcard.
- No documentar emails privados si no es necesario.
- No imprimir `BETTER_AUTH_SECRET`.
- Si se cargan estas variables en Vercel, registrar solo nombres y estado, nunca valores.

## 8. Billing safe-off preparado para carga posterior

Variables safe-off recomendadas para mantener checkout live bloqueado:

| Variable | Valor seguro esperado | Estado |
| --- | --- | --- |
| `STRIPE_CHECKOUT_ENABLED` | `false` | Pendiente |
| `STRIPE_CHECKOUT_MODE` | `test` | Pendiente |
| `STRIPE_LIVE_PAYMENTS_APPROVED` | `false` | Pendiente |

No se cargaron en este hito.

No se tocaron:

- `STRIPE_SECRET_KEY`.
- `STRIPE_WEBHOOK_SECRET`.
- Stripe Price IDs.
- Webhooks.
- Entitlements.
- Pagos live.

## 9. Categorias bloqueadas

### Neon / DB

Bloqueado hasta `NEON-PRODUCTION-DB-PREP-1`.

No se tocaron:

- `DATABASE_URL`.
- `DIRECT_URL`.
- Prisma migrations.
- `prisma db push`.
- Neon branches/databases.

### Cloudflare R2 Production

Bloqueado hasta `R2-PRODUCTION-STORAGE-SMOKE-1`.

No se tocaron:

- Bucket prod.
- Credenciales R2 prod.
- `R2_ACCESS_KEY_ID`.
- `R2_SECRET_ACCESS_KEY`.
- Writes/head/read/delete contra bucket prod.

### Upstash Production

Bloqueado hasta `UPSTASH-PRODUCTION-RATE-LIMIT-SMOKE-1`.

No se tocaron:

- `UPSTASH_REDIS_REST_URL`.
- `UPSTASH_REDIS_REST_TOKEN`.
- Rate limit production smoke.

### Wise

Bloqueado hasta hito financiero separado.

No se tocaron:

- Wise API.
- Tokens.
- Perfil financiero.
- Automatizacion de transferencias.

### AI y email production

Bloqueados hasta hitos separados.

No se tocaron:

- AI provider production keys.
- Email provider production keys.
- DNS email.
- SPF/DKIM/DMARC.

## 10. Git/Vercel hardening confirmado

Archivo presente:

- `vercel.json`.

Politica esperada:

```json
{
  "git": {
    "deploymentEnabled": {
      "main": false,
      "preview": true
    }
  }
}
```

Objetivo de la politica:

- `main` no debe disparar auto-deploy.
- `preview` queda habilitada para staging/recovery.

Este hito no cambio la configuracion.

## 11. Riesgos residuales

- `shiftevidence` tiene Production env existentes, pero la salida segura del CLI no expuso nombres; se debe confirmar matriz exacta desde dashboard o API segura antes de cualquier carga.
- Si se agregan variables Production, podria requerirse un redeploy controlado posterior para que apliquen.
- `shiftevidence` sirve dominios reales; cualquier cambio productivo debe tener rollback y ventana.
- DB, R2 prod y Upstash prod no estan listos para carga hasta sus hitos dedicados.
- Stripe live sigue en No-Go hasta aprobacion explicita.

## 12. Que NO se toco

No se tocaron:

- DNS.
- Hostinger.
- Custom domains.
- Production deploy/promote.
- Production env values.
- Preview env values.
- DB.
- Migrations.
- `db push`.
- R2 prod.
- Upstash prod.
- Stripe live.
- Webhooks.
- Wise.
- Entitlements.
- Email.
- AI provider keys.

No se imprimieron secretos y no se guardaron secretos en git.

## 13. Estado final

| Area | Estado final |
| --- | ---: |
| PRODUCTION-ENV-PREP-2 | 100% |
| Production/cutover readiness | 91% |
| Vercel readiness | 95% |
| Storage/R2 readiness | 97% |
| Billing readiness | 95% |
| Stripe live readiness | 65% |
| Admin ops | 94% |
| PDF/report quality | 98% |
| General technical | 97% |

El hito queda completo como preparacion documental segura, sin carga de variables.

## 14. Proximo hito recomendado

Recomendado:

- `NEON-PRODUCTION-DB-PREP-1`.

Alternativa si se quiere cerrar primero la capa App/Auth/Admin:

- `PRODUCTION-ENV-PREP-2A-MANUAL-ENV-ENTRY`.

Despues:

- `R2-PRODUCTION-STORAGE-SMOKE-1`.
- `UPSTASH-PRODUCTION-RATE-LIMIT-SMOKE-1`.
- `STRIPE-LIVE-READINESS-1`.

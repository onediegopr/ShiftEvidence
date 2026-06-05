# Production Env Prep 2A Database URL Entry

Fecha: 2026-06-05

## 1. Objetivo

Cargar de forma segura `DATABASE_URL` productivo de Neon en Vercel Production del proyecto `shiftevidence`, sin imprimir el valor, sin guardarlo en docs/git, sin ejecutar migraciones y sin hacer deploy productivo intencional.

## 2. Estado inicial

| Area | Estado inicial |
| --- | ---: |
| PRODUCTION-ENV-PREP-2A-MANUAL-ENV-ENTRY | 0% |
| Production/cutover readiness | 92% |
| Vercel readiness | 95% |
| DB readiness | 96% |
| General technical | 97% |

## 3. Auditoria local

Repositorio:

- Branch actual: `main`.
- HEAD inicial: `8a672738726f58a61806a0d236a26122fd3e731a`.
- `origin/main`: `8a672738726f58a61806a0d236a26122fd3e731a`.
- `origin/preview`: `5c8b695eb3c20b709db30b00d7cddc6164cf2fed`.
- Repo limpio al iniciar.
- No habia commits locales sin pushear.
- No habia untracked files visibles.
- No habia stashes reportados.
- `.env.local` no esta trackeado.
- `.env.r2-smoke.local` no esta trackeado.

Vercel hardening:

- `vercel.json` conserva `git.deploymentEnabled.main=false`.
- `vercel.json` conserva `git.deploymentEnabled.preview=true`.

## 4. Target Vercel

Target confirmado:

| Campo | Valor |
| --- | --- |
| Team | `shift-evidence` |
| Project | `shiftevidence` |
| Project ID | `prj_vPebqKyHjmKQgoyvRpugXS6aulpP` |
| Environment | Production |

No se toco:

- `infrashift-r2-recovery`.
- Preview env.
- Custom domains.
- Production deploy/promote.

## 5. Target Neon

Target confirmado:

| Campo | Valor |
| --- | --- |
| Project | `InfraShift` |
| Project ID | `icy-term-84598838` |
| Branch | `production` |
| Branch ID | `br-raspy-morning-ap11hfm6` |
| Database | `neondb` |

Branches no productivas observadas y no tocadas:

- `john-demo-seed-dry-run-20260602`.
- `viviana-demo-seed-dry-run-20260602`.

## 6. Env cargado

| Variable | Estado |
| --- | --- |
| `DATABASE_URL` | Loaded: yes |
| `DIRECT_URL` | Loaded: no / not required by current Prisma schema |

Metodo:

- El valor fue copiado manualmente por el usuario desde Neon Console.
- Codex lo tomo desde el portapapeles en memoria.
- Si Neon copio un snippet `.env`, se extrajo solo el valor de `DATABASE_URL`.
- El valor fue enviado a Vercel CLI por stdin.
- El valor no fue impreso.
- El valor no fue guardado en archivos.
- El valor no fue documentado.

Detalle operativo:

- Un primer `vercel env add DATABASE_URL production` reporto que la variable ya existia para el target.
- Se removio solo `DATABASE_URL` de Production en `shiftevidence`.
- Se agrego `DATABASE_URL` nuevamente en Production con el valor productivo de Neon.
- No se modifico `DIRECT_URL`.
- No se modificaron otras variables.

## 7. Confirmacion Vercel

Resultado CLI:

- `DATABASE_URL` fue agregado a Project `shiftevidence`.
- `vercel env ls production` confirma Environment Variables presentes para `shift-evidence/shiftevidence`.
- La salida segura de `env ls` no expuso nombres ni valores.

No se ejecuto:

- `vercel env pull`.
- Redeploy.
- Promote.
- Custom domain action.

## 8. Deploy status

Deployment status post-carga:

- No se hizo production deploy intencional.
- `vercel ls shiftevidence` no mostro deployment nuevo inmediato generado por este hito.
- El ultimo deployment listado seguia siendo anterior al hito.

## 9. Que NO se toco

No se tocaron:

- DNS.
- Hostinger.
- Custom domains.
- Production cutover.
- Production deploy/promote.
- Prisma migrations.
- `prisma migrate deploy`.
- `prisma db push`.
- DB destructive operations.
- `DIRECT_URL`.
- Stripe.
- Stripe live.
- Payments.
- Webhooks live.
- Wise.
- R2 prod.
- Upstash prod.
- Entitlements.
- Grants.

No se imprimieron:

- `DATABASE_URL`.
- `DIRECT_URL`.
- Neon credentials.
- Passwords.
- Tokens.
- Stripe secrets.
- R2 secrets.
- Upstash tokens.
- Claves privadas.

## 10. Riesgos

- El cambio de env no toma efecto en un deployment ya existente hasta que haya redeploy controlado.
- `DIRECT_URL` sigue sin cargarse porque no esta en el schema Prisma actual.
- Vercel Production todavia requiere completar App/Auth/Admin env antes de smoke autenticado.
- No se ejecuto `prisma migrate status` local contra production porque requeriria inyectar un secret productivo localmente.

## 11. Estado final

| Area | Estado final |
| --- | ---: |
| PRODUCTION-ENV-PREP-2A-MANUAL-ENV-ENTRY | 100% |
| Production/cutover readiness | 93% |
| Vercel readiness | 96% |
| DB readiness | 97% |
| General technical | 97% |

## 12. Proximo hito recomendado

Recomendados:

- `R2-PRODUCTION-STORAGE-SMOKE-1`.
- `UPSTASH-PRODUCTION-RATE-LIMIT-SMOKE-1`.
- `AUTH-ADMIN-PRODUCTION-SMOKE-1`.

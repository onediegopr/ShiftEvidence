# Vercel Production Git Integration Hardening

Fecha: 2026-06-05

## 1. Objetivo

Endurecer la integracion Git/deploy de Vercel para evitar deployments productivos accidentales mientras se sigue trabajando en `main`.

Este hito no toca DNS, dominios, env vars productivas, DB, Stripe, R2 prod, Upstash prod, webhooks ni entitlements.

## 2. Estado inicial

Estado antes del hito:

- Proyecto productivo recomendado: `shiftevidence`.
- Dominios productivos activos en `shiftevidence`:
  - `https://shiftevidence.com`
  - `https://www.shiftevidence.com`
- Proyecto `infrashift-r2-recovery`: Preview/recovery/staging tecnico.
- Repo local linkeado a `infrashift-r2-recovery`.
- Push a `main` habia disparado Production deployments en ambos proyectos.
- Production env reales aun no deben cargarse.

Readiness inicial:

| Area | Estado inicial |
| --- | ---: |
| VERCEL-PRODUCTION-GIT-INTEGRATION-HARDENING | 0% |
| Production/cutover readiness | 89% |
| Vercel readiness | 92% |
| Storage/R2 readiness | 97% |
| Billing readiness | 95% |
| Stripe live readiness | 65% |
| Admin ops | 94% |
| PDF/report quality | 98% |
| Avance general tecnico | 97% |

## 3. Auditoria `shiftevidence`

Metadata observada:

| Campo | Valor |
| --- | --- |
| Project | `shiftevidence` |
| Project ID | `prj_vPebqKyHjmKQgoyvRpugXS6aulpP` |
| Framework | Next.js |
| Root Directory | `.` |
| Node.js Version | 24.x |
| Latest Production deployment | `shiftevidence-gqyeza3m4-shift-evidence.vercel.app` |
| Latest Production status | Ready |

Aliases/dominios observados:

- `https://www.shiftevidence.com`
- `https://shiftevidence.com`
- `https://infra-evidence.vercel.app`
- `https://shiftevidence-shift-evidence.vercel.app`
- `https://shiftevidence-git-main-shift-evidence.vercel.app`

Dominio Vercel:

- `shiftevidence.com` aparece como dominio third-party bajo el team.
- No se tocaron DNS ni domains.

Auto-deploy:

- Confirmado por comportamiento: push a `main` genero Production deployment en `shiftevidence`.
- Ese comportamiento es riesgoso porque el proyecto ya sirve dominios reales.

## 4. Auditoria `infrashift-r2-recovery`

Metadata observada:

| Campo | Valor |
| --- | --- |
| Project | `infrashift-r2-recovery` |
| Project ID | `prj_PYbwfVjK9bZYi7AuPcV1frAl7PD3` |
| Framework | Next.js |
| Root Directory | `.` |
| Node.js Version | 24.x |
| Latest validated Preview deployment | `infrashift-r2-recovery-r7nscvzzv-shift-evidence.vercel.app` |
| Latest validated Preview status | Ready |

Aliases observados:

- Stable Preview URL usada para smokes: `https://infrashift-r2-recovery-diegoperezroca-4286-shift-evidence.vercel.app`
- Deployment alias: `https://infrashift-r2-recovery-git-preview-shift-evidence.vercel.app`

Auto-deploy:

- Confirmado por comportamiento: push a `main` genero Production deployment accidental.
- Branch `preview` genera Preview deployment y fue validada en hitos previos.

## 5. Matriz auto-deploy

| Proyecto | Rol | Git repo | Production branch | Push main deploya? | Preview branch | Riesgo | Recomendacion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `shiftevidence` | Production canonico | Conectado a repo, exact link no expuesto por CLI | `main` por comportamiento observado | Si, antes del hardening | No validado en este hito | Alto | Bloquear auto-deploy de `main`; deploy prod solo aprobado. |
| `infrashift-r2-recovery` | Preview/recovery/staging | Repo local linkeado | `main` por comportamiento observado | Si, antes del hardening | `preview` | Alto-medio | Bloquear auto-deploy de `main`; mantener `preview` habilitada. |

## 6. Estrategias evaluadas

### Opcion A - Desactivar Git auto-deploy en `shiftevidence`

Pros:

- Evita production deploy accidental.
- Production deploy queda manual/controlado.

Contras:

- Requiere dashboard/API o configuracion estatica.
- Si se apaga todo, tambien puede bloquear previews utiles.

Resultado: aplicado parcialmente por configuracion estatica de repo para `main`.

### Opcion B - Cambiar Production branch a `production`

Pros:

- Push a `main` no actualiza produccion.
- Cutover ocurre al push/merge a rama productiva.

Contras:

- Requiere cambiar settings del proyecto.
- No se puede validar por CLI sin modificar project settings.
- Puede requerir dashboard y decision owner.

Resultado: recomendado para futuro si se quiere release branch formal, no aplicado en este hito.

### Opcion C - Ignored Build Step para docs-only

Pros:

- Reduce ruido de builds para cambios documentales.

Contras:

- No evita todos los deployments accidentales.
- Segun Vercel, los builds ignorados pueden seguir contando como deployments/queues.

Resultado: no aplicado; insuficiente como control principal.

### Opcion D - Mantener auto-deploy y cancelar manualmente

Resultado: no recomendado.

Ya genero ruido y riesgo en ambos proyectos.

## 7. Decision aplicada

Se agrego `vercel.json` con configuracion Git estatica:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "git": {
    "deploymentEnabled": {
      "main": false,
      "preview": true
    }
  }
}
```

Decision:

- `main`: no debe disparar deployments automaticos.
- `preview`: sigue habilitada para Vercel Preview/staging.

Base documental:

- La documentacion de Vercel indica que `git.deploymentEnabled` permite especificar ramas que no deben disparar deployments automaticos.
- Las ramas no especificadas quedan habilitadas por defecto, por lo que se especifica `preview: true` para dejar clara la intencion.

## 8. Cambios realizados

Archivos creados:

- `vercel.json`
- `docs/vercel-production-git-integration-hardening.md`

No se modificaron settings desde dashboard.

No se cambio:

- Production branch del dashboard.
- Deployment protection.
- Domains.
- Env vars.
- Git provider/link.
- `.vercel/project.json`.

## 9. Que NO se toco

No se tocaron:

- DNS.
- Hostinger.
- Custom domains.
- Production env.
- Preview env.
- Stripe live.
- Payments.
- Webhooks.
- Wise.
- Entitlements.
- Neon prod.
- Migrations.
- DB push.
- R2 prod.
- Upstash prod.
- Project deletion.
- Domain removal.
- Promote.

No se imprimieron secrets ni valores de env.

## 10. Flujo Git seguro

Flujo esperado despues del hardening:

- `main`: desarrollo estable y documentacion; no debe auto-deployar produccion.
- `preview`: staging/recovery tecnico en Vercel Preview.
- Production deploy: manual o rama productiva controlada en hito aprobado.

Recomendacion operativa:

- Seguir trabajando en `main` para commits controlados.
- Usar `preview` para smokes de staging/recovery.
- No cargar Production env reales hasta confirmar que los pushes a `main` ya no generan Production deployments.

## 11. Production deploy futuro

Production deploy futuro recomendado:

1. Aprobar ventana de release.
2. Confirmar Production env por capas.
3. Confirmar Git hardening sigue activo.
4. Elegir mecanismo:
   - deploy manual aprobado desde Vercel; o
   - rama `production`/`release/production` si se configura en dashboard.
5. Ejecutar smokes post-deploy.
6. Mantener rollback listo.

No hacer production deploy automatico desde `main`.

## 12. Riesgos restantes

| Riesgo | Estado | Mitigacion |
| --- | --- | --- |
| El commit que agrega `vercel.json` podria disparar un ultimo auto-deploy antes de que Vercel lea la regla | Validado: no se disparo deployment nuevo | Mantener `git.deploymentEnabled.main=false`. |
| Dashboard production branch sigue posiblemente en `main` | No cambiado | Hito futuro si se quiere branch `production`. |
| `shiftevidence` ya sirve dominios reales | Vigente | No tocar env/deploy sin ventana. |
| Git settings finos no visibles por CLI | Vigente | Validar en Dashboard o API auth explicita. |
| Ignored Build Step no configurado | Aceptado | `git.deploymentEnabled` es control principal. |

## 13. Validacion post-push

Despues del commit `bffd413 docs: harden Vercel production Git integration`, se revisaron deployments en ambos proyectos.

Resultado:

- `shiftevidence`: no aparecio ningun deployment nuevo posterior al push.
- `infrashift-r2-recovery`: no aparecio ningun deployment nuevo posterior al push.
- No hubo deployment Production accidental para remover.
- Working tree quedo limpio y sincronizado con `origin/main`.

Veredicto: hardening confirmado para push a `main`.

## 14. Porcentajes finales

| Area | Estado final |
| --- | ---: |
| VERCEL-PRODUCTION-GIT-INTEGRATION-HARDENING | 100% |
| Production/cutover readiness | 91% |
| Vercel readiness | 95% |
| Storage/R2 readiness | 97% |
| Billing readiness | 95% |
| Stripe live readiness | 65% |
| Admin ops | 94% |
| PDF/report quality | 98% |
| Avance general tecnico | 97% |

## 15. Proximo hito recomendado

Recomendado:

1. `PRODUCTION-ENV-PREP-2`
2. `NEON-PRODUCTION-DB-PREP-1`

Antes de cargar Production env, mantener este control activo y usar `preview` para staging/recovery.

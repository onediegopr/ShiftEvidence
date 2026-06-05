# Vercel Production Project Decision 1

Fecha: 2026-06-05

## 1. Objetivo

Decidir cual sera el proyecto Vercel productivo canonico para el cutover futuro de Shift Evidence, sin ejecutar cambios productivos.

Este hito responde:

- que proyecto debe recibir Production env;
- que proyecto debe recibir o conservar `shiftevidence.com`;
- que proyecto queda como recovery/preview;
- como reducir auto-deploys accidentales;
- cual es la transicion mas segura.

## 2. Estado actual

| Area | Estado final |
| --- | ---: |
| VERCEL-PRODUCTION-PROJECT-DECISION-1 | 100% |
| Production/cutover readiness | 89% |
| Vercel readiness | 92% |
| Storage/R2 readiness | 97% |
| Billing readiness | 95% |
| Stripe live readiness | 65% |
| Admin ops | 94% |
| Avance general tecnico | 97% |

Veredicto productivo general:

- No-Go para cutover inmediato.
- Go para preparar el proyecto productivo canonico en un hito posterior.
- No cargar Production env hasta aplicar hardening de Git integration / auto-deploy o aceptar una ventana controlada.

## 3. Auditoria local Vercel

El repo local esta linkeado a:

| Campo | Valor |
| --- | --- |
| Project name | `infrashift-r2-recovery` |
| Project ID | `prj_PYbwfVjK9bZYi7AuPcV1frAl7PD3` |
| Team/org ID | `team_LaG7tNqvwxaPIwMfXlbAReY2` |

Archivo observado:

- `.vercel/project.json`

Contenido no sensible:

```json
{"projectId":"prj_PYbwfVjK9bZYi7AuPcV1frAl7PD3","orgId":"team_LaG7tNqvwxaPIwMfXlbAReY2","projectName":"infrashift-r2-recovery"}
```

No se modifico `.vercel/project.json`.

## 4. Auditoria proyecto `shiftevidence`

Metadata observada:

| Campo | Valor |
| --- | --- |
| Project ID | `prj_vPebqKyHjmKQgoyvRpugXS6aulpP` |
| Framework | Next.js |
| Root Directory | `.` |
| Node.js Version | 24.x |
| Build Command | default `npm run build` / `next build` |
| Install Command | default Vercel install command |
| Latest deployment | `shiftevidence-gqyeza3m4-shift-evidence.vercel.app` |
| Latest target | Production |
| Latest status | Ready |

Aliases/dominios observados por `vercel inspect https://www.shiftevidence.com`:

- `https://www.shiftevidence.com`
- `https://shiftevidence.com`
- `https://infra-evidence.vercel.app`
- `https://shiftevidence-shift-evidence.vercel.app`
- `https://shiftevidence-git-main-shift-evidence.vercel.app`

Deployments recientes:

- Multiples deployments Production Ready recientes.
- Push a `main` disparo un Production deployment nuevo durante el hito anterior y durante este hito.

Env vars:

- No se imprimieron valores.
- El CLI local esta linkeado a `infrashift-r2-recovery`, por lo que no se inspecciono env presence de `shiftevidence` sin relink/dashboard.
- No se relinkeo el repo local y no se cambio configuracion.

Git integration:

- Auto-deploy Production desde `main` esta efectivamente activo o conectado, porque un push a `main` genero un deployment Production nuevo en este proyecto.
- Linked Git repo exacto no fue expuesto por las salidas CLI/MCP disponibles.

Riesgo:

- Este proyecto ya sirve dominios reales. Cualquier deployment Production puede afectar URLs publicas.

## 5. Auditoria proyecto `infrashift-r2-recovery`

Metadata observada:

| Campo | Valor |
| --- | --- |
| Project ID | `prj_PYbwfVjK9bZYi7AuPcV1frAl7PD3` |
| Framework | Next.js |
| Root Directory | `.` |
| Node.js Version | 24.x |
| Build Command | default `npm run build` / `next build` |
| Install Command | default Vercel install command |
| Latest validated deployment | `infrashift-r2-recovery-r7nscvzzv-shift-evidence.vercel.app` |
| Latest validated target | Preview |
| Latest validated status | Ready |

Aliases/dominios observados:

- Stable Preview URL usada en smokes: `https://infrashift-r2-recovery-diegoperezroca-4286-shift-evidence.vercel.app`
- Deployment alias observado: `https://infrashift-r2-recovery-git-preview-shift-evidence.vercel.app`
- No tiene `shiftevidence.com` ni `www.shiftevidence.com`.

Env vars:

- Production env del proyecto linkeado: no variables encontradas.
- Preview env / branch preview fue usado y validado en hitos previos para Neon preview, R2 preview, Upstash preview, admin preview y Stripe test mode.
- No se imprimieron valores.

Git integration:

- El repo local esta linkeado a este proyecto.
- Push a `main` tambien dispara Production deployment en este proyecto.
- Los Production deployments accidentales de este proyecto fueron removidos en hitos previos.

Riesgo:

- Es tecnicamente el proyecto mejor validado en Preview, pero su nombre y rol son de recovery/staging.
- Mover dominios reales hacia este proyecto agregaria riesgo DNS/custom-domain innecesario.

## 6. Matriz comparativa

| Criterio | `shiftevidence` | `infrashift-r2-recovery` | Riesgo | Recomendacion |
| --- | --- | --- | --- | --- |
| Tiene dominio productivo actual | Si: `shiftevidence.com` y `www.shiftevidence.com` | No | Alto si se mueve dominio | Mantener dominios en `shiftevidence`. |
| Esta linkeado al repo local actual | No localmente | Si | Medio | No relinkear en este hito; documentar. |
| Tiene Preview validado | No con la profundidad del recovery | Si | Medio | Mantener recovery como Preview/staging tecnico. |
| Tiene Production env | No verificado sin relink/dashboard | No env en recovery Production | Alto | Auditar/cargar env solo luego de decidir/hardening. |
| Tiene R2/Neon/Upstash preview validado | No observado | Si | Medio | Usar aprendizaje del recovery para configurar prod canonico. |
| Tiene auto-deploy `main` | Si, observado | Si, observado | Alto | Hito de Git integration hardening antes de env/cutover. |
| Historial de production accidental | Si, nuevo deployment por push docs | Si, varios removidos | Alto | Desactivar/pausar o controlar auto-deploy. |
| Rollback | Vercel rollback posible, pero domina dominios reales | Vercel rollback posible y sin dominios reales | Medio | Production rollback debe planificarse sobre `shiftevidence`. |
| Operacion futura | Nombre claro y comercial | Nombre tecnico/recovery | Medio | `shiftevidence` es mas entendible. |
| Seguridad para cutover | Mas seguro si ya tiene dominio, pero requiere env/hardening | Menos seguro por dominio/DNS move | Alto | Opcion A con hardening previo. |
| Limpieza futura | Limpio como production canonico | Bueno como recovery/staging | Bajo-medio | Separar roles: production vs recovery. |

## 7. Opciones A/B/C

### Opcion A - Mantener `shiftevidence` como produccion canonica

Pros:

- Ya tiene `shiftevidence.com` y `www.shiftevidence.com`.
- Evita movimiento DNS/custom-domain.
- Nombre claro y comercial.
- Es natural para operar produccion.

Contras:

- Hay que confirmar Git integration exacta.
- Hay que cargar Production env ahi de forma controlada.
- Hay que confirmar que corre el repo/codigo correcto.
- Ya sirve una URL publica real, por lo que todo cambio exige ventana/rollback.

Evaluacion: recomendada.

### Opcion B - Usar `infrashift-r2-recovery` como produccion final

Pros:

- Repo local linkeado.
- Preview/recovery validado con smokes recientes.
- Pipeline tecnico reciente y conocido.

Contras:

- Requiere mover dominios.
- Mayor riesgo DNS/custom-domain.
- Nombre interno/recovery no es ideal para operacion futura.
- Puede confundir al equipo y al owner.

Evaluacion: no recomendada como produccion canonica, salvo que se decida migrar dominios por una razon fuerte.

### Opcion C - Crear proyecto nuevo `shiftevidence-production`

Pros:

- Separacion limpia desde cero.
- Evita arrastre historico de ambos proyectos.
- Configuracion production deliberada.

Contras:

- Mas trabajo.
- Requiere configurar dominio desde cero.
- Requiere Git integration/env/deployment protection desde cero.
- Introduce un tercer proyecto y mas complejidad.

Evaluacion: no recomendado ahora. Guardar como fallback si los dos proyectos existentes resultan imposibles de endurecer.

## 8. Recomendacion

Recommended production project: `shiftevidence`.

Mantener:

- `shiftevidence` como Production canonico.
- `infrashift-r2-recovery` como Preview/recovery/staging tecnico.

Condiciones antes de cargar env o ejecutar cutover:

- Confirmar Git integration de `shiftevidence`.
- Confirmar branch productiva y auto-deploy behavior.
- Endurecer o pausar auto-deploys accidentales.
- Confirmar env presence de `shiftevidence` desde dashboard o contexto seguro sin relink destructivo.
- Cargar Production env por capas solamente en `shiftevidence`.
- Mantener `infrashift-r2-recovery` sin dominios productivos.

## 9. Riesgos

| Riesgo | Impacto | Mitigacion |
| --- | --- | --- |
| Push a `main` auto-deploya ambos proyectos | Alto | Hito `VERCEL-PRODUCTION-GIT-INTEGRATION-HARDENING`. |
| `shiftevidence` ya sirve dominios reales | Alto | No tocar env/deploy sin ventana y rollback. |
| Env de `shiftevidence` no verificado | Medio-alto | Auditar present/missing desde dashboard o contexto seguro. |
| Repo local linkeado a recovery, no production | Medio | Mantener link local para recovery o usar cwd temporal controlado; no relink destructivo. |
| Mover dominios al recovery | Alto | Evitar salvo decision owner explicita. |
| Dos proyectos con Production auto-deploy | Alto | Desactivar uno o cambiar branch production/ignore build step. |

## 10. Decision propuesta

Decision propuesta:

- Produccion final: `shiftevidence`.
- Dominios productivos: conservar en `shiftevidence`.
- Production env futuro: cargar en `shiftevidence`, no en `infrashift-r2-recovery`.
- Preview/recovery/staging tecnico: `infrashift-r2-recovery`.
- No crear tercer proyecto ahora.

Decision owner pendiente:

- Aprobar esta separacion de roles antes de ejecutar `PRODUCTION-ENV-PREP-2`.

## 11. Que NO se toco

No se modifico:

- Production env.
- Preview env.
- DNS.
- Hostinger.
- Email.
- Custom domains.
- Vercel project settings.
- Git integration.
- Deployment protection.
- Neon.
- R2.
- Upstash.
- Stripe.
- Wise.
- DB/migrations.
- Codigo.
- `.vercel/project.json`.

No se imprimieron secretos ni valores de env.

## 12. Proximo hito recomendado

Recomendado:

1. `VERCEL-PRODUCTION-GIT-INTEGRATION-HARDENING`
2. `PRODUCTION-ENV-PREP-2`
3. `NEON-PRODUCTION-DB-PREP-1`

Motivo:

- Antes de cargar Production env en `shiftevidence`, hay que controlar que los pushes a `main` no generen deployments productivos accidentales en uno o ambos proyectos.

## 13. Porcentajes finales

| Area | Avance final |
| --- | ---: |
| VERCEL-PRODUCTION-PROJECT-DECISION-1 | 100% |
| Production/cutover readiness | 89% |
| Vercel readiness | 92% |
| Storage/R2 readiness | 97% |
| Billing readiness | 95% |
| Stripe live readiness | 65% |
| Admin ops | 94% |
| Avance general tecnico | 97% |

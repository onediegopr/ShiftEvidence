# HITO 9.2S-LAUNCH-REVIEW — Manual Admin Validation + Controlled Launch Recommendation

## Objetivo

Documentar formalmente la validación manual en navegador real del tramo admin/entitlement/full report y emitir una recomendación controlada de launch readiness sin declarar `Production launched`.

Este documento separa:

- Validación automatizada por Codex/CLI.
- Validación manual del usuario en navegador real.

## Contexto

Estado previo:

- Branch: `main`.
- HEAD esperado: `0de69d3 docs: record production dynamic routes recovery`.
- origin/main sincronizado.
- Working tree esperado: limpio.
- Producción pública: OK.
- Rutas privadas sin sesión: protegidas.
- Dynamic route blocker `503/504`: recuperado en revalidación.
- Parser P0: OK.
- Upload gate: OK.
- PDF preview/download productivo: OK por hitos previos.
- Production launched: NO.

El usuario informó:

- “todo funciona perfecto en el dashboard”.
- Pudo entrar con admin real.
- Pudo operar el flujo desde navegador.
- El assessment viejo de otro usuario no debe usarse para validar full report porque puede devolver `404` por ownership.
- El flujo correcto es crear un assessment admin-owned.

## Gate A — Local/Git/Build

| Item | Resultado |
| --- | --- |
| Branch | `main` |
| HEAD inicial | `0de69d3dada898c646f9908d3965690dd1788aea` |
| origin/main | `0de69d3dada898c646f9908d3965690dd1788aea` |
| Working tree inicial | Limpio |
| Node | `v22.22.0` |
| npm | `10.9.4` |
| `npm run hostinger:diagnose` | OK |
| `npm run typecheck` | OK |
| `npm run lint` | OK |
| `npm run build` | OK |

Warning conocido:

- Turbopack/NFT warning en `reportStorageService.ts`.
- No bloquea build.

Resultado:

- Gate A: OK.

## Gate B — Public/Auth Base

Quick check ejecutado contra `https://shiftevidence.com`.

| Ruta | Resultado |
| --- | --- |
| `/` | `200 OK` |
| `/shiftreadiness` | `200 OK` |
| `/sign-in` | `200 OK` |
| `/sign-up` | `200 OK` |
| `/dashboard` | `307 Temporary Redirect` a `/sign-in` |
| `/dashboard/assessments` | `307 Temporary Redirect` a `/sign-in` |
| `/dashboard/admin/unlock-requests` | `307 Temporary Redirect` a `/sign-in` |
| Hostinger 404 | Ausente |
| `503/504` | Ausente |

Resultado:

- Gate B: OK.
- Producción pública responde.
- Rutas privadas sin sesión siguen protegidas.

## Gate C — User-attested Admin Validation

Fuente de validación:

| Campo | Resultado |
| --- | --- |
| Validated by | Usuario en navegador real |
| Codex/browser automation available | NO |
| Reason | No hay cookies/sesión admin productiva en el entorno Codex |

Validación manual reportada por el usuario:

| Item | Resultado |
| --- | --- |
| Dashboard general | User confirmed: funciona perfecto |
| Admin real | User confirmed: pudo iniciar sesión |
| `/dashboard/admin/unlock-requests` | User confirmed: carga correctamente |
| Header admin | `Admin — Manual unlock requests` |
| Pending | `0` |
| Approved | `0` |
| Fulfilled | `8` |
| Rejected | `1` |
| Admin-only manual approval | Visible |
| Queue | Visible |
| Requests históricos fulfilled | Visibles |
| Notas/estados/botones | Visibles |
| QA request conocido | `QA Production Smoke - 2026-05-27 - safe to delete - admin entitlement` |
| QA request status | `Entitlement granted` |
| Admin-owned flow | User confirmed: ejecutado desde navegador |
| Request viejo cross-owner | No usado para cierre; puede devolver `404` por ownership |

Admin-owned smoke:

| Campo | Resultado |
| --- | --- |
| Assessment name | `QA Production Smoke — admin-owned — safe to delete` |
| Assessment id | not captured |
| Unlock request visible | user confirmed |
| Fulfill executed | user confirmed |
| Entitlement status | user confirmed as working |
| Commercial status | user confirmed as working; exact value not captured |
| Full `readiness_report` available | user confirmed |
| Full report generated | user confirmed |
| Full PDF downloaded | user confirmed |
| PDF opens | user confirmed |
| `0.0.0.0` redirect | no issue reported |
| Visible errors | none reported |

Evidence level:

- Manual browser validation by user.
- Codex CLI could not independently inspect authenticated admin state.
- IDs/report IDs were not captured, so this is launch-review evidence but not a complete machine-verifiable audit trail.
- The admin queue state was user-attested with concrete counters: Pending `0`, Approved `0`, Fulfilled `8`, Rejected `1`.
- Full entitlement closure is supported by user-attested admin UI evidence showing the known QA request as `Entitlement granted`; Codex did not replay the click flow.

Resultado:

- Gate C: PASSED by user-attested browser validation.

## Ownership / Admin UX Gap

Old assessment:

- `cmpnwl8o8000d497rso02xypj`.
- Admin queue showed a pending request for:
  `QA Production Smoke - 2026-05-27 - safe to delete - admin entitlement`.
- Opening `/dashboard/assessments/cmpnwl8o8000d497rso02xypj/report` as admin returned `404` per user context.

Cause:

- Probable ownership/workspace protection.
- Code evidence reviewed by Codex:
  - `report/page.tsx` calls `findAssessmentForUser({ userId: session.user.id, assessmentId })`.
  - If the assessment is not available for that user/workspace, it executes `notFound()`.

Classification:

- Not a report generation bug.
- Expected security behavior for direct user-owned assessment route.
- Admin UX gap: admin queue can list requests for other users, but `Open report` links to a route that requires user/workspace ownership.

Backlog:

- Add an admin-safe read-only report view for unlock requests.
- Or change copy/button in admin queue to avoid implying the admin can open cross-owner user report routes.
- Consider adding a dedicated admin assessment detail route with explicit authorization.

## Security Summary

| Control | Estado |
| --- | --- |
| Private routes without session | `307` to `/sign-in` |
| Admin route without session | `307` to `/sign-in` |
| Non-admin authenticated fail-closed | Validated in previous smoke as `404` |
| Ownership protection | Old assessment `404` is consistent with ownership protection |
| Full report secure access | User confirmed flow works; no CLI verification |
| `0.0.0.0` redirects | No issue reported by user; previous fix validated |

Pendientes:

- No-session full report download was not independently revalidated by Codex for the admin-owned report.
- Exact report ID, entitlement ID and unlock request ID were not captured.
- Admin queue state and `Entitlement granted` were observed manually by the user, not by Codex automation.

## Remaining Risks

Hostinger logs:

- No disponibles desde el contexto actual de herramientas.
- No revisados en este hito.

Password recovery:

- No existe forgot password/password recovery.
- Riesgo operativo para launch público.
- Recomendación: implementar `HITO AUTH-1 — Password Recovery` antes de launch abierto, o mantener launch como controlado/manual.

QA cleanup:

- QA data productiva marcada como safe to delete.
- Cleanup/retention policy pendiente.

Admin UX gap:

- Admin queue cross-owner `Open report` puede llevar a `404`.
- Recomendado corregir antes de uso operativo frecuente por admins.

## Launch Readiness Decision

Ready for controlled production launch review: SÍ.

Motivo:

- Producción pública OK.
- Auth/dashboard base OK por hitos previos y user confirmation actual.
- Upload/storage/parser/PDF preview OK por hitos previos.
- Redirect bug `0.0.0.0` corregido por hitos previos.
- Admin/entitlement/full report fue validado manualmente por el usuario en navegador real con admin-owned assessment.
- Admin queue muestra `Pending 0`, `Approved 0`, `Fulfilled 8`, `Rejected 1`; el request QA conocido figura como `Entitlement granted`.
- No hay bug crítico visible reportado.

Production launched: NO.

Condiciones:

- Launch debe ser controlado, no abierto masivo.
- Mantener soporte manual para admins hasta implementar password recovery.
- Registrar IDs en el próximo smoke o launch checklist final.
- Revisar logs Hostinger si hay acceso.
- Definir cleanup/retention de QA data productiva.

Riesgos aceptados para launch review controlado:

- Logs Hostinger no revisados desde herramientas.
- Password recovery ausente.
- Admin UX gap cross-owner.
- IDs exactos del smoke admin-owned no capturados.
- Full report automated replay por Codex no ejecutado por falta de cookies/sesión admin; se acepta como evidencia manual para review controlado.

Riesgos no aceptados para launch abierto:

- Falta de password recovery.
- Falta de política formal de QA cleanup/retention.
- Falta de admin read-only cross-owner report view.

Próximo hito recomendado:

1. `HITO LAUNCH-1 — Controlled Production Launch Review`.
2. `HITO AUTH-1 — Password Recovery`.
3. `HITO ADMIN-UX-1 — Admin-safe report view for unlock requests`.
4. `HITO OPS-1 — QA Data Cleanup / Retention Policy`.

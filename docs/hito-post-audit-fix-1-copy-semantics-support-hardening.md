# HITO POST-AUDIT-FIX-1 - Copy, Semantics, Support Hardening

## 1. Resumen ejecutivo

Estado: COMPLETO.

Veredicto: OK con ajustes menores resueltos.

Este hito corrige hallazgos medios/bajos detectados en CROSS-AUDIT-1 sin tocar arquitectura critica. No hubo cambios DB, migraciones, auth core, billing/pricing, Advisor runtime, Project Memory Vault, PDF, Ceph engine, storage scoring, collector real, deploy, Hostinger ni variables de entorno.

## 2. Cambios aplicados

### Storage semantics

Se ajusto el label visible del Completion Center para el modulo Storage cuando el estado interno es `complete`.

Antes podia leerse como `Complete`.

Ahora se muestra como:

```text
Ready for storage review
```

Decision: no cambiar estados internos ni tests. El cambio es de presentacion para evitar que el usuario interprete "complete" como migracion validada, storage safe o readiness definitivo.

### Ceph copy

Se reemplazo el copy que hablaba de `Ceph sizing` por:

```text
Ceph suitability signals
```

Motivo: el sistema evalua suitability/readiness y senales de capacidad, pero no hace sizing definitivo de Ceph ni garantiza diseno productivo.

### Markdown literal

Se corrigieron literales `**Storage**` en UI JSX.

Ahora se usa `<strong>Storage</strong>` donde corresponde, evitando markdown crudo visible al usuario.

### Mojibake / idioma admin

Se revisaron secuencias visibles `AdministraciÃ`, `ConfiguraciÃ`, `EvaluaciÃ`, `SesiÃ` y `Ãƒ` en `src/app`, `src/components` y `src/server`.

Resultado: no quedaron ocurrencias visibles en codigo fuente revisado. Admin mantiene idioma espanol. Tambien se cambiaron textos nuevos del admin Storage/Ceph de ingles a espanol:

- `Destination evidence uploaded` -> `Evidencia de destino cargada`.
- `Manual collector evidence expected` -> `Evidencia manual del collector pendiente`.
- `No destination collector evidence uploaded` -> `Sin evidencia de collector de destino`.

## 3. Support history hardening

Estrategia elegida: Opcion A - mostrar solo solicitudes autenticadas.

El dashboard del usuario ahora consulta `SupportRequest` solo por:

```text
userId = session.user.id
```

Ya no lista solicitudes publicas asociadas solamente por `contactEmail`.

Resultado:

- Reduce ruido/spoof por tickets publicos enviados con el email del usuario.
- Mantiene visibles tickets creados desde dashboard y assessment detail.
- No muestra `adminNotes`.
- No muestra tickets de otros usuarios por workspace incorrecto.
- No agrega DB ni cambios de schema.

## 4. Rate-limit / anti-spam audit

Resultado: hardening aplicado con patron existente.

Soporte publico ahora usa `assertRateLimit` con dos limites:

- `publicSupportIp`: 10 requests / 15 minutos.
- `publicSupportEmail`: 5 requests / 1 hora.

Senales auditadas:

- Rate-limit: SI, usando `@upstash/ratelimit` ya existente.
- Honeypot: NO.
- Captcha: NO.
- Server-side validation: SI.
- Secret filtering: SI, `SECRET_LIKE_PATTERN` en subject/message.
- Length limits: SI, `INPUT_LIMITS`.
- IP tracking: SI, derivado desde headers para rate-limit; no se persiste IP en DB.
- Logging: rate-limit misconfig/failure ya se registra desde `rateLimit.ts`.

Pendiente futuro:

```text
Public support honeypot/captcha remains a future hardening item if spam appears.
```

## 5. Validaciones tecnicas

- `npx prisma validate`: OK.
- `npx prisma generate`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run test:run`: OK, 58 files / 285 tests.
- `npm run build`: OK.

Build warning conocido:

- Turbopack/NFT sobre `src/server/evidence/localStorageService.ts` importado desde descarga de evidencia. No bloquea.

## 6. Smoke HTTP local

Smoke ejecutado con `next start -p 3100`.

- `/`: 200.
- `/contact`: 200.
- `/support`: 200.
- `/about`: 200.
- `/pricing`: 200.
- `/security`: 200.
- `/partners`: 200.
- `/login`: 307 a `/sign-in`.
- `/client-login`: 307 a `/sign-in`.
- `/sign-in`: 200.
- `/sign-up`: 200.
- `/dashboard`: 307 a `/sign-in`.
- `/dashboard/admin`: 307 a `/sign-in`.

Servidor local detenido despues del smoke.

## 7. Smoke autenticado

No realizado desde Codex por falta de sesion real autenticada.

User-attestation requerida:

```text
Doy por validado POST-AUDIT-FIX-1: dashboard OK, support history OK, Storage Completion copy OK, Storage tab OK, Advisor OK, admin OK, login con sesion OK.
```

## 8. Regression checks

- DB/schema: no modificado.
- Migrations: no modificadas.
- Auth core / Better Auth: no modificado.
- Billing/pricing: no modificado.
- Advisor runtime/provider routing: no modificado.
- Project Memory Vault: no modificado.
- PDF generation: no modificado.
- Ceph engine: no modificado.
- Storage scoring: no modificado.
- SupportRequest schema: no modificado.
- Collector guidance: solo copy prudencial, sin collector real.

## 9. Archivos modificados

- `src/components/assessments/AssessmentCompletionCenter.tsx`
- `src/app/dashboard/assessments/[id]/page.tsx`
- `src/components/assessments/StorageDestinationReadinessPanel.tsx`
- `src/app/dashboard/admin/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/support/actions.ts`
- `src/server/security/rateLimit.ts`
- `src/server/support/supportRequestService.ts`

## 10. Riesgos pendientes

- Smoke autenticado real pendiente de user-attestation.
- Revision visual mobile real pendiente.
- Honeypot/captcha publico pendiente si aparece spam.
- Full public launch: NO declarado.

## 11. Proximo paso recomendado

Realizar smoke autenticado user-attested de dashboard, support history, Storage tab, Completion Center labels, Advisor, admin support/storage y `/client-login` con sesion. Luego decidir si se abre una beta/demo controlada.

# HITO TRUST-SUPPORT-1 - Support, About & Public Trust Layer

## 1. Resumen ejecutivo

- Se agrego una capa publica de confianza y soporte para Shift Evidence.
- Estado: implementado en codigo local, pendiente de validaciones finales y sin deploy.
- Full public launch: no declarado.
- No se tocaron Hostinger, variables de entorno, billing provider, Advisor runtime ni Project Memory Vault.

## 2. Superficie publica

- `/about`: pagina publica en ingles con posicionamiento, limites del producto, privacidad y modelo de confianza.
- `/support`: pagina publica en ingles con formulario de soporte y contactos directos.
- Landing/home: bloque discreto de confianza cerca del cierre principal.
- Footer: enlaces visibles a About, Support, Security, Pricing, Partners y Contact.

## 3. Soporte autenticado

- Dashboard: tarjeta de soporte para pedidos asociados al workspace del usuario.
- Assessment detail: tab contextual de soporte asociado al assessment, sin refactorizar `SeniorMigrationAdvisorPanel`.
- Los formularios advierten que no deben incluirse passwords, tokens, secretos ni archivos privados crudos.

## 4. DB y modelo

- Modelo nuevo: `SupportRequest`.
- Enums nuevos:
  - `SupportRequestSource`
  - `SupportRequestCategory`
  - `SupportRequestStatus`
  - `SupportRequestPriority`
- Migracion local creada: `20260531110000_trust_support_1_support_requests`.
- No se aplico migracion en produccion desde este hito.
- No se uso `db push` ni `migrate reset`.

## 5. Admin interno

- Se agrego tab `Soporte` en la consola admin.
- La consola muestra resumen, lista reciente, contacto, assessment asociado, estado, prioridad y notas internas.
- Admin puede actualizar estado, prioridad y notas.
- Texto interno admin: espanol.

## 6. Seguridad

- No secrets.
- No raw files.
- No cross-workspace leakage intencional.
- Public support no asocia `assessmentId` arbitrario a registros autenticados.
- Assessment support valida ownership antes de asociar el pedido.
- No email automation, live chat, SLA, attachments, billing changes ni deploy.

## 7. Fuera de alcance

- Zendesk, Intercom o live chat.
- SLA automatizado.
- Adjuntos.
- Email automation.
- Cambios de pricing real o billing provider.
- Advisor credits/runtime, provider routing, RAG, Project Memory Vault o PDF generation.
- Refactors globales o i18n.

## 8. Proximo paso recomendado

- Validar localmente lint, typecheck, Prisma validate, tests y build.
- Luego decidir si aplicar la migracion en un entorno temporal antes de cualquier rollout productivo.

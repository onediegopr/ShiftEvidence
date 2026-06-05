# Customer Pilot 1

Fecha: 2026-06-05

## 1. Objetivo

Preparar el primer piloto real controlado de Shift Evidence para pasar de producto tecnicamente listo a aprendizaje real de mercado, sin campanas publicas, sin pagos live, sin datos sensibles no autorizados y sin automatizar grants.

## 2. Tipo de piloto elegido

Tipo elegido para este hito:

- Package only.
- Preparado para piloto con prospecto real o dataset customer-safe.
- No ejecutado con cliente real en este hito porque no se recibio consentimiento/dataset/prospecto especifico.

Recomendacion operativa:

- Si hay prospecto real con consentimiento: usar Opcion A.
- Si hay dataset real anonimizado validado: usar Opcion B.
- Si todavia no hay prospecto: usar Opcion C con dataset sintetico extendido y este runbook.
- Para discovery comercial sin upload: usar Opcion D.

No se creo assessment real de cliente.
No se subio evidencia real.
No se genero reporte con datos reales.

## 3. Estado inicial

| Area | Estado inicial |
| --- | ---: |
| CUSTOMER-PILOT-1 | 0% |
| Production/cutover readiness | 100% |
| Vercel readiness | 99% |
| DNS readiness | 99% |
| DB readiness | 98% |
| Storage/R2 readiness | 100% |
| Upstash/rate limit readiness | 100% |
| Billing readiness | 99% |
| Stripe live readiness | 94% |
| Admin ops | 99% |
| PDF/report quality | 100% |
| General technical | 99% |

Production status:

- `PRODUCTION-CUTOVER-CONTROLLED`: complete.
- Verdict: Controlled Production Ready.
- Public launch approved: no.
- Live payments approved: no.
- Google Ads launch approved: no.
- Customer-ready payment collection: no.

## 4. Auditoria local

Repositorio:

- Branch: `main`.
- HEAD: `45de66ee74a9b6b20a475b09a71b7f5dd4501fa9`.
- `origin/main`: `45de66ee74a9b6b20a475b09a71b7f5dd4501fa9`.
- `origin/preview`: `5c8b695eb3c20b709db30b00d7cddc6164cf2fed`.
- Repo limpio al iniciar.
- No commits locales ahead/behind.
- No stashes.
- No untracked files visibles.
- `.env.local` no trackeado.
- `.env.r2-smoke.local` no trackeado.

Vercel Git hardening:

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

## 5. Consentimiento / data handling

Consentimiento:

- Not needed for this hito because no real customer data was used.
- Required before any real/anonymized customer pilot execution.

Before using real or anonymized customer evidence, confirm:

- Owner/prospect identity.
- Consent to store evidence in Shift Evidence.
- Consent to generate a report.
- Whether data is real, anonymized or synthetic.
- Whether output can be reused as an anonymous case.
- Retention window.
- Deletion process on request.
- NDA or confidentiality constraints.

Policy:

- No credentials.
- No production access credentials.
- No agents installed in customer environment.
- Customer-controlled evidence only.
- Evidence can be deleted on request.
- No public sharing.
- No model training on customer evidence.
- No cross-client reuse.
- Report/output confidential by default.
- Do not commit files.
- Do not paste evidence into docs or chat.
- Do not expose private reports publicly.

## 6. Pilot runbook

### Before

1. Confirm pilot owner and contact.
2. Confirm consent and NDA/confidentiality status.
3. Confirm evidence type: real, anonymized or synthetic.
4. Confirm what will be stored.
5. Confirm deletion/cleanup plan.
6. Confirm no migration is executed.
7. Confirm no production access is requested.
8. Confirm no agents or collectors are installed.
9. Confirm no payment is required during pilot unless separately approved.
10. Confirm success criteria and expected next step.

### During

1. Show homepage.
2. Show demo replay.
3. Show demo workspace.
4. Show public sample report.
5. Explain pricing at a high level without collecting payment.
6. Create pilot assessment only after consent.
7. Complete minimum intake.
8. Upload evidence only if customer-safe and approved.
9. Review evidence status/history.
10. Generate or review output if applicable.
11. Review report quality.
12. Check admin/logs without exposing secrets.

### After

1. Ask for feedback.
2. Record friction points.
3. Record security concerns.
4. Record missing evidence/questions.
5. Record report quality comments.
6. Record whether they would pay.
7. Record preferred next step.
8. Record bugs or product gaps.
9. Define cleanup timing.
10. Confirm no public sharing.

## 7. Pilot invitation package

Short invite draft:

```text
We are running a controlled Shift Evidence pilot to validate VMware-to-Proxmox readiness reporting with safe evidence only.

The pilot does not require payment, does not perform any migration, does not install agents, and does not need production credentials. You can use synthetic, anonymized, or explicitly approved customer-safe evidence.

Goal: understand whether the report is useful, credible, and actionable enough to support a paid assessment or migration planning conversation.
```

Evidence checklist for pilot:

- RVTools export or equivalent inventory file only if approved.
- No passwords.
- No secrets.
- No private keys.
- No production credentials.
- No unnecessary customer identifiers.
- Prefer anonymized hostnames/IPs if possible.
- Confirm whether screenshots or notes are allowed.
- Confirm cleanup request window.

Call script:

1. What are you trying to migrate or assess?
2. What would make a readiness report useful?
3. What would make you trust or distrust the output?
4. Which risks matter most: technical, cost, downtime, skills, rollback?
5. Would this be more useful as Starter, Professional or MSP/Blueprint?
6. What is missing before you would pay?
7. What next step would feel natural?

## 8. Criteria de exito

Producto:

- User understands the value proposition in under 5 minutes.
- Demo/workspace helps explain value.
- Sample report builds trust.
- Upload/intake feels manageable.
- Output feels professional.
- Risks/gaps are understandable.
- Product does not imply automatic migration.

Comercial:

- Prospect agrees the value can be paid.
- Prospect understands Starter / Professional / Blueprint/MSP difference.
- Prospect sees report value.
- Prospect accepts a next step: call, pilot, paid assessment or MSP discussion.

Operativo:

- Upload OK if used.
- R2 OK if used.
- Admin visibility OK.
- Logs clean.
- No 500.
- No rate-limit accidental.
- No data exposure.

## 9. Technical smoke

Production smoke performed without real customer data.

Public:

| Route | Resultado |
| --- | --- |
| `/` | `200 OK` |
| `/demo` | `200 OK` |
| `/demo/replay` | `200 OK` |
| `/demo/workspace` | `200 OK` |
| `/sample-report` | `200 OK` |
| `/pricing` | `200 OK` |
| `/vmware-to-proxmox-readiness` | `200 OK` |

Auth:

| Route | Resultado |
| --- | --- |
| `/sign-in` | `200 OK` |
| `/dashboard` unauthenticated | `307` to `/sign-in` |

Admin unauthenticated:

| Route | Resultado |
| --- | --- |
| `/dashboard/admin` | `307` to `/sign-in` |
| `/dashboard/admin/billing` | `307` to `/sign-in` |

Billing pages:

| Route | Resultado |
| --- | --- |
| `/billing/checkout/starter` | `200 OK` |
| `/billing/checkout/professional` | `200 OK` |
| `/billing/checkout/msp` | `200 OK` |
| `/billing/bank-transfer/starter` | `200 OK` |
| `/billing/bank-transfer/professional` | `200 OK` |
| `/billing/bank-transfer/msp` | `200 OK` |

Checkout safe-off:

| Route | Resultado |
| --- | --- |
| `/billing/checkout/starter/start` | `303` to `checkout_disabled` |
| `/billing/checkout/professional/start` | `303` to `checkout_disabled` |
| `/billing/checkout/msp/start` | `303` to `checkout_disabled` |

No Stripe hosted checkout was reached.
No payment session was created.

## 10. Feedback capture template

| Area | Pregunta | Respuesta | Severidad | Accion |
| --- | --- | --- | --- | --- |
| Product clarity | Can the prospect explain the value after 5 minutes? | pending | TBD | Capture during pilot |
| Trust | Does the sample report feel credible? | pending | TBD | Capture during pilot |
| Report quality | What section is most/least useful? | pending | TBD | Capture during pilot |
| Pricing | Which package feels aligned? | pending | TBD | Capture during pilot |
| Upload friction | Is evidence upload acceptable? | pending | TBD | Capture during pilot |
| Security | What data/security concern blocks adoption? | pending | TBD | Capture during pilot |
| Missing evidence | What else would they need to provide? | pending | TBD | Capture during pilot |
| Migration plan | Does the plan support decision-making? | pending | TBD | Capture during pilot |
| Readiness score | Is the score understandable? | pending | TBD | Capture during pilot |
| Willingness to pay | Would they pay for this now? | pending | TBD | Capture during pilot |
| Next step | What is the next committed action? | pending | TBD | Capture during pilot |

## 11. Evidence used

This hito used:

- No real customer data.
- No real RVTools.
- No customer files.
- No customer hostnames.
- No customer emails.
- No customer IPs.
- No uploaded evidence.

Recommended first execution:

- Synthetic extended dataset or explicitly anonymized customer-safe export.

## 12. Issues / blockers

Blockers to real pilot execution:

- Need a named prospect or friendly customer.
- Need explicit consent.
- Need confirmed evidence type.
- Need retention/cleanup agreement.

Non-blockers:

- Production runtime is technically ready.
- DNS is aligned.
- Billing is safe-off.
- R2/DB/Upstash are ready.

## 13. Commercial signal

Commercial signal captured in this hito:

- Not yet captured from a real prospect.

Prepared to capture:

- Value comprehension.
- Trust in report.
- Pricing fit.
- Willingness to pay.
- Next-step commitment.

## 14. No live payment

Confirmed:

- No Stripe live payment.
- No checkout live.
- No card.
- No payment.
- No grant.
- No entitlement.
- No mark paid.
- Bank transfer remains manual only.

If a customer wants to pay:

- Use manual invoice / Wise process only after explicit owner approval.
- Do not activate Stripe live payment without separate hito.

## 15. Cleanup status

No cleanup required from this hito because:

- No assessment was created.
- No evidence was uploaded.
- No customer data was stored.
- No report was generated with customer data.

Future pilot cleanup checklist:

- Delete uploaded evidence if requested.
- Confirm assessment retention or deletion.
- Remove local temporary files.
- Do not keep customer files outside the app.
- Document cleanup without exposing data.

## 16. Security review

Confirmed:

- No secrets.
- No customer data in docs.
- No real RVTools.
- No sensitive IPs.
- No real customer hostnames.
- No unauthorized real emails.
- No production admin email.
- No DNS changes.
- No Hostinger changes.
- No DB destructive.
- No migrations.
- No `db push`.
- No payments.
- No grants.
- No public launch.
- No Google Ads.

## 17. Estado final

| Area | Estado final |
| --- | ---: |
| CUSTOMER-PILOT-1 | 100% |
| Pilot readiness | 95% |
| Production/cutover readiness | 100% |
| Commercial readiness | 82% |
| General technical | 99% |

Status:

- Pilot package ready.
- Real pilot execution deferred until prospect/dataset/consent are provided.

## 18. Next hito

Recommended:

- `PILOT-EXECUTION-1` once a prospect or approved dataset is available.

Other possible next steps:

- `GOOGLE-ADS-LAUNCH-PREP-1`.
- `PILOT-FEEDBACK-HOTFIX-1` after feedback.
- `STRIPE-LIVE-PAYMENT-FINAL-GATE-1` only if/when a real payment test is explicitly approved.
- `PUBLIC-LAUNCH-CONTROLLED` only after pilot learning.

## 19. Follow-up: Market Activation 3-4-5

Fecha: 2026-06-05

`MARKET-ACTIVATION-3-4-5` revisited pilot execution and kept the same safety decision:

- Pilot execution remains blocked pending prospect/dataset/consent.
- No real customer data was used.
- No evidence upload was executed for a real customer.
- No real feedback was captured yet.
- Next pilot action remains `PILOT-EXECUTION-1`.

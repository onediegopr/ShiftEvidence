# BILLING-2.5C - Lemon Squeezy Account Setup

Date: 2026-05-31

## 1. Status

Status: PARCIAL / BLOQUEADO.

Lemon Squeezy dashboard access was verified through the in-app browser. The store exists, but the setup checklist shows identity activation and bank/payout setup still pending. Per the hito safety instructions, product creation, variant creation and API key creation were not performed.

## 2. Store

Store verified: yes.

Store name: Shift Evidence.

Store URL: `https://shiftevidence.lemonsqueezy.com/`

Store ID: `393386`

Dashboard observed: `https://app.lemonsqueezy.com/dashboard`

## 3. Onboarding / KYC / payout status

Setup checklist observed:

- Create your store: present as completed/available.
- Fine tune your store settings: present.
- Verify your identity: pending.
- Activate Store: pending.
- Set up two-factor authentication: pending.
- Create your first product: pending.
- Connect a bank account: pending.

Because identity verification and payout/bank setup are visible as required setup steps, this pass stopped before creating products or API keys.

## 4. Products

Products page observed: empty state.

No products were created.

Planned products after manual account activation:

| Product | Price | Type | Status |
| --- | ---: | --- | --- |
| Starter Readiness | USD 490 | One-time payment | Pending |
| Professional Assessment | USD 1,500 | One-time payment | Pending |
| MSP Partner | USD 399/month | Monthly subscription | Pending |

Migration Blueprint remains invoice/manual scope only. No Lemon checkout product should be created for it yet.

## 5. IDs

| Item | Value |
| --- | --- |
| `LEMON_SQUEEZY_STORE_ID` | `393386` |
| Starter Product ID | Pending |
| Starter Variant ID | Pending |
| Professional Product ID | Pending |
| Professional Variant ID | Pending |
| MSP Product ID | Pending |
| MSP Variant ID | Pending |

## 6. Checkout URLs

No checkout URLs were created or captured.

The app currently uses local placeholder routes only:

- `/billing/checkout/starter`
- `/billing/checkout/professional`
- `/billing/checkout/msp`

## 7. API key

API key created: no.

Reason: account setup shows identity activation and payout/bank setup pending. No API key was generated in this pass.

When ready, create the key manually in Lemon Squeezy Settings -> API and store it as a secure local/user environment variable. Do not paste it into chat, docs, Git, `.env`, or terminal output.

## 8. Env strategy

App-side env names currently documented:

- `LEMON_SQUEEZY_STORE_ID`
- `LEMON_SQUEEZY_API_KEY`
- `LEMON_STARTER_VARIANT_ID`
- `LEMON_PROFESSIONAL_VARIANT_ID`
- `LEMON_MSP_VARIANT_ID`

Observed MCP/package env name from prior setup notes:

- `LEMONSQUEEZY_API_KEY`

Recommendation: keep the difference documented for now and do not modify app code without a separate approval.

Future options:

1. Maintain dual alias support in server billing config.
2. Standardize app env to `LEMON_SQUEEZY_API_KEY` and keep MCP env as `LEMONSQUEEZY_API_KEY`.
3. Use a secret-command pattern for MCP only.

## 9. MCP status

Lemon MCP connected: no.

Reason: no Lemon API key is configured in the current Codex tool environment, and no Lemon MCP tools are currently exposed through tool discovery.

Read-only MCP calls were not executed.

## 10. Wise

Wise touched: no.

Wise remains reserved for manual invoice / bank transfer operations. No recipients, transfers, balances, quotes or payout flows were touched.

## 11. What was not done

- No Lemon products created.
- No variants created.
- No checkout URLs created.
- No API key created.
- No API key printed.
- No webhooks.
- No payments.
- No test payments.
- No DB.
- No Hostinger.
- No deploy.
- No entitlement automation.

## 12. Next step

Manual owner action:

1. Complete Lemon identity verification.
2. Complete store activation requirements.
3. Decide whether to connect bank/payout now or defer until before real payments.
4. Return to BILLING-2.5C product creation only after legal/tax/payout blockers are cleared or explicit approval is given to create products while activation remains pending.

Recommended next hito after manual activation:

BILLING-2.5D - Lemon products and variants creation, no app integration.

## 13. Runtime env update

Date: 2026-05-31

User confirmed that Lemon Squeezy environment variables were added manually in
Hostinger so the application can use them.

No secret values were copied into this document.

Expected runtime variables:

- `LEMON_SQUEEZY_STORE_ID`
- `LEMON_SQUEEZY_API_KEY`
- `LEMON_STARTER_VARIANT_ID`
- `LEMON_PROFESSIONAL_VARIANT_ID`
- `LEMON_MSP_VARIANT_ID`

Compatibility variable supported by code:

- `LEMONSQUEEZY_API_KEY`

Checkout behavior after code wiring:

- `/billing/checkout/starter` can start Lemon checkout only if Starter variant is configured.
- `/billing/checkout/professional` can start Lemon checkout only if Professional variant is configured.
- `/billing/checkout/msp` can start Lemon checkout only if MSP variant is configured.
- Missing variables degrade to invoice/support.
- Checkout creation defaults to Lemon `test_mode` unless
  `LEMON_SQUEEZY_CHECKOUT_MODE=live` is explicitly configured.

Still not implemented:

- webhooks;
- automatic entitlement grant;
- DB billing ledger;
- subscription reconciliation;
- production payment smoke;
- full public launch declaration.

## 14. Production smoke and redirect origin hardening

Date: 2026-05-31

BILLING-2.7 production smoke observed:

- `/billing/checkout/starter`: GET 200.
- `/billing/checkout/professional`: GET 200.
- `/billing/checkout/msp`: GET 200.
- POST start routes returned `error=not_configured`.
- No external Lemon checkout was created.
- No live payment was attempted.

Issue:

- Fallback POST redirects used an internal origin: `https://0.0.0.0:3000/...`.

Cause:

- The route used the raw request URL as redirect base, and Hostinger/Next can
  expose the internal listener origin to the app runtime.

Fix strategy:

- Resolve checkout origin server-side from trusted public env vars first.
- Sanitize forwarded host/proto headers.
- Reject internal hosts.
- Fall back to `https://shiftevidence.com`.

Required runtime variables remain:

- `LEMON_SQUEEZY_STORE_ID`
- `LEMON_SQUEEZY_API_KEY` or `LEMONSQUEEZY_API_KEY`
- `LEMON_STARTER_VARIANT_ID`
- `LEMON_PROFESSIONAL_VARIANT_ID`
- `LEMON_MSP_VARIANT_ID`

Hostinger verification note:

- Codex did not have a local `HOSTINGER_API_TOKEN`, so Hostinger env vars could
  not be read through the Hostinger API in this pass.
- No env values or secrets were printed or stored.

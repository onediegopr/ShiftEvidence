# BILLING-2.5C - Lemon Squeezy Account Setup

Date: 2026-05-31

## BILLING-4 update

Lemon Squeezy is now legacy-disabled after provider rejection of the offering as services. Do not create new Lemon checkouts or treat Lemon as the active card checkout provider. Historical Lemon notes are retained for audit continuity only.

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

## 12.1 BILLING-2.5D products and variants

Date: 2026-05-31

Status: COMPLETE.

Execution channel: Codex in-app browser, using the authenticated Lemon Squeezy
dashboard session.

Store settings update:

- Store currency changed from `EUR - Euro` to `USD - US Dollar` before creating
  products, because Shift Evidence pricing is defined in USD.
- Store remains in Lemon test mode / activation review state.
- No live payment was attempted.

Products created:

| Product | Product ID | Variant ID | Price | Type | Status | Test mode |
| --- | ---: | ---: | ---: | --- | --- | --- |
| Starter Readiness | `1104338` | `1729500` | USD 490 | One-time payment | Published | Yes |
| Professional Assessment | `1104341` | `1729505` | USD 1,500 | One-time payment | Published | Yes |
| MSP Partner | `1104343` | `1729507` | USD 399/month | Monthly subscription | Published | Yes |

Checkout links captured from Lemon Share UI:

| Product | Checkout link |
| --- | --- |
| Starter Readiness | `https://shiftevidence.lemonsqueezy.com/checkout/buy/9e17f01b-0b71-49bf-8529-8f35769942f4` |
| Professional Assessment | `https://shiftevidence.lemonsqueezy.com/checkout/buy/5dd5eb33-f338-4fcc-9f56-e393afb851b9` |
| MSP Partner | `https://shiftevidence.lemonsqueezy.com/checkout/buy/e53ba505-2df4-4b2f-bb38-dfd13d37b2eb` |

Runtime env values to configure outside Git/docs:

| Env var | Value |
| --- | --- |
| `LEMON_SQUEEZY_STORE_ID` | `393386` |
| `LEMON_STARTER_VARIANT_ID` | `1729500` |
| `LEMON_PROFESSIONAL_VARIANT_ID` | `1729505` |
| `LEMON_MSP_VARIANT_ID` | `1729507` |

Safety confirmation:

- No API key was printed or written.
- No webhooks were created.
- No DB changes were made.
- No Hostinger changes were made.
- No app code was changed.
- No live checkout mode was enabled.
- No payment or test payment was completed.

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

## 15. BILLING-2.8 production Lemon test-mode checkout smoke

Date: 2026-05-31

Status: BLOCKED / NOT CONFIGURED IN PRODUCTION RUNTIME.

Goal:

- Verify production can create Lemon Squeezy checkout sessions in test mode
  after Hostinger env vars were added manually.

GET production routes:

| Route | Result | Notes |
| --- | --- | --- |
| `/billing/checkout/starter` | 200 OK | Page loaded, runtime state still `Not configured`. |
| `/billing/checkout/professional` | 200 OK | Page loaded, runtime state still `Not configured`. |
| `/billing/checkout/msp` | 200 OK | Page loaded, runtime state still `Not configured`. |

POST start routes:

| Route | Result | Redirect |
| --- | --- | --- |
| `/billing/checkout/starter/start` | 303 See Other | `/billing/checkout/starter?error=not_configured` |
| `/billing/checkout/professional/start` | 303 See Other | `/billing/checkout/professional?error=not_configured` |
| `/billing/checkout/msp/start` | 303 See Other | `/billing/checkout/msp?error=not_configured` |

Findings:

- Production did not create external Lemon checkout sessions.
- Production still reports missing server-side Lemon configuration.
- Because all three plans fail before reaching Lemon, test mode and checkout
  prices could not be confirmed from a hosted Lemon checkout page.
- The old internal-origin issue is fixed: no `0.0.0.0` redirect was observed.
- Public checkout HTML did not expose Lemon API keys, bearer tokens, JWTs, or
  secret-looking values.

Likely next checks:

- Confirm the production runtime process has the updated env vars loaded, not
  only saved in Hostinger settings.
- Confirm `LEMON_SQUEEZY_API_KEY` is available to the runtime without printing
  its value.
- Confirm a redeploy/restart occurred after adding:
  - `LEMON_SQUEEZY_STORE_ID=393386`
  - `LEMON_STARTER_VARIANT_ID=1729500`
  - `LEMON_PROFESSIONAL_VARIANT_ID=1729505`
  - `LEMON_MSP_VARIANT_ID=1729507`
  - `LEMON_SQUEEZY_CHECKOUT_MODE=test`
  - `NEXT_PUBLIC_APP_URL=https://shiftevidence.com`
  - `BETTER_AUTH_URL=https://shiftevidence.com`

Safety confirmation:

- No live mode was enabled.
- No payment was attempted.
- No card data was entered.
- No webhooks, DB changes, Hostinger changes, deploys, entitlements, code
  changes, commits, or pushes were performed.

## 16. BILLING-2.8A Hostinger runtime env reload and checkout smoke

Date: 2026-05-31

Status: COMPLETE.

Execution channel:

- Hostinger hPanel through Codex in-app browser.
- No Hostinger API token was used.
- No secrets were printed or written to docs.

Initial production issue:

- GET checkout pages returned 200.
- POST checkout start routes returned `error=not_configured`.

Hostinger env verification:

| Variable | Status |
| --- | --- |
| `LEMON_SQUEEZY_STORE_ID` | Present, expected value confirmed. |
| `LEMON_SQUEEZY_API_KEY` | Present, configured. Value not copied. |
| `LEMONSQUEEZY_API_KEY` | Present, configured. Value not copied. |
| `LEMON_STARTER_VARIANT_ID` | Missing initially; added with approved non-secret variant id. |
| `LEMON_PROFESSIONAL_VARIANT_ID` | Missing initially; added with approved non-secret variant id. |
| `LEMON_MSP_VARIANT_ID` | Missing initially; added with approved non-secret variant id. |
| `LEMON_SQUEEZY_CHECKOUT_MODE` | Missing initially; added as `test`. |
| `NEXT_PUBLIC_APP_URL` | Present, expected value confirmed. |
| `BETTER_AUTH_URL` | Present, expected value confirmed. |

Action:

- Added the missing Lemon variant and checkout-mode env vars in Hostinger.
- Ran `Guardar y hacer redeploy` from hPanel.
- New deployment completed and became current.

Post-redeploy smoke:

| Route | GET | POST start |
| --- | --- | --- |
| `/billing/checkout/starter` | 200, ready state | 303 to Lemon checkout |
| `/billing/checkout/professional` | 200, ready state | 303 to Lemon checkout |
| `/billing/checkout/msp` | 200, ready state | 303 to Lemon checkout |

Lemon checkout verification:

| Plan | Lemon checkout | Test mode | Price |
| --- | --- | --- | --- |
| Starter Readiness | Created | Confirmed | `490,00 US$` |
| Professional Assessment | Created | Confirmed | `1500,00 US$` |
| MSP Partner | Created | Confirmed | `399,00 US$` billed monthly |

Safety confirmation:

- Live mode was not enabled.
- No payment was completed.
- No card data was entered.
- No webhooks were created.
- No DB changes were made.
- No entitlement automation was added.
- No code was changed.
- No `0.0.0.0` origin was observed.
- Public checkout pages did not expose API keys, bearer tokens, JWTs, or
  secret-looking values.

# Billing MCP account setup

Date: 2026-05-31

Scope: BILLING-2.5A - Lemon Squeezy and Wise MCP connection setup only.

This document records the current MCP connection status and the safe manual steps
needed before any billing product, checkout, payment, recipient, transfer, or app
integration work begins.

## Guardrails

- Do not paste API tokens into chat.
- Do not commit API tokens.
- Do not add real token values to `.env`, `.env.local`, `.env.example`, docs, or README.
- Do not create Lemon products in this setup hito.
- Do not create Wise transfers, recipients, quotes intended for real movement, or payments.
- Do not touch DB schema, Hostinger config, deploys, or production runtime.
- Prefer sandbox/read-only verification first.

## MCP inventory

### Lemon Squeezy

- Codex MCP server name: `lemonsqueezy`
- Status in Codex config: installed and enabled
- Transport: stdio
- Command: `npx`
- Args: `-y @yawlabs/lemonsqueezy-mcp@latest`
- Package observed: `@yawlabs/lemonsqueezy-mcp` version `0.10.11`
- Current connection status: not connected
- Reason: API key is not configured
- Required variable: `LEMONSQUEEZY_API_KEY`
- Optional safer variable: `LEMONSQUEEZY_API_KEY_COMMAND`
- Optional test variable: `LEMONSQUEEZY_TEST_API_KEY`
- Current configured non-secret guardrails:
  - `LEMONSQUEEZY_DISABLE_CLASSES`
  - `LEMONSQUEEZY_DESTRUCTIVE_RATE_LIMIT`
  - `LEMONSQUEEZY_LOG`

Observed tool coverage from package docs:

- Read/account: `ls_get_user`, `ls_list_stores`, `ls_get_store`
- Products: `ls_list_products`, `ls_get_product`
- Variants/prices/files: list/get tools
- Orders/invoices/subscriptions: list/get tools plus refund/cancel/update tools
- Customers/license keys/webhooks/checkouts: read and mutation tools

Important: this MCP can create checkouts, discounts, customers, usage records,
webhooks, and can perform destructive billing actions such as refunds or
subscription changes. Keep destructive classes disabled until BILLING-2.5B+.

### Wise

- Codex MCP server name: `wise`
- Status in Codex config: installed and enabled
- Transport: stdio
- Command: `npx`
- Args: `-y wise-mcp-server@latest`
- Package observed: `wise-mcp-server` version `0.5.0`
- Current connection status: not connected
- Reason: API token is not configured
- Required variable for stdio: `WISE_API_TOKEN`
- Current configured non-secret variables:
  - `MCP_TRANSPORT=stdio`
  - `WISE_API_URL=https://api.sandbox.transferwise.tech`
  - `LOG_LEVEL=error`
- Recommended mode now: sandbox
- Production mode: defer until after sandbox verification and explicit approval

Observed tool coverage from package docs:

- Profiles: `listProfiles`
- Balances: `getBalance`
- Quotes: `createQuote`, `createQuoteUnauthenticated`, `getQuote`, `updateQuote`
- Recipients: `listRecipients`, `getRecipient`, `createRecipient`, `deactivateRecipient`
- Requirements: `accountRequirements`

Important: this MCP includes tools that can prepare real financial workflows.
Do not create recipients or transfers in this hito.

## Current Codex exposure

After restart, Codex CLI sees both MCP servers as enabled. However, Codex tool
discovery did not expose Lemon or Wise tools yet.

Likely cause:

- Lemon is missing `LEMONSQUEEZY_API_KEY`.
- Wise is missing `WISE_API_TOKEN`.

Expected after secrets are configured and Codex is restarted:

- Lemon tool search should expose `ls_get_user` and `ls_list_stores`.
- Wise tool search should expose `listProfiles`.

## Manual setup: Lemon Squeezy

1. Open Lemon Squeezy in the browser.
2. Go to Account or Settings.
3. Open API settings.
4. Create a new API key for Codex/MCP setup.
5. Name suggestion: `Codex MCP billing setup`.
6. Copy the key once.
7. Do not paste it into chat.
8. Store it as a local user secret or user environment variable.

Recommended first-pass Windows setup without terminal history:

1. Press Start.
2. Search: `Edit environment variables for your account`.
3. Open `Environment Variables`.
4. Under User variables, click `New`.
5. Variable name: `LEMONSQUEEZY_API_KEY`
6. Variable value: paste the Lemon key.
7. Save.
8. Restart Codex completely.

Alternative for stricter secret handling:

- Use `LEMONSQUEEZY_API_KEY_COMMAND` to read from a vault/secret manager.
- This avoids writing the raw key into Codex config.
- We can set this up later with Windows SecretManagement, 1Password, or another vault.

Safe verification after restart:

1. Run `codex mcp list`.
2. Search tools for `ls_get_user ls_list_stores`.
3. Call only read-only tools:
   - `ls_get_user`
   - `ls_list_stores`
4. Record safe results only:
   - account detected: yes/no
   - store id: if returned
   - products: list count/names only if already present

Do not call:

- `ls_create_checkout`
- `ls_refund_order`
- `ls_create_customer`
- `ls_update_subscription`
- `ls_cancel_subscription`
- webhook mutation tools

## Manual setup: Wise

Use sandbox first.

1. Open Wise Platform in the browser.
2. Go to API tokens/developer settings.
3. Select or create a sandbox token first.
4. Copy the token once.
5. Do not paste it into chat.
6. Store it as a local user secret or user environment variable.

Recommended first-pass Windows setup without terminal history:

1. Press Start.
2. Search: `Edit environment variables for your account`.
3. Open `Environment Variables`.
4. Under User variables, click `New`.
5. Variable name: `WISE_API_TOKEN`
6. Variable value: paste the Wise sandbox token.
7. Confirm `WISE_API_URL` remains sandbox:
   - `https://api.sandbox.transferwise.tech`
8. Save.
9. Restart Codex completely.

Production Wise token:

- Do not configure production token yet.
- Only consider production after sandbox profile/balance reads are verified.
- Any production action requires a separate approval gate.

Safe verification after restart:

1. Run `codex mcp list`.
2. Search tools for `listProfiles`.
3. Call only read-only tools:
   - `listProfiles`
   - optionally `getBalance` for a selected sandbox profile
4. Record safe results only:
   - business profile detected: yes/no
   - profile id: if returned
   - currencies/balances: summary only

Do not call:

- `createRecipient`
- `deactivateRecipient`
- `createQuote` for real payment flows
- any transfer/payment movement flow

## IDs pending

- Lemon store id: pending
- Lemon existing products: pending
- Wise business profile id: pending
- Wise sandbox profile id: pending
- Wise production profile id: not requested in this hito

## BILLING-2.5B checklist

Only start after Lemon and Wise read-only MCP verification passes.

- Lemon MCP connected with read-only verification.
- Lemon store id recorded.
- Wise MCP connected in sandbox.
- Wise sandbox profile id recorded.
- Destructive Lemon classes remain disabled unless explicitly approved.
- Wise production token remains unconfigured unless explicitly approved.
- No app code changes before billing architecture review.
- No products created before product/pricing decision.
- No checkouts created before product ids and plans are approved.
- No transfer automation.

## Current decision

Status: partial / blocked by missing credentials.

No secrets were printed, written to repo, or committed during this setup pass.

## BILLING-2.5B read-only verification attempt

Date: 2026-05-31

Scope: verify Lemon Squeezy and Wise MCP connections after credential setup,
using read-only calls only.

Result: blocked.

Findings:

- Codex still sees both MCP servers as installed and enabled.
- `LEMONSQUEEZY_API_KEY` is not present in the current Codex process.
- `LEMONSQUEEZY_API_KEY` is not present as a Windows user variable.
- `LEMONSQUEEZY_API_KEY` is not present as a Windows machine variable.
- `LEMONSQUEEZY_API_KEY_COMMAND` is not present.
- `WISE_API_TOKEN` is not present in the current Codex process.
- `WISE_API_TOKEN` is not present as a Windows user variable.
- `WISE_API_TOKEN` is not present as a Windows machine variable.
- `WISE_API_URL` is configured in Codex MCP config for sandbox, but is not
  exported as a general Windows environment variable.

Read-only verification performed:

- Lemon account/user: not executed because authentication is missing.
- Lemon stores: not executed because authentication is missing.
- Lemon products: not executed because authentication is missing.
- Wise profiles: not executed because authentication is missing.
- Wise balances/currencies: not executed because authentication is missing.

Current connection status:

- Lemon MCP connected: no
- Lemon store id: pending
- Lemon products: pending
- Wise MCP connected: no
- Wise sandbox profile id: pending

Manual action required before retry:

1. Add `LEMONSQUEEZY_API_KEY` as a Windows user environment variable, or configure
   `LEMONSQUEEZY_API_KEY_COMMAND` to read it from a vault.
2. Add `WISE_API_TOKEN` as a Windows user environment variable, using a sandbox
   token first.
3. Restart Codex completely after saving the variables.
4. Retry BILLING-2.5B.

Safety confirmation:

- No tokens were printed.
- No tokens were written to this document.
- No products, checkouts, recipients, quotes, transfers, DB changes, Hostinger
  changes, deploys, commits, or pushes were performed.

## BILLING-2.5C browser setup attempt

Date: 2026-05-31

Scope: verify Lemon Squeezy account/store state through browser, prepare products
only if no legal/tax/payout blocker appears, and do not integrate app code.

Result: partial / blocked.

Findings:

- Lemon dashboard access verified.
- Store exists: `Shift Evidence`.
- Store URL: `https://shiftevidence.lemonsqueezy.com/`
- Store ID: `393386`
- Products page shows empty state: no products created yet.
- Setup checklist shows pending identity/store activation.
- Setup checklist shows pending bank account / payout setup.
- Because identity and payout setup are visible blockers, product creation,
  variant creation and API key creation were not performed.

MCP discrepancy:

- Prior MCP notes indicate the MCP package expects `LEMONSQUEEZY_API_KEY`.
- App billing architecture currently documents `LEMON_SQUEEZY_API_KEY`.
- No code was changed in this pass.
- Recommended future decision: either support both aliases in app/server config,
  or keep MCP and app env names separate and document the distinction.

Read-only MCP verification:

- Not executed.
- Tool discovery did not expose Lemon Squeezy MCP tools in this session.
- No API key was created or configured.

Safety confirmation:

- No API key was created.
- No API key was printed.
- No products were created.
- No variants were created.
- No checkout URLs were created.
- No webhooks were created.
- No payments or test payments were created.
- No DB, Hostinger, deploy or entitlement changes were performed.

## BILLING runtime wiring note

Date: 2026-05-31

User later confirmed Lemon Squeezy environment variables were added manually in
Hostinger for application runtime use.

Codex local process still should not rely on chat-provided secrets. The MCP key
must be available as an environment variable before any local read-only MCP
verification can run.

Runtime/app code now supports:

- `LEMON_SQUEEZY_API_KEY`
- `LEMONSQUEEZY_API_KEY`

The MCP package remains expected to use:

- `LEMONSQUEEZY_API_KEY`

No secret value was documented.

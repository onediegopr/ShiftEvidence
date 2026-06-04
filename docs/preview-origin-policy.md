# Preview Origin Policy

Date: 2026-06-04

## Objective

Allow controlled Vercel Preview auth and checkout-test smoke without trusting every `*.vercel.app` deployment and without changing production, DNS, Stripe live payments, or storage buckets.

## Current Problem

Vercel Preview deployment URLs are generated per deploy. Before this hito:

- Better Auth trusted only localhost plus production domains.
- Checkout origin normalization accepted only `shiftevidence.com` and `www.shiftevidence.com`.
- A Vercel Preview URL could serve public pages, but auth and checkout-test origin behavior was not full-fidelity.
- Allowing all `*.vercel.app` would be too broad.

## Decision

Use explicit preview origins configured by environment variable.

Environment variable:

```env
PREVIEW_TRUSTED_ORIGINS=
```

Rules:

- Comma-separated list.
- Exact origins only.
- No wildcards.
- No paths.
- No query strings.
- No fragments.
- No non-localhost `http`.
- No blanket `vercel.app` trust.

Example:

```env
PREVIEW_TRUSTED_ORIGINS=https://infrashift-r2-recovery-l9ouu5d5g-shift-evidence.vercel.app
```

## Auth Behavior

Trusted auth origins now include:

- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `https://shiftevidence.com`
- `https://www.shiftevidence.com`
- Exact origins listed in `PREVIEW_TRUSTED_ORIGINS`

This allows a controlled preview URL to participate in Better Auth origin checks without trusting arbitrary Vercel deployments.

## Checkout Behavior

Checkout public origin normalization now uses the same trusted origin policy.

Accepted origins:

- Localhost development origins.
- Production origins.
- Exact preview origins listed in `PREVIEW_TRUSTED_ORIGINS`.

Rejected origins:

- Random `*.vercel.app` deployments not listed.
- Attacker-controlled domains.
- Preview origins with paths.
- Wildcards.
- External `http` origins.

If no trusted origin is found, checkout falls back to the safe production public origin rather than using request-controlled host data.

## Stripe Safety

This origin policy does not enable Stripe live.

Still required for any checkout session:

- Checkout must be configured.
- Stripe mode must be safe for the target environment.
- Live checkout remains blocked unless the separate live-approval gates are explicitly configured.

Preview origin trust only answers "is this app origin allowed?" It does not grant payments, orders, webhooks, or entitlements.

## Security Boundaries

Not changed:

- No production deploy.
- No DNS.
- No custom domain.
- No production database.
- No migrations.
- No production R2 bucket.
- No Stripe live.
- No live payments.
- No Wise transfers.
- No real webhooks.
- No real entitlements.
- No secrets in git.

## Vercel Preview Configuration

For a controlled Preview smoke:

1. Deploy or identify the exact Vercel Preview URL.
2. Set `PREVIEW_TRUSTED_ORIGINS` to that exact origin in Preview env.
3. Set `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` to the same preview origin for full-fidelity auth URLs.
4. Keep Stripe live flags disabled.
5. Keep R2 pointed at `shift-evidence-preview-evidence`.
6. Do not use wildcard origins.

If the Preview URL changes, update `PREVIEW_TRUSTED_ORIGINS`, `NEXT_PUBLIC_APP_URL`, and `BETTER_AUTH_URL` for the new Preview URL.

## Future Option

A stable `preview` or `staging` branch with a stable Vercel Preview alias would reduce per-deploy env churn.

No custom preview subdomain is part of this hito because DNS/custom-domain changes are explicitly out of scope.

## Tests

Covered by unit tests:

- Empty preview allowlist.
- Single explicit preview origin.
- Multiple comma-separated preview origins.
- Trimming and de-duplication.
- Wildcard rejection.
- Invalid URL rejection.
- Path rejection.
- External `http` rejection.
- Localhost allowance.
- Production origin allowance.
- Explicit preview origin allowance.
- Random Vercel deployment rejection.
- Checkout live gates remain separate from origin trust.

## What Not To Do

- Do not set `PREVIEW_TRUSTED_ORIGINS=https://*.vercel.app`.
- Do not trust every `vercel.app` host.
- Do not use request `Host` or `Origin` blindly.
- Do not enable Stripe live in Preview.
- Do not use production database credentials for Preview.
- Do not use the production R2 bucket for Preview.
- Do not change DNS for this milestone.

## Next Hito

Recommended:

- `VERCEL-PREVIEW-ORIGIN-SMOKE`

Alternative:

- `AUTHENTICATED-PREVIEW-SMOKE`

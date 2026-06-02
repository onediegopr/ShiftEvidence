# BROWSER-TOOLING-1 - Codex Chrome Native Host Repair / Smoke

Date: 2026-06-02
Status: attempted, tooling not ready
Scope: Codex browser tooling diagnostics for Chrome native host and browser-control smoke
Product code touched: no
Database touched: no
Hostinger touched: no
Billing touched: no
Deploy performed: no
Full public launch: NO

## Objective

Repair or verify Codex browser tooling so a later EVIDENCE-7.1B retry can perform authenticated browser QA for the Migration Recommendation Plan.

This hito does not validate the product and does not close EVIDENCE-7.1B.

## Summary

Chrome and the Codex Chrome Extension are present. The expected native host registry key exists under HKCU, the native host manifest exists, the manifest JSON is valid, the native host executable exists and the allowed origin includes the Codex Chrome Extension.

However, Codex browser control still fails before Chrome tab control is established with a local browser-runtime error:

```text
failed to write kernel assets: El sistema no puede encontrar la ruta especificada. (os error 3)
```

Because browser control did not initialize, `/sign-in` browser smoke was not executed and EVIDENCE-7.1B remains not closed.

## Diagnostics

Expected native host registry key:

```text
HKCU\Software\Google\Chrome\NativeMessagingHosts\com.openai.codexextension
```

Observed:

- HKCU native host key: present.
- HKLM native host key: absent.
- Manifest file: present under the local OpenAI extension directory.
- Manifest JSON: valid.
- Manifest `name`: `com.openai.codexextension`.
- Manifest `type`: `stdio`.
- Manifest executable path: present.
- Allowed origins: includes the expected Codex Chrome Extension origin.
- Chrome: installed and running.
- Codex Chrome Extension: installed and enabled in the selected Chrome profile.

The helper `check-native-host-manifest.js` reported `registryManifestPath: null` even though `reg query` and PowerShell registry APIs both found the HKCU default value. This suggests either a helper/runtime registry-read mismatch or a localized/default-value parsing issue, not necessarily a missing key.

## Repair Attempt

No manual registry repair was applied.

Reason:

- The Chrome plugin instructions explicitly say not to repair/install the native host manually from Codex.
- Registry and manifest checks already show the expected HKCU key and valid manifest.
- The remaining failure happens before browser control is established and appears to be the Codex browser runtime asset path issue.

Safe action taken:

- Reset the JavaScript/browser runtime once.
- Retried Chrome extension-backed browser control.

Result:

- Retry still failed before Chrome tab control with the same asset-path error.

## Browser Control Smoke

Result: failed before navigation.

Not completed:

- Chrome tab acquisition.
- Navigation to `http://127.0.0.1:3000/sign-in`.
- Page title/text read.
- Screenshot smoke.

No credentials were entered.

## Product Safety

Confirmed:

- No Shift Evidence application code changed.
- No DB schema or Prisma migration changed.
- No Hostinger config changed.
- No production deploy triggered.
- No billing, checkout, pricing or landing files touched.
- No secrets, cookies, tokens or env var values printed.
- EVIDENCE-7.1B remains NO CERRADO.

## Decision

BROWSER-TOOLING-1: NOT READY.

Reason:

- Native host registry/manifest appear present and valid.
- Codex browser runtime still fails with local asset-path initialization error before Chrome control.
- Browser smoke for `/sign-in` could not be executed.

## Next Step

Recommended next action:

- Reinstall or repair the Browser/Chrome plugin from the Codex plugin UI.
- If Codex offers a Chrome/native-host repair action, run it from the official UI instead of manually editing registry.
- Restart Codex and Chrome.
- Re-run:
  - Chrome installed/running check.
  - Extension installed/enabled check.
  - Native host manifest check.
  - Browser control smoke to `http://127.0.0.1:3000/sign-in`.

Only after browser control works should EVIDENCE-7.1B be retried.

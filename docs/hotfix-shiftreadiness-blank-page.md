# Hotfix: /shiftreadiness blank page

Date: 2026-05-25

## Symptom

The local app started on `http://localhost:3000`, but the public route `http://localhost:3000/shiftreadiness` was reported as a blank page in the browser.

## Route affected

- `/shiftreadiness`

## Reproduction

Commands used:

```powershell
npm run dev -- -p 3000
curl.exe -I http://localhost:3000/shiftreadiness
curl.exe http://localhost:3000/shiftreadiness
```

Observed server response before the fix:

- Status: `HTTP/1.1 200 OK`
- Content-Type: `text/html; charset=utf-8`
- HTML was not empty.
- HTML contained `ShiftReadiness`.
- HTML contained `main.shiftreadiness-page`.
- HTML contained the hero copy.

Headless Chrome rendered the page and produced a non-empty screenshot. Chrome DevTools Protocol did not capture a blocking React or hydration exception. The only browser-level error captured was a non-blocking `favicon.ico` 404.

## Root cause

Category: client/server boundary hardening.

`src/views/ShiftReadinessPage.tsx` was marked as a Client Component only to run a `useEffect` that mutated `document.title`, meta description, canonical link, and `document.documentElement.lang`.

Those values were already owned by the App Router route metadata in `src/app/shiftreadiness/page.tsx` and the root layout. This made the public marketing route depend on client runtime/hydration for metadata work that did not need client-side execution.

Because the server response was valid and visual rendering worked in headless Chrome, the blank page was not reproduced as a server-render failure. The safe fix was to remove the unnecessary client boundary and browser-only document mutation from the route view.

## Fix applied

Modified:

- `src/views/ShiftReadinessPage.tsx`

Changes:

- Removed `"use client"`.
- Removed `useEffect`.
- Removed direct `document` usage.
- Removed duplicate client-side metadata helpers.
- Kept the existing UI, copy, pricing, and layout unchanged.

The route now renders as a Server Component/static public page and no longer needs client JavaScript to stabilize metadata.

## Validation

Post-fix route checks:

- `/shiftreadiness` returned `HTTP/1.1 200 OK`.
- HTML contained `ShiftReadiness`.
- HTML contained `main.shiftreadiness-page`.
- HTML contained the hero copy.
- Headless Chrome screenshot showed the ShiftReadiness page content.
- DevTools Protocol captured no blocking React/runtime exception.

Final validation commands:

```powershell
npm run lint
npm run typecheck
npm run build
curl.exe -I http://localhost:3000/
curl.exe -I http://localhost:3000/shiftreadiness
curl.exe -I http://localhost:3000/sign-in
```

## Rollback

Rollback is limited to `src/views/ShiftReadinessPage.tsx`.

To revert:

1. Re-add `"use client"`.
2. Re-add the `useEffect` metadata mutation.
3. Re-add the `document` helper functions.

This is not recommended because App Router metadata already owns the page title, description, and canonical URL.

## Notes

- No database changes.
- No auth changes.
- No landing redesign.
- No `/shiftreadiness` redesign.
- No pricing changes.
- No product features added.

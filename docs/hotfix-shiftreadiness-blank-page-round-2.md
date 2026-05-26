# Hotfix round 2: /shiftreadiness blank in real browser

Date: 2026-05-25

## Why the previous hotfix was insufficient

The first hotfix validated the server response and headless Chrome rendering. The user later confirmed that the route still appeared blank in the real browser, which means headless rendering alone was not enough evidence.

Round 2 focused on real Chrome behavior, browser cache, stale development chunks, service workers, storage, CSS visibility, and hydration/runtime signals.

## Route affected

- `http://localhost:3000/shiftreadiness`

## Real-browser checks

Controlled Chrome normal window via DevTools Protocol:

- Document `/shiftreadiness`: `200`
- CSS chunk: `200`
- JS chunks: `200`
- Network failures: none
- DOM exists: yes
- Text `ShiftReadiness` in DOM: yes
- `main.shiftreadiness-page` exists: yes
- `body.clientHeight`: non-zero
- `main` visibility: visible
- `main` opacity: `1`
- Blocking console errors: none
- Non-blocking console/network issue: `favicon.ico` returned `404`

Controlled Chrome incognito window via DevTools Protocol:

- Document `/shiftreadiness`: `200`
- CSS chunk: `200`
- JS chunks: `200`
- DOM exists: yes
- Text content exists: yes
- Blocking console errors: none

Service worker / cache checks in controlled Chrome:

- Service workers for localhost: `0`
- Cache Storage keys for localhost: none
- Local/session storage in controlled profile: empty

## Cleanup performed

The local dev cache was cleaned because the symptom was compatible with stale Turbopack/Next development chunks in a real browser profile.

Commands:

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -LiteralPath .\.next -Recurse -Force
npx prisma generate
npm run dev -- -p 3000
```

After cleanup, Next recompiled `/shiftreadiness` successfully:

- `GET /shiftreadiness 200`

## Root cause

Category: browser/dev cache and stale runtime hardening.

No server-side failure was found. No CSS rule hiding the page was found. No hydration/runtime exception was captured in controlled Chrome normal or incognito sessions.

The app code was already hardened by the previous change that removed the unnecessary Client Component boundary from `src/views/ShiftReadinessPage.tsx`.

The remaining blank-page symptom in the user's real Chrome profile is most consistent with stale browser/dev cache or a profile-specific extension/cache state. The controlled normal and incognito Chrome sessions both render the page.

## Fix applied

Code fix retained from round 1:

- `src/views/ShiftReadinessPage.tsx` no longer depends on client-side `document` metadata mutation.
- `/shiftreadiness` now renders as a server/static public route.

Operational fix from round 2:

- stopped stale Node/Next dev processes;
- removed `.next`;
- regenerated Prisma Client;
- restarted `npm run dev -- -p 3000`;
- validated the route in controlled real Chrome and incognito.

## If the user's default Chrome profile still shows blank

Use this browser-side cleanup:

1. Open `http://localhost:3000/shiftreadiness`.
2. Open DevTools.
3. Network tab: enable `Disable cache`.
4. Hard refresh with `Ctrl + Shift + R`.
5. Application tab: clear site data for `localhost:3000`.
6. Application tab: unregister any service worker if one appears.
7. Application tab: clear Cache Storage, Local Storage, and Session Storage for `localhost:3000`.
8. Retest in incognito.
9. If incognito works and normal does not, disable browser extensions for localhost.

## Validation commands

```powershell
curl.exe -I http://localhost:3000/
curl.exe -I http://localhost:3000/shiftreadiness
curl.exe -I http://localhost:3000/sign-in
npm run lint
npm run typecheck
npm run build
```

## Rollback

Rollback is limited to:

- `src/views/ShiftReadinessPage.tsx`
- local `.next` cache cleanup

Do not restore the old Client Component metadata mutation unless there is a new confirmed requirement for client-side interactivity.

## Notes

- No database changes.
- No auth changes.
- No report/PDF/unlock changes.
- No landing redesign.
- No `/shiftreadiness` redesign.
- No pricing or copy changes.

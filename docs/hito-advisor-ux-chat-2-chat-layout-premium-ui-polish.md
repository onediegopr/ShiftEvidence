# HITO ADVISOR-UX-CHAT-2 - Chat Layout + Premium UI Polish

## Problem detected

The Senior Migration Advisor was functionally responding, but the conversation surface felt too tall and visually noisy. The main issues reported were:

- The panel occupied too much vertical space.
- Messages stayed visually high in the panel instead of keeping the newest exchange in focus.
- Help content, credits, suggested prompts, history, feedback, and input competed for attention.
- The composer did not feel anchored to the chat experience.
- `completed` and `failed` statuses were too prominent for routine conversation metadata.
- Long history could expand the page and reduce scanability.

## User visual evidence

Recent QA confirmed the Advisor could send real messages and receive Gemini responses with the `Internal QA` plan and `0 / 25 used` counter. The remaining issue was UX quality: the panel felt less premium than the functional state warranted.

## UX changes

- Reduced the Advisor shell width and spacing for a more compact executive panel.
- Reworked the usage strip to prioritize messages remaining, credits used, usage level, request credits, and billing placeholder state.
- Collapsed the long help block by default with a concise `details` summary.
- Preserved the "can help with" and "cannot do" guidance inside the collapsible helper.
- Kept suggested prompts as compact wrapping chips.
- Converted the conversation area into a bounded chat window with internal scroll.
- Added auto-scroll to the bottom when messages change or a response is pending.
- Made user and Advisor messages visually distinct with right/left alignment.
- Moved provider/model metadata into small secondary text.
- Reduced message status badges to compact secondary labels.
- Added a compact pending state while the Advisor is reviewing context.
- Made the composer sticky at the bottom of the Advisor console.
- Reduced textarea height and preserved the password/token/raw-file safety note.
- Kept feedback/errors visible but visually contained.
- Added a compact empty state focused on assessment evidence.

## Files modified

- `src/components/assessments/SeniorMigrationAdvisorPanel.tsx`
- `src/index.css`

## Preserved behavior

- Provider handling was not changed.
- Gemini/OpenCode fallback logic was not changed.
- Server actions were not changed.
- Prompt construction was not changed.
- Database schema and migrations were not changed.
- Entitlements and plan limits were not changed.
- Usage counters and request credits placeholder were preserved.
- Locked and exhausted states still disable input and prompt chips.
- Advisory disclaimers and safety guidance remain visible.

## Validation results

- `npx prisma validate`: passed after loading existing `.env.local` into the process. Initial run without local env failed because `DATABASE_URL` was absent from the shell.
- `npx prisma generate`: passed.
- `npm run test:run`: passed, 43 files and 184 tests.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed. Turbopack emitted a non-blocking existing NFT tracing warning related to `src/server/evidence/localStorageService.ts`.
- `npm run hostinger:diagnose`: passed with exit code 0. It reported expected absent shell environment variables because the diagnostic does not load `.env.local`.

## Risks pending

- A browser smoke test after deploy should confirm the exact visual fit with real long Advisor history.
- Memory Vault, RAG, billing real, pricing activation, and full public launch remain out of scope.
- The existing Turbopack NFT tracing warning should be tracked separately if it becomes noisy in CI or hosting.

## Next visual smoke

Use an assessment with multiple prior messages and verify:

- The newest exchange is visible at the bottom after send and response.
- The chat history scrolls internally instead of stretching the page.
- The sticky composer remains usable on desktop and mobile widths.
- Locked plans still show disabled prompt chips and disabled input.
- Failed or warning responses appear as compact notices, not dominant blocks.

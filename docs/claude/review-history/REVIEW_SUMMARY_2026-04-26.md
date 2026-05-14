# EOD Review — 2026-04-26

Project: Gather Round (Expo SDK 54 / React Native iOS app, local-only via AsyncStorage). Build-progress baseline taken from auto-memory. No prior `REVIEW_SUMMARY.md` existed, so nothing was rotated to `docs/claude/review-history/`.

## What I Found & Fixed

### Bugs
- **Hooks-order violation in `app/game/[id].tsx:46`** — a `useMemo(rankedPlayers)` call sat *after* the `if (!game) return ...` early return. Once the games array loaded and `game` flipped from `undefined` to a real object, React would see the hook count change and crash. Moved the `useMemo` above the early return at [app/game/[id].tsx:46](app/game/[id].tsx:46). High severity (latent crash on every game-detail entry on first load).
- **`app/session/result.tsx:212` — `useEffect` dep was a fresh object every render.** `winner` was rebuilt by `resolvePlayer()` on each render, so the dep array `[winner]` re-fired and reset the 4-second auto-advance timer on any re-render. Switched the dep to the stable `winnerId` string (`session?.winner`) and added the missing `reset`/`router` deps at [app/session/result.tsx:213-227](app/session/result.tsx:213).
- **`Card`/`PrimaryButton`/`GhostButton` style props rejected style arrays** — typed as `ViewStyle` instead of `StyleProp<ViewStyle>`, which caused real `tsc` errors (`history/[id].tsx:71` and `:101`) on every conditional `[base, isWinner && {...}]` style. Fixed at [src/components/Card.tsx:2-9](src/components/Card.tsx:2) and [src/components/Buttons.tsx:2-13](src/components/Buttons.tsx:2).
- **Score input lost cleared values** — in `enter-scores.tsx`, deleting all characters out of a number field left the previous value sitting in context (input looks empty, total still includes the old number). Now writes a `0` on empty input at [app/session/enter-scores.tsx:30-34](app/session/enter-scores.tsx:30).
- **Duplicate `🃏` in custom-game emoji picker** — the `QUICK_EMOJIS` array had two copies of the joker. Replaced the duplicate at slot 12 with `🎭` ([app/modals/add-game.tsx:18-21](app/modals/add-game.tsx:18)). Also caused a React duplicate-key warning since the `key={e}` collided.
- **`@expo/vector-icons` was an unlisted transitive of `expo`.** TypeScript errored on every screen that imported `Ionicons`. Added it as a direct dep (resolved to `^15.1.1` at install) — tsc now passes cleanly. Verified with `npm install @expo/vector-icons --legacy-peer-deps`. No upgrade of any existing dep, just hoisted a transitive into top-level.

### UX polish
- **Players list was long-press-only.** Tapping a row did nothing — the chevron-less ellipsis icon hinted at a menu that never opened. Added `onPress={() => router.push('/player/${item.id}')}` plus a "Long-press for options" subtitle and replaced the ellipsis icon with a chevron at [app/(tabs)/players.tsx:75-91](app/(tabs)/players.tsx:75).
- **`pick-players` screen had a dead-end at <2 players.** If the user had 0 or 1 players, the only way out was to back-navigate to the Players tab. Empty state now shows an inline "Add Player" button, and a dashed "Add new player" footer is always present in the grid; a yellow warning hint shows if the user has 1 player and can't proceed. See [app/session/pick-players.tsx:39-78](app/session/pick-players.tsx:39).

### Hygiene
- All linter / type-checker output now clean (`npx tsc --noEmit` exits silent). No tests are configured in this project.
- Verified all imports resolve and no files reference dead modules (`App.tsx` / `index.ts` are leftover Expo defaults but unreachable since `package.json` `main` is `expo-router/entry` — documented in `docs/claude/known-issues.md`).

## Security Findings
- **No hardcoded secrets, API keys, or tokens** anywhere in `src/`, `app/`, `app.json`, `eas.json`, or `package.json`. The codebase is also fully offline — no `fetch`, no auth, no analytics.
- `eas.json` has empty placeholders for `appleId` / `ascAppId` / `appleTeamId`. **Note:** `eas.json` is currently not in `.gitignore`. When the user fills in their Apple ID, it will be committed. This is conventional for EAS projects but worth flagging — no action taken.
- `.gitignore` correctly excludes `.env*.local`, build artifacts, certificate files (`*.p8`, `*.p12`, `*.key`, `*.mobileprovision`, `*.pem`), and native folders.
- AsyncStorage is unencrypted, but it stores only player names, custom game names, and per-session scores — no sensitive data. App Store privacy nutrition label can stay "Data Not Collected".
- No `console.log` / `console.error` calls anywhere — nothing leaking through to production logs.
- No SQL, no path traversal surface, no remote input — N/A across the OWASP Top 10.

## CLAUDE.md & Token Hygiene Changes
- **Created `CLAUDE.md`** as a 19-line index pointing at five detail docs (architecture, file map, UI conventions, build/ship checklist, known issues) plus the latest review summary. No `CLAUDE.md` existed before this run.
- **Created `docs/claude/`** with five detail files totalling ~190 lines, so detail loads on-demand only when a task touches that area:
  - `architecture.md` — stack, data model, storage contract, session flow.
  - `file-map.md` — every file in `app/` and `src/` with a one-line purpose.
  - `ui-conventions.md` — theme tokens, component reach-list, color/tint rules, the deleted-player resolve pattern.
  - `build-and-ship.md` — Expo / EAS / App Store Connect checklist.
  - `known-issues.md` — non-obvious gotchas (silent AsyncStorage parse failures, `--legacy-peer-deps` requirement, dead `App.tsx`, score-input zero-on-empty, etc.).
- Created an empty `docs/claude/review-history/` directory for future review-summary rotation.
- **Created `README.md`** — minimal, points at `CLAUDE.md` and `docs/claude/build-and-ship.md`.
- **Before/after**: CLAUDE.md went from **0 → 19 lines**.

## Codex Delegation Log
Did not delegate to Codex this round. The work was a mix of cross-cutting bug fixes (hooks-order, useEffect deps, type widenings) and writing project documentation — both fall under the "keep for yourself" list (cross-system understanding and documentation requiring repo context). The remaining candidate-for-Codex tasks (writing unit tests for `src/utils/scoring.ts` and `src/utils/stats.ts`, extracting the duplicated `resolvePlayer` helper) are listed under Suggested Next Steps so they can be queued explicitly.

## Needs My Approval
- **`eas.json` is tracked, not gitignored.** Once you fill in `appleId` / `ascAppId` / `appleTeamId` and commit, those values will be in your git history. Conventional for EAS but worth a heads-up — happy to move them into a `.env`-driven flow or `.gitignore` `eas.json` if you'd prefer.
- **`App.tsx` and `index.ts` at the repo root are dead code.** Documented in `known-issues.md` but not deleted, per the "do not delete files" rule. They're harmless leftovers from `create-expo-app`.
- **`Session` records are append-only.** There's no `updateSession` method on `DataContext` — if a user enters a wrong score and saves, they can only delete and re-create the session. Adding edit support would be a small feature addition; flagging it because it touches the schema/CRUD surface that the rules ask me not to alter without approval.
- **`npm audit` reports 14 vulns (13 moderate, 1 high)** in transitive build-only deps. Not fixing automatically per "do not upgrade major versions". Run `npm audit` to see the chain. Most of these are inside the Expo/Metro toolchain and resolve with the next Expo SDK.

## Suggested Next Steps
- **Extract `resolvePlayer(session, playerId)`** into `src/utils/players.ts`. The same 5-line helper is duplicated verbatim in `app/(tabs)/index.tsx`, `app/history/index.tsx`, `app/history/[id].tsx`, `app/player/[id].tsx`, `app/session/result.tsx`, and `app/game/[id].tsx`. Good codex-delegate candidate.
- **Add a Jest setup with unit tests for `src/utils/scoring.ts` and `src/utils/stats.ts`.** Both are pure functions — should be ~80 LOC of tests covering winner determination, streak counting, head-to-head edge cases (no shared sessions, third-party wins), and high-score recalculation. Good codex-delegate candidate.
- **Empty-state on the Home tab when there are zero players AND zero sessions** — the FAB still says "New Session" but the session flow lands on a soft-dead-end (now improved on `pick-players`). A first-run hint pointing at the Players tab would tighten the funnel.
- **Confirm app icon and splash assets exist before the next EAS build.** `assets/icon.png` and `assets/splash-icon.png` are present but I didn't verify they're real production assets vs. Expo defaults — the build/ship checklist still lists them as todo.
- **Add a "Reset all data" / "Export data" debug option** somewhere unobtrusive (e.g. tap the version footer 7 times). Helpful for App Store reviewers and for users who want a clean slate without uninstalling.

## Questions for Me
- **Decimal scores**: `enter-scores.tsx` uses `parseInt`, which silently truncates `1.5` to `1`. Some games (Yahtzee bonuses, golf) score in halves. Want decimal support, or stick with integers?
- **"Draws" in head-to-head**: the WinBar's gray segment represents sessions where neither selected player won (a third player did). Want to keep calling that gray segment "third party"-implicit, or surface it explicitly in the UI?
- **Long-press affordance on Players list**: I added a "Long-press for options" subtitle to discover the menu. Acceptable or too noisy? Alternative is a swipe-to-edit gesture or a trailing kebab button.
- **Should `eas.json` move to gitignore** once you fill in your Apple credentials?

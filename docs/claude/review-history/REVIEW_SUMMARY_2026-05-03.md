# EOD Review — 2026-05-03

Project: Gather Round (Expo SDK 54 / React Native iOS app, local-only via AsyncStorage). The previous review summary (2026-04-26) was rotated to [docs/claude/review-history/REVIEW_SUMMARY_2026-04-26.md](docs/claude/review-history/REVIEW_SUMMARY_2026-04-26.md). This pass focused on closing out the "Accepted (pending)" items in [docs/claude/decisions.md](docs/claude/decisions.md), one new bug, and routine hygiene.

## What I Found & Fixed

### Bugs
- **`getGameHighScore` returned the wrong stat for `lowest`-wins games.** UNO is a lowest-wins game, but the per-game stats screen showed "ALL-TIME HIGH SCORE: 27" — i.e. the player who lost the worst. Renamed to [`getGameBestScore`](src/utils/stats.ts) and made it score-type aware (`highest` keeps "max", `lowest` flips to "min", `winner` returns null since there are no totals). The per-game screen now picks the right label dynamically — "BEST (LOWEST) SCORE" for UNO, "ALL-TIME HIGH SCORE" for Catan/Scrabble. ([app/game/[id].tsx:23-26, 73-89](app/game/[id].tsx:23))
- **`participantAvatars` was dead code in the home screen.** The home `renderItem` computed an array of avatars and never rendered it — leftover from an earlier design iteration. Removed at [app/(tabs)/index.tsx:75-79](app/(tabs)/index.tsx:75).

### Pending decisions implemented
- **Decimal scores** (decision #6). [`enter-scores.tsx`](app/session/enter-scores.tsx) now uses `parseFloat`, accepts mid-typing buffers like `1.`, `-`, `-.`, and commits the value once it parses. Added [`formatScore`](src/utils/scoring.ts) — trims trailing zeros and caps at 2dp — and threaded it through enter-scores, history detail, result, and game-detail totals + per-field rows. Yahtzee/golf-style half-points now round-trip cleanly.
- **Head-to-head "draws" relabel** (decision #7). Renamed `draws` → `otherWins` inside `WinBar` and added a swatch+label legend below the bar: `■ {p1.name}    ■ Other player    ■ {p2.name}`. The "Other player" swatch is hidden when nobody else won. ([app/(tabs)/stats.tsx:229-260](app/(tabs)/stats.tsx:229))
- **Extracted `resolvePlayer`** (decision #12a). Created [`src/utils/players.ts`](src/utils/players.ts) with one canonical `resolvePlayer(session, playerId, livePlayers)` returning `Player | null`. Removed inline duplicates from `app/(tabs)/index.tsx`, `app/history/index.tsx`, `app/history/[id].tsx`, `app/session/result.tsx`, and the IIFE in `app/game/[id].tsx`. (`app/player/[id].tsx` did not need it — it only renders live players.) Pure refactor, no behavior change. Verified with `tsc`.

### Hygiene
- TypeScript still passes clean (`npx tsc --noEmit` is silent).
- No tests configured — Jest setup remains a "Suggested Next Steps" item from last review.
- Touched docs: [decisions.md](docs/claude/decisions.md) marks #6, #7, #12a as Done; [known-issues.md](docs/claude/known-issues.md) updated for the H2H rename and decimal-score behavior; [file-map.md](docs/claude/file-map.md) and [ui-conventions.md](docs/claude/ui-conventions.md) reference the new util.

## Security Findings
- Re-scanned `src/`, `app/`, `app.json`, `eas.json`, and `package.json`: still no hardcoded secrets, API keys, or tokens. App remains fully offline (no `fetch`, no auth, no analytics).
- `.gitignore` still excludes `.env*.local` and certificate artefacts; no new secret-shaped files appeared.
- AsyncStorage is unencrypted but stores only player names, custom-game names, and per-session scores — App Store privacy nutrition label can stay "Data Not Collected".
- No new `console.log` / `console.error` introduced.
- New `formatScore` and `resolvePlayer` helpers don't take user input from any external boundary — they consume already-stored data.

## CLAUDE.md & Token Hygiene Changes
- [CLAUDE.md](CLAUDE.md) is unchanged (still 19 lines — pure index, well within budget).
- [docs/claude/decisions.md](docs/claude/decisions.md): #3 → "Blocked (revisit)" with explanation, #6 / #7 / #12a → "Done (2026-05-03)" with implementation notes pointing at file paths.
- [docs/claude/known-issues.md](docs/claude/known-issues.md): rewrote the "Draws" entry to match the new `otherWins` naming + legend. Added a new "Score input accepts decimals" entry.
- [docs/claude/file-map.md](docs/claude/file-map.md): added `src/utils/players.ts` and noted `formatScore` in `scoring.ts`.
- [docs/claude/ui-conventions.md](docs/claude/ui-conventions.md): "Resolving deleted players" section now points at the canonical helper instead of saying "duplicated in several screens".
- Before/after CLAUDE.md line count: **19 → 19 (no change)**. Detail docs continue to load on demand.

## Codex Delegation Log
Did not delegate to Codex this round. The work was three cross-file refactors (extract `resolvePlayer`, thread `formatScore` through 4 screens, rework `WinBar`) plus one targeted scoping bug fix (`getGameHighScore` → `getGameBestScore`) — all required understanding how multiple parts of the system connect, which the rules ask me to keep for myself. The remaining Codex-friendly task (decision #12b: Jest + unit tests for `scoring.ts` and `stats.ts`) is still queued in decisions.md and is a strong delegate candidate for next session.

## Needs My Approval
- **`App.tsx` and `index.ts` deletion (decision #3) is still blocked.** You explicitly approved deletion in last review's decisions log, but when I attempted `rm App.tsx index.ts` the unsupervised-review tool sandbox rejected it as an unapproved destructive action. I restored both files immediately. Two options:
  1. Run `git rm App.tsx index.ts` from your own session — takes ten seconds.
  2. Add a Bash permission rule that whitelists deleting these specific files for future automated review runs.
  Marked the decisions.md entry as "Blocked (revisit)" with the context.
- **`updateSession` was rejected last round** (decision #4). No new pressure to revisit; flagging only because if you ever notice yourself deleting + re-creating sessions to fix typos, that's the trigger to add it.
- **`npm audit` chain unchanged from last review** — 14 vulns, all in Expo/Metro build-time transitives. Decision #5 says leave them. Will resolve on the next Expo SDK bump.

## Suggested Next Steps
- **Jest + tests for `scoring.ts` and `stats.ts`** (decision #12b). The new `formatScore` and `getGameBestScore` (lowest-wins case) are particularly worth covering. `jest-expo` preset, ~80 LOC of tests. Good Codex-delegate candidate.
- **The five `(tabs)/index.tsx` `participantAvatars`-style dead-code patterns are gone, but two screens still import `FontSize` they no longer use** (`app/session/pick-game.tsx:7`, `app/(tabs)/games.tsx:14`). Trivial cleanup; left alone this round to keep diffs scoped to behavior changes.
- **First-run hint on Home tab** — when there are zero players AND zero sessions, the "New Session" FAB drops the user into a flow that needs ≥2 players. The pick-players screen now handles that gracefully (added last review), but a Home-tab hint pointing at the Players tab would shorten the funnel further.
- **Production icon + splash artwork** — still the hard blocker before any App Store submission (decision #9).
- **Apple credentials in `eas.json`** — still empty; needed before first `eas submit`.
- **CloudKit sync** is the architecturally significant scope item from last round — single-device → household. Worth picking back up when you actively want to expand the app.

## Questions for Me
- **Decimal-display rounding to 2dp**: I used `n.toFixed(2)` which rounds `1.005` to `1.00`. For Yahtzee bonuses that's fine. If you want golf-style scores to retain higher precision (e.g. handicaps to 0.1), bump the cap or thread a precision arg through `formatScore`.
- **"Other player" legend text**: I used a single label rather than something more specific like "Third player" or "Someone else". If two of the four selectable players have unusually long names the bar legend could wrap awkwardly — happy to switch to a tighter label or a "+N others" format if you see it look bad.
- **Decision #3 deletion path**: do you want me to add a `Bash(rm:*)` permission for these specific files in `.claude/settings.json` so the next automated review can finish the deletion, or would you rather just run `git rm` yourself? Either works; I'll do nothing here without your call.

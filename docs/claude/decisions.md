# Decisions log

Captured 2026-04-27 from the EOD review on 2026-04-26. The project is currently
low priority for the user; nothing in this file has been implemented yet
(unless explicitly noted below). When work resumes, treat this as the source
of truth for "what was already decided" so we don't re-litigate.

Status legend:
- **Decided** — the answer stands; no future action needed.
- **Accepted (pending)** — to be implemented when work resumes.
- **Deferred** — punt until the user wants to revisit.
- **Rejected** — explicitly not doing it for now.

---

## 1. `eas.json` & git — **Decided**
**Question:** Track `eas.json` (Apple ID, ASC App ID, Team ID land in git) or gitignore it?
**Answer:** Leave tracked while the repo is private. Those values are identifiers, not secrets. Revisit only if the repo ever goes public.

## 2. Apple credentials for `eas.json` submit block — **Deferred**
**Question:** Provide `appleId`, `ascAppId`, `appleTeamId` for `submit.production.ios`.
**Answer:** Defer until the user is ready to do the first App Store submission.

## 3. Delete dead `App.tsx` + `index.ts` at the repo root — **Unblocked (pending next review)**
**Question:** OK to delete the leftover Expo defaults that are unreachable because `package.json` `main` is `expo-router/entry`?
**Answer (decided 2026-04-26):** Yes — delete both.
**Status (2026-05-04):** The 2026-05-03 review attempted deletion; the unsupervised-review sandbox rejected it as destructive. Drew authorized adding a tight permission rule, so [.claude/settings.json](../../.claude/settings.json) now allows `git rm App.tsx`, `git rm index.ts`, and `git rm App.tsx index.ts` — nothing else. Files are still on disk.
**When work resumes:** the next automated EOD review should run `git rm App.tsx index.ts` and verify with `npx expo start` that the app still boots from `app/_layout.tsx`.

## 4. Add `updateSession` to `DataContext` — **Rejected (for now)**
**Question:** Sessions are append-only. Add edit support for fixing typo'd scores?
**Answer:** Skip. YAGNI. Delete + re-create is fine until someone actually complains.

## 5. `npm audit` vulnerabilities (14: 13 moderate, 1 high) — **Decided**
**Question:** Patch them or leave them?
**Answer:** Leave them. All inside Expo / Metro build-time toolchain transitives. None ship in the iOS binary or run at runtime. They'll resolve with the next Expo SDK bump.

## 6. Decimal scores in score input — **Done (2026-05-03)**
**Question:** `enter-scores.tsx` uses `parseInt`, so `1.5` truncates to `1`. Some games (Yahtzee bonuses, golf) score in halves. Support decimals?
**Answer:** Yes — when needed.
**Implementation:**
- `parseInt(raw, 10)` → `parseFloat(raw)` in [enter-scores.tsx](../../app/session/enter-scores.tsx).
- Kept `keyboardType="numbers-and-punctuation"` (gives `.` and `-`).
- Added [`formatScore`](../../src/utils/scoring.ts) helper used by enter-scores, history detail, result, and game-detail screens to render totals/fields with trailing zeros trimmed (`1.50` → `1.5`).
- `getPlayerTotal` left untouched — `Number()` coercion already handles floats.

## 7. Head-to-head "draws" label needs explanation — **Done (2026-05-03)**
**Question:** The gray segment in the H2H WinBar represents sessions where a *third* player won, not actual draws. Relabel?
**Answer:** Yes.
**Implementation:**
- Renamed `draws` → `otherWins` inside `WinBar` in [stats.tsx](../../app/(tabs)/stats.tsx).
- Added a swatch+label legend underneath the bar showing `■ {p1.name}    ■ Other player    ■ {p2.name}`.
- "Other player" swatch is hidden when `otherWins === 0`.

## 8. Long-press affordance on Players list — **Decided**
**Question:** Keep the new "Long-press for options" subtitle, drop it for a cleaner look, or swap for kebab / swipe?
**Answer:** Keep as-is. The subtitle is the cheapest way to make the rename/delete menu discoverable without adding more chrome.

## 9. Production icon + splash artwork — **Deferred (BLOCKER before submit)**
**Question:** Are `assets/icon.png` and `assets/splash-icon.png` real production art?
**Answer:** No. The user has no artwork made yet. This is a hard blocker before any App Store submission.
**When work resumes:** see [build-and-ship.md](build-and-ship.md) for the asset specs (1024×1024 no-transparency icon; splash mark on `#1a1a2e` background).

## 10. App Store Connect record — **Deferred**
Not created yet. Bundle id `com.gatherround.app`, category Games → Family, age rating 4+, privacy "Data Not Collected". Pick this back up when artwork and credentials exist.

## 11. First EAS production build — **Deferred**
Not running `eas build:configure` yet. Project is low priority; revisit once #2, #9, and #10 are done.

## 12. Codex-shaped follow-ups — **Accepted (pending)**

### 12a. Extract `resolvePlayer` into `src/utils/players.ts` — **Done (2026-05-03)**
[`src/utils/players.ts`](../../src/utils/players.ts) now exports `resolvePlayer(session, playerId, livePlayers): Player | null`. Inline duplicates removed from `app/(tabs)/index.tsx`, `app/history/index.tsx`, `app/history/[id].tsx`, `app/session/result.tsx`, and the IIFE in `app/game/[id].tsx`. (`app/player/[id].tsx` did not need it — it only renders live players, never historical ones.)

### 12b. Jest + unit tests for `scoring.ts` and `stats.ts`
Pure functions, ideal test target.

**When work resumes:**
- Add `jest` + `@types/jest` + `jest-expo` (preset) to devDependencies.
- Add a `test` script to `package.json`.
- Cover: `getPlayerTotal`, `calculateWinner` (all three score types incl. fallback), `getWinCounts`, `getWinRate` (zero-division edge), `getStreaks` (current vs longest, broken streak), `getFavoriteGameId` and `getBestRivalId` (empty inputs), `getHeadToHead` (zero shared, third-party wins), `getGameHighScore` (deleted-player snapshot fallback), `getWinLeader` and `getMostPlayedGame` (zero data).
- Target ~80 LOC of tests.

## 13. Scope suggestions — **Ranked, all deferred**
Listed for future product thinking. None are committed.

1. **CloudKit sync** — iOS-native, free, no backend. The only suggestion that fundamentally changes what the app *is* (single-device → household). Pick this first if multi-device matters.
2. **Achievements** — first win, 10-game streak, sweep-the-table, etc. Cheap, big delight factor for a family app.
3. **Photo avatars** — `expo-image-picker`, replace initials circle.
4. **Wins-over-time chart** on player profile — `react-native-svg` line chart.
5. **CSV export** of all sessions via the share sheet. ~30 lines.
6. **Game-night mode** — record multiple games back-to-back without leaving the flow.
7. **House rules / notes** field on custom games.
8. **Tournament bracket** — round-robin or single-elim. Big build, narrow audience.
9. **Android target** — would lose the iOS-only simplicity in `app.json`; needs a real audit.

If picking one to start: **#1 CloudKit sync** is architecturally significant, the rest are polish.

# Decisions log

Captured 2026-04-27 from the EOD review on 2026-04-26, updated 2026-05-14 after the PWA pivot. The project is currently low priority for the user; entries below either reflect what's been done or what's been explicitly deferred / rejected. When work resumes, treat this as the source of truth for "what was already decided" so we don't re-litigate.

Status legend:
- **Decided** — the answer stands; no future action needed.
- **Done** — implemented.
- **Accepted (pending)** — to be implemented when work resumes.
- **Deferred** — punt until the user wants to revisit.
- **Rejected** — explicitly not doing it for now.
- **Superseded** — no longer applies because the project changed direction.

---

## -1. Family-friendly games + groups + placement scoring — **Done (2026-05-14)**
**Question:** Drew wants three more preset games his family actually plays (Texas Hold 'Em, Secret Hitler, Flip 7) plus a way to scope leaderboards by group of people (Family vs Friends, with overlapping membership).
**Answer:** Yes — shipped end-to-end.
**Implementation:**
- **Three presets** in [src/data/presetGames.ts](../../src/data/presetGames.ts): Hold 'Em (♠️, new `placement` scoreType, default [5,3,2,1,0]), Secret Hitler (🤫, `winner` — team-game caveat noted in known-issues), Flip 7 (7️⃣, `highest` with rounds 1–3 like UNO).
- **New `placement` scoreType.** Type changes in [src/types/index.ts](../../src/types/index.ts); helpers `getPlacementPoints` + `formatPlace` + `DEFAULT_PLACEMENT_POINTS` in [src/utils/scoring.ts](../../src/utils/scoring.ts); `calculateWinner` extended to pick Place === 1; `getGameBestScore` in [src/utils/stats.ts](../../src/utils/stats.ts) returns "most 1st-place finishes" for placement. UI: a place-pill picker in [enter-scores.tsx](../../app/session/enter-scores.tsx) with uniqueness validation; placement-aware rows in [result.tsx](../../app/session/result.tsx) and [history/[id].tsx](../../app/history/%5Bid%5D.tsx); placement "Points per place" editor in [add-game.tsx](../../app/modals/add-game.tsx).
- **Groups feature.** New `Group { id, name, color }` + optional `Player.groupIds[]` in types; new `@gatherround/groups` storage key + getters; new [src/utils/groups.ts](../../src/utils/groups.ts) `filterSessionsByGroup`; full group CRUD in [DataContext](../../src/context/DataContext.tsx) (addGroup, renameGroup, recolorGroup, deleteGroup, setPlayerGroups); new [manage-groups.tsx](../../app/modals/manage-groups.tsx) modal; group multi-select chips in add-player; per-player group dots + Edit-groups action in Players tab; group-scope chip row at the top of Stats and game-detail screens.
- **Preset migration**: [DataContext](../../src/context/DataContext.tsx) bootstrap now also seeds any PRESET_GAMES whose IDs are missing from saved games — so existing installs pick up new presets without wiping custom ones. Idempotent.

**Filter semantics:** a session shows in a group leaderboard *iff* every participant is a member of that group. Mixed-roster sessions only show under "All". Documented in known-issues.

## 0. Pivot to PWA — **Done (2026-05-14)**
**Question:** Submit to the App Store, or ship as a free PWA?
**Answer:** PWA. Avoids the $99/yr Apple Developer fee, the artwork blocker, the EAS build queue, and the App Store review cycle.
**Implementation:**
- `app.json` `platforms: ["web"]`, added `web` config block, added `experiments.baseUrl: "/gather-round"`.
- Installed `react-native-web`, `react-dom`, `@expo/metro-runtime`, `react-native-worklets` (Reanimated 4 peer dep).
- Removed iOS-only artifacts: `App.tsx`, `index.ts`, `eas.json`, `expo-haptics`.
- Added PWA shell: `public/manifest.json`, icons in `public/icons/`, Workbox-generated service worker via `workbox-config.js`, post-build head-injection via `scripts/inject-pwa-head.js`.
- Added GitHub Actions workflow `.github/workflows/deploy.yml` deploying to GitHub Pages on every push to `main`.
- Live at https://reformationconsultingteam-arch.github.io/gather-round/.
**Supersedes:** #2, #9, #10, #11 (all App Store / EAS prep).

---

## 1. `eas.json` & git — **Superseded (2026-05-14)**
File deleted as part of the PWA pivot. No EAS, no Apple credentials in repo anymore.

## 2. Apple credentials for `eas.json` submit block — **Superseded (2026-05-14)**
Not needed — no App Store submission.

## 3. Delete dead `App.tsx` + `index.ts` — **Done (2026-05-14)**
Both files removed during the PWA pivot. `package.json` `main` remains `expo-router/entry`.

## 4. Add `updateSession` to `DataContext` — **Rejected (for now)**
**Question:** Sessions are append-only. Add edit support for fixing typo'd scores?
**Answer:** Skip. YAGNI. Delete + re-create is fine until someone actually complains.

## 5. `npm audit` vulnerabilities — **Decided**
**Question:** Patch them or leave them?
**Answer:** Leave them. All inside Expo / Metro build-time toolchain transitives. None ship in the production web bundle that runs in user browsers. They'll resolve with the next Expo SDK bump.

## 6. Decimal scores in score input — **Done (2026-05-03)**
`parseFloat` + `formatScore` helper. Yahtzee/golf-style half-points round-trip cleanly.

## 7. Head-to-head "draws" label — **Done (2026-05-03)**
Renamed `draws` → `otherWins`, added a 3-swatch legend under the H2H WinBar.

## 8. Long-press affordance on Players list — **Decided**
Keep the "Long-press for options" subtitle. Cheapest discoverability for rename/delete.

## 9. Production icon + splash artwork — **Superseded (2026-05-14)**
No longer a hard blocker — PWA installs still work with the placeholder icon (browsers downscale 1024×1024). Real art remains a nice-to-have. See [build-and-ship.md](build-and-ship.md) for the swap procedure when art exists.

## 10. App Store Connect record — **Superseded (2026-05-14)**
Not needed.

## 11. First EAS production build — **Superseded (2026-05-14)**
Not needed.

## 12. Codex-shaped follow-ups — **Accepted (pending)**

### 12a. Extract `resolvePlayer` — **Done (2026-05-03)**

### 12b. Jest + unit tests for `scoring.ts` and `stats.ts` — **Accepted (pending)**
Pure functions, ideal test target. Now that the project is a PWA on a CI/CD pipeline, tests would also gate deploys.
- Add `jest`, `@types/jest`, `jest-expo` to devDependencies.
- Add a `test` script + a CI step in `.github/workflows/deploy.yml` to run tests before build.
- Cover: `getPlayerTotal`, `calculateWinner` (all three score types), `getWinCounts`, `getWinRate`, `getStreaks`, `getFavoriteGameId`, `getBestRivalId`, `getHeadToHead`, `getGameBestScore`, `getWinLeader`, `getMostPlayedGame`.

## 13. Scope suggestions — **Ranked, all deferred**

Now framed around a PWA:

1. **Multi-device sync** — was previously "CloudKit sync" (iOS-only); now would need a real backend (Supabase, Firebase, Cloudflare D1, etc.) since we're not on Apple's iCloud anymore. Higher cost to implement; less free. Probably defer unless multi-device sync is a real need.
2. **Achievements** — first win, 10-game streak, sweep-the-table, etc. Pure local computation; same scope as before.
3. **Photo avatars** — use the browser file picker (`<input type="file">`) instead of `expo-image-picker`. Store base64 in localStorage; trim to ~50KB per avatar.
4. **Wins-over-time chart** on player profile — react-native-svg works on web; same effort.
5. **CSV export** of all sessions — use a blob + anchor download on web; even simpler than the iOS share-sheet path.
6. **Game-night mode** — record multiple games back-to-back. UI-only.
7. **House rules / notes** field on custom games. Data-model addition.
8. **Tournament bracket** — round-robin or single-elim. Big build, narrow audience.
9. **PWA install prompts** — surface a "Install this app" banner using `beforeinstallprompt`. Low effort, high reward.

If picking one to start: **#9 install prompt** is the easiest PWA-native polish; **#5 CSV export** is the most "useful" small win.

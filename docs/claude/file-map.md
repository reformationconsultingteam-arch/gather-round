# File map

## Entry points
- `app/_layout.tsx` — root Stack, wraps everything in `DataProvider`.
- `app/(tabs)/_layout.tsx` — 4-tab bar (Home, Games, Players, Stats).
- `app.json` — Expo config (web-only target, baseUrl `/gather-round`, dark UI, splash).
- `package.json` `main` is `expo-router/entry`.

## Build pipeline
- `public/manifest.json` — PWA manifest.
- `public/icons/icon-{192,512}.png`, `public/favicon.png` — PWA + browser icons (placeholders).
- `scripts/inject-pwa-head.js` — post-export script that injects PWA head tags into `dist/index.html` and writes `dist/404.html` as the SPA fallback.
- `workbox-config.js` — Workbox config; `build:web` runs `workbox generateSW` to emit `dist/sw.js` for offline support.
- `.github/workflows/deploy.yml` — builds + deploys to GitHub Pages on push to `main`.

## Tabs
- `app/(tabs)/index.tsx` — Home (stat cards, recent sessions, "New Session" FAB).
- `app/(tabs)/games.tsx` — Preset + custom games list. Custom-game rows show a "⋯" button (long-press also supported) → delete via `ActionSheet`.
- `app/(tabs)/players.tsx` — Players list. Header has tags icon → `manage-groups`, "+" → `add-player`. Per-player rows show small colored group dots. Tap "⋯" (or long-press) → rename / edit groups / delete, via `ActionSheet` + `PromptDialog`.
- `app/(tabs)/stats.tsx` — Group-scope chip row + Leaderboard + head-to-head picker + games-played list. All three sections recompute when the group filter changes.

## Detail screens
- `app/history/index.tsx` — Sessions list (most recent first).
- `app/history/[id].tsx` — Single session detail (winner + per-player scorecards).
- `app/player/[id].tsx` — Per-player profile (stats grid, favorite game, best rival, recent sessions).
- `app/game/[id].tsx` — Per-game stats (high score, wins-by-player bar chart, recent sessions).

## Modals
- `app/modals/add-player.tsx` — Sheet with name input + auto-color preview + groups multi-select chips.
- `app/modals/add-game.tsx` — Sheet with emoji picker + name + score-type radio (highest / lowest / placement / winner). For placement, exposes a comma-separated points-per-place editor.
- `app/modals/manage-groups.tsx` — Sheet to create / rename / recolor / delete groups.

## Session flow
- `app/session/_layout.tsx` — Stack with `SessionFlowProvider`.
- `app/session/pick-game.tsx`, `pick-players.tsx`, `enter-scores.tsx`, `result.tsx`.

## Source tree (`src/`)
- `src/types/index.ts` — `Player` (with optional `groupIds[]`), `Game` (with optional `placementPoints[]`), `Session`, `Group`, `ScoreType` (`highest | lowest | winner | placement`).
- `src/context/DataContext.tsx` — durable CRUD provider; players + games + sessions + groups; includes preset migration on bootstrap (seeds any missing preset IDs into existing installs without wiping custom games).
- `src/context/SessionFlowContext.tsx` — ephemeral session-flow state. For placement games, the score input stores `{ Place: <1-indexed integer> }`.
- `src/storage/index.ts` — AsyncStorage load/save helpers. Keys: `@gatherround/{players, games, sessions, groups}`.
- `src/data/presetGames.ts` — 11 preset games (Catan, Ticket to Ride, Scrabble, UNO, Codenames, Monopoly, Risk, Clue, **Texas Hold 'Em**, **Secret Hitler**, **Flip 7**).
- `src/data/colors.ts` — 10-color player palette + `colorForIndex`. Reused for group colors.
- `src/constants/theme.ts` — `Colors`, `Spacing`, `Radius`, `FontSize`, `FontWeight`.
- `src/utils/scoring.ts` — `getPlayerTotal`, `calculateWinner` (knows about placement), `formatScore`, `getPlacementPoints`, `formatPlace`, `DEFAULT_PLACEMENT_POINTS`.
- `src/utils/stats.ts` — all analytics (win counts, streaks, head-to-head, etc.). `getGameBestScore` returns "most 1st-place finishes" for placement games.
- `src/utils/players.ts` — `resolvePlayer(session, id, livePlayers)`: live → snapshot → null lookup used by every history-style screen.
- `src/utils/groups.ts` — `filterSessionsByGroup(sessions, groupId, players)`: returns sessions where every participant is in `groupId`, or all sessions if `groupId` is null.
- `src/components/` — `AppText`, `Avatar`, `Card`, `Buttons` (Primary/Ghost), `ScreenHeader`, `ActionSheet` (web-safe replacement for multi-button `Alert.alert`), `PromptDialog` (web-safe replacement for iOS-only `Alert.prompt`), plus barrel `index.ts`.

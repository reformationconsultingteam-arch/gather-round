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
- `app/(tabs)/games.tsx` — Preset + custom games list, long-press a custom game to delete.
- `app/(tabs)/players.tsx` — Players list. Tap → profile, long-press → rename/delete.
- `app/(tabs)/stats.tsx` — Leaderboard, head-to-head picker, games-played list.

## Detail screens
- `app/history/index.tsx` — Sessions list (most recent first).
- `app/history/[id].tsx` — Single session detail (winner + per-player scorecards).
- `app/player/[id].tsx` — Per-player profile (stats grid, favorite game, best rival, recent sessions).
- `app/game/[id].tsx` — Per-game stats (high score, wins-by-player bar chart, recent sessions).

## Modals
- `app/modals/add-player.tsx` — Sheet with name input + auto-color preview.
- `app/modals/add-game.tsx` — Sheet with emoji picker + name + score-type radio.

## Session flow
- `app/session/_layout.tsx` — Stack with `SessionFlowProvider`.
- `app/session/pick-game.tsx`, `pick-players.tsx`, `enter-scores.tsx`, `result.tsx`.

## Source tree (`src/`)
- `src/types/index.ts` — `Player`, `Game`, `Session`, `ScoreType`.
- `src/context/DataContext.tsx` — durable CRUD provider.
- `src/context/SessionFlowContext.tsx` — ephemeral session-flow state.
- `src/storage/index.ts` — AsyncStorage load/save helpers (one key per collection).
- `src/data/presetGames.ts` — 8 preset games (Catan, Ticket to Ride, Scrabble, UNO, Codenames, Monopoly, Risk, Clue).
- `src/data/colors.ts` — 10-color player palette + `colorForIndex`.
- `src/constants/theme.ts` — `Colors`, `Spacing`, `Radius`, `FontSize`, `FontWeight`.
- `src/utils/scoring.ts` — `getPlayerTotal`, `calculateWinner`, `formatScore`.
- `src/utils/stats.ts` — all analytics (win counts, streaks, head-to-head, etc.).
- `src/utils/players.ts` — `resolvePlayer(session, id, livePlayers)`: live → snapshot → null lookup used by every history-style screen.
- `src/components/` — `AppText`, `Avatar`, `Card`, `Buttons` (Primary/Ghost), `ScreenHeader`, plus barrel `index.ts`.

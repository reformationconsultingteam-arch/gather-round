# Architecture & data flow

## Stack
- **Runtime**: Expo SDK 54 (managed workflow), `react-native-web` 0.21, React 19.1. Web-only target.
- **Navigation**: expo-router 6 (file-based, Stack + Tabs).
- **State**: React Context (no Redux/Zustand). Two providers — `DataContext` (durable) and `SessionFlowContext` (ephemeral, only inside `app/session/`).
- **Persistence**: `@react-native-async-storage/async-storage` — on web this shims to `localStorage` automatically. Same `Player`/`Game`/`Session` arrays under keys `@gatherround/*`.
- **Animation**: react-native-reanimated 4 (with `react-native-worklets` peer dep) for the result/celebration screen confetti and winner reveal. Loads cleanly on web in SDK 54.
- **PWA shell**: Custom `public/manifest.json`, app icons under `public/icons/`, Workbox-generated service worker (`dist/sw.js`) precaches the JS bundle for offline use. Post-build `scripts/inject-pwa-head.js` injects manifest link + apple-touch-icon + SW registration into `dist/index.html` and writes `dist/404.html` as an SPA fallback for deep-link refreshes on GitHub Pages.
- **Hosting**: GitHub Pages at `/gather-round/` subpath (`experiments.baseUrl` in `app.json`). GitHub Actions workflow `.github/workflows/deploy.yml` builds on every push to `main` and deploys `dist/`.
- **No backend, no auth, no analytics, no network requests.**

## Data model (`src/types/index.ts`)
- `Player { id, name, color }`
- `Game { id, name, emoji, category, scoreType, scorecardFields[], custom }`
  - `scoreType: 'highest' | 'lowest' | 'winner'`
  - `scorecardFields` is an array of field names. Empty array → single-total input. `winner` games always have an empty array.
- `Session { id, gameId, date, players[], scores, winner, playerSnapshots }`
  - `scores: Record<playerId, Record<fieldName, number>>`
  - `playerSnapshots: Record<playerId, { name, color }>` — frozen at save time so history survives a player deletion.

## Storage layer (`src/storage/index.ts`)
Three keys: `@gatherround/players`, `@gatherround/games`, `@gatherround/sessions`. Each is a JSON-serialized array. `load` swallows parse errors and returns `[]` so a corrupt entry never crashes the app — but it also silently discards data.

## DataContext lifecycle
1. On mount, `bootstrap()` parallel-loads all three keys.
2. If `games` is empty, the 8 preset games (`src/data/presetGames.ts`) are seeded and saved.
3. CRUD callbacks update React state and persist with the **next** state — they don't block on the write. Each setter assumes the previous state is captured by closure (the `useCallback` deps include the relevant slice).

## Session creation flow (`app/session/`)
4 screens inside a single `SessionFlowProvider`:
1. **pick-game** — sets `gameId`.
2. **pick-players** — local `Set<string>` selection state, commits to context on Next.
3. **enter-scores** — branches by `game.scoreType`: winner-pick rows or per-field number inputs.
4. **result** — reads `savedSessionId` from context, shows confetti + winner reveal, auto-dismisses after 4 s.

Calling `flow.reset()` plus `router.dismissAll()` returns to the tabs root.

## Stats (`src/utils/stats.ts`)
Pure functions over the sessions array. All recomputations happen inside `useMemo` in the consuming screens — no caching layer. Counts, win rates, streaks, head-to-head, favorite game, best rival, per-game high score, win leader, most-played game.

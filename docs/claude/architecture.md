# Architecture & data flow

## Stack
- **Runtime**: Expo SDK 54 (managed workflow), React Native 0.81.5, React 19.1.
- **Navigation**: expo-router 6 (file-based, Stack + Tabs).
- **State**: React Context (no Redux/Zustand). Two providers — `DataContext` (durable) and `SessionFlowContext` (ephemeral, only inside `app/session/`).
- **Persistence**: `@react-native-async-storage/async-storage` (unencrypted key-value, local only).
- **Animation**: react-native-reanimated 4 for the result/celebration screen confetti and winner reveal.
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

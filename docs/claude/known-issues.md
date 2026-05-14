# Known issues & non-obvious gotchas

## `App.tsx` and `index.ts` are dead code
`package.json` `main` is `expo-router/entry`, so the file-based router takes over. The two leftover Expo defaults at the repo root are unused. Don't trust them as the entry point.

## AsyncStorage failures are silent
`src/storage/index.ts` `load()` swallows JSON parse errors and returns `[]`. A corrupt entry (manually edited storage, partially written write) becomes "no data" with no user-visible warning. Acceptable for a v1 single-user app, but worth a Sentry-style log if we ever add observability.

## `--legacy-peer-deps` is required on every install
`react-dom` is an optional peer of something in the tree that resolves wrong without the flag. iOS-only, so it's harmless — but `npm install` without the flag will fail.

## `@expo/vector-icons` is a transitive of `expo`
We list it explicitly in `package.json` so TypeScript's module resolver finds it (otherwise `tsc --noEmit` errors on every screen that imports `Ionicons`). Keep it pinned to whatever expo ships.

## Score input clears to 0 on empty
`enter-scores.tsx` writes a `0` to context when the user fully clears a number field — otherwise the previous value would silently persist while the input looked empty. Means a deliberate "0" and a "cleared" field look identical in storage. Acceptable for now.

## Score input accepts decimals
As of 2026-05-03, the score field uses `parseFloat`, so `1.5` and `2.25` round-trip correctly. Lone `-`, `.`, `-.` and trailing `.` mid-typing are accepted without committing — the value is committed only when the buffer parses to a finite number. Display goes through [`formatScore`](../../src/utils/scoring.ts), which trims trailing zeros to 2dp.

## Custom game emojis are picked one char at a time
The text-input fallback in `add-game.tsx` keeps only the **last** grapheme the user types — so paste-to-fill works (the last emoji wins) but you can't type compound names like flag sequences. Fine for the game-emoji use case.

## Sessions never get edited, only added/deleted
`DataContext` has no `updateSession`. If we ever need to fix a typo'd score, we'll have to add it.

## H2H WinBar — gray segment is "third player won"
The H2H WinBar shows a gray segment for sessions where neither p1 nor p2 won — a third player took it. The variable is now named `otherWins` (renamed from `draws` on 2026-05-03) and the bar is labelled with a `■ Other player` swatch in the legend. There are no actual draws in the data model.

## Auto-advance on result screen
The result screen auto-dismisses after 4 s. The timer key is the `session.winner` string id, not the resolved player object — using the object would re-create the timer on every render and never fire.

## Reanimated requires the plugin
`react-native-reanimated` is listed in `app.json` `plugins`. Removing it breaks the result screen confetti silently.

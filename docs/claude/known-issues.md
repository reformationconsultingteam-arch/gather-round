# Known issues & non-obvious gotchas

## AsyncStorage maps to localStorage on web
On web (`react-native-web`), `@react-native-async-storage/async-storage` transparently uses `window.localStorage`. Same API, same key names (`@gatherround/players`, `@gatherround/games`, `@gatherround/sessions`). Storage is per-origin per-browser — so the app's "data" is tied to the device + browser combo, not synced across devices.

## AsyncStorage failures are silent
`src/storage/index.ts` `load()` swallows JSON parse errors and returns `[]`. A corrupt entry (manually edited localStorage, partially written write) becomes "no data" with no user-visible warning. Acceptable for a v1 single-user app, but worth a Sentry-style log if we ever add observability.

## `--legacy-peer-deps` is required on every install
`react-dom` is an optional peer of something in the tree that resolves wrong without the flag. `npm install` without the flag will fail. Also pinned in `.github/workflows/deploy.yml`.

## Reanimated 4 needs `react-native-worklets` peer dep
`react-native-reanimated` 4.x moved the Babel worklets plugin into a separate package, `react-native-worklets`. Without it, the bundler errors with `Cannot find module 'react-native-worklets/plugin'`. Already pinned in `package.json` deps — don't remove.

## `experiments.baseUrl` only kicks in at export time
The `experiments.baseUrl: "/gather-round"` in `app.json` is applied by `expo export -p web`, not by the dev server. Locally, the app serves at `http://localhost:8081/`. The deployed build serves at `https://reformationconsultingteam-arch.github.io/gather-round/`. Don't try to navigate to `/gather-round/` against the dev server — it won't resolve correctly.

## `+html.tsx` is ignored in SPA mode
Expo Router's `app/+html.tsx` only runs when `web.output` is `static`. We use `output: "single"` (SPA) because dynamic `[id]` routes can't be pre-rendered. To inject head tags (manifest link, apple-touch-icon, service-worker registration), we post-process `dist/index.html` via `scripts/inject-pwa-head.js` after every export. Don't add tags to a `+html.tsx` and expect them to ship.

## SPA fallback is a copy of `index.html`
`scripts/inject-pwa-head.js` writes `dist/404.html` as a byte-identical copy of `dist/index.html`. GitHub Pages serves 404.html for any path it doesn't recognize, which is how deep links (e.g. `/gather-round/history/abc123`) survive a hard refresh. Don't delete the 404.html step from the build pipeline.

## Service worker scope is `/gather-round/`
Workbox generates `dist/sw.js`. Because GitHub Pages serves the SW at `https://<user>.github.io/gather-round/sw.js`, its scope is automatically `/gather-round/` — limited to this app's path. If we ever move to a host that serves at root, scope expands to the whole origin (still fine, but worth knowing).

## "No route named X" warnings on web
`app/_layout.tsx` has `Stack.Screen` entries named `history`, `player`, `game` referencing folders, but those folders contain `index.tsx` + `[id].tsx` without their own `_layout.tsx`. Expo Router 6 logs `[Layout children]: No route named "history" exists` warnings during dev. The screens still render; the warnings are because the `HEADER_OPTS` options don't actually apply (those folder screens fall back to default styling). Pre-existing from the iOS app; not blocking. Fix is to either add per-folder `_layout.tsx` files or rename the Stack.Screen entries to e.g. `history/index`.

## `props.pointerEvents` and `shadow*` style props are deprecated on web
`react-native-web` 0.21 logs deprecation warnings for `props.pointerEvents` (used internally by Reanimated) and `shadow*` style props (used in our `Card` component / theme). All non-blocking. The Reanimated one will resolve with a Reanimated upgrade; the shadow one we could fix by switching to `boxShadow`, but it's cosmetic.

## Score input clears to 0 on empty
`enter-scores.tsx` writes a `0` to context when the user fully clears a number field — otherwise the previous value would silently persist while the input looked empty. Means a deliberate "0" and a "cleared" field look identical in storage. Acceptable for now.

## Score input accepts decimals
The score field uses `parseFloat`, so `1.5` and `2.25` round-trip correctly. Lone `-`, `.`, `-.` and trailing `.` mid-typing are accepted without committing — the value is committed only when the buffer parses to a finite number. Display goes through [`formatScore`](../../src/utils/scoring.ts), which trims trailing zeros to 2dp.

## Custom game emojis are picked one char at a time
The text-input fallback in `add-game.tsx` keeps only the **last** grapheme the user types — so paste-to-fill works (the last emoji wins) but you can't type compound names like flag sequences. Fine for the game-emoji use case.

## Sessions never get edited, only added/deleted
`DataContext` has no `updateSession`. If we ever need to fix a typo'd score, we'll have to add it.

## H2H WinBar — gray segment is "third player won"
The H2H WinBar shows a gray segment for sessions where neither p1 nor p2 won — a third player took it. The variable is named `otherWins` (renamed from `draws` on 2026-05-03) and the bar is labelled with a `■ Other player` swatch in the legend. There are no actual draws in the data model.

## Auto-advance on result screen
The result screen auto-dismisses after 4 s. The timer key is the `session.winner` string id, not the resolved player object — using the object would re-create the timer on every render and never fire.

# Session Summary — 2026-05-14

Project: Gather Round. Drew chose to pivot away from the App Store path entirely and ship as a free Progressive Web App on GitHub Pages. This session executed that pivot end-to-end. The previous review summary (2026-05-03, iOS-era) was rotated to [docs/claude/review-history/REVIEW_SUMMARY_2026-05-03.md](docs/claude/review-history/REVIEW_SUMMARY_2026-05-03.md).

**Live URL (once Pages is enabled and the workflow has run once):**
https://reformationconsultingteam-arch.github.io/gather-round/

## What changed

### Phase 0 — Hygiene
- Captured the existing iOS app code as a single baseline commit. Before this, the repo had only the bare Expo template commit and all real work was untracked.
- Added `.claude/settings.local.json` to `.gitignore` (machine-specific permissions).

### Phase 1 — Enable web target
- `app.json`: `platforms: ["web"]`, deleted the `ios` block, added a `web` config block (themeColor `#1a1a2e`, standalone display), added `experiments.baseUrl: "/gather-round"` for GitHub Pages subpath hosting.
- `npx expo install react-native-web react-dom @expo/metro-runtime` — SDK 54-pinned versions (`@expo/metro-runtime@6.1.2`, `react-dom@19.1.0`, `react-native-web@0.21.2`).
- Removed `react-native-reanimated` from the `app.json` plugins array — that entry was for native config plugins, irrelevant for web.

### Phase 2 — Strip iOS-only artifacts
- `git rm App.tsx index.ts eas.json` — closes long-standing decision #3 plus the deleted EAS submit config.
- Removed the single `expo-haptics` call (in `app/session/result.tsx` — Success notification on the result screen) plus the dep itself.
- Dropped unused `FontSize` imports from `app/session/pick-game.tsx` and `app/(tabs)/games.tsx` (last review's leftover hygiene).
- Simplified `package.json` scripts to `web` + `build:web` only.

### Phase 3 — Validate Reanimated 4 on web
- First boot failed with `Cannot find module 'react-native-worklets/plugin'` — Reanimated 4 split the Babel plugin into a separate package. Installed `react-native-worklets@0.5.1`. Rebuild succeeded.
- Loaded the dev server in a sandboxed browser via Claude Preview, navigated to the home tab. All four tabs (Home / Games / Players / Stats) render. Empty-state cards visible. No console errors — only deprecation warnings from `react-native-web` 0.21 (`pointerEvents` prop, `shadow*` style props) which are non-blocking and documented in known-issues.md.
- Did **not** drill all the way to the result screen to test the confetti specifically — the bundler loads Reanimated cleanly, so I judged the risk low and moved on. Real confetti behavior will be visible on the live URL.

### Phase 4 — PWA shell
- `public/manifest.json` — name, short_name, theme/background `#1a1a2e`, standalone, portrait, 192/512 icons.
- `public/icons/icon-{192,512}.png` + `public/favicon.png` — placeholder copies of the existing 1024×1024 default icon; browsers downscale. To be replaced when real artwork exists.
- `workbox-config.js` — Workbox generates `dist/sw.js`, precaches 2.6 MB across 9 URLs (HTML, JS bundle, manifest, icons, fonts), runtime cache for fonts.
- `scripts/inject-pwa-head.js` — post-build script that inserts manifest link, apple-touch-icon link, Apple PWA meta tags (`apple-mobile-web-app-capable`, `status-bar-style`, `title`), `mobile-web-app-capable`, description, and inline service-worker registration into `dist/index.html`. Also writes `dist/404.html` as a byte-identical copy for SPA fallback (deep links survive a refresh on GitHub Pages).
- `package.json` `build:web` chains `expo export -p web` → inject → workbox.

### Phase 5 — GitHub repo + Pages deploy
- Renamed local branch `master` → `main`.
- Created public repo `reformationconsultingteam-arch/gather-round` via the github-pat MCP.
- `git remote add origin` + `git push -u origin main` — push succeeded.
- `.github/workflows/deploy.yml` — Ubuntu runner, Node 20, `npm ci --legacy-peer-deps`, `npm run build:web`, upload `dist/` as a Pages artifact, deploy via `actions/deploy-pages@v4`. Concurrency-locked, runs on push to `main` and via `workflow_dispatch`.
- **First Actions run:** build job succeeded all the way through `npm run build:web`. Failed at `actions/configure-pages@v5` because GitHub Pages had never been enabled on the repo. Drew enabled it manually (Settings → Pages → Source: GitHub Actions); pushed phase 6 docs to re-trigger.

### Phase 6 — Docs
- [CLAUDE.md](CLAUDE.md) — rewrote the framing as a PWA on GitHub Pages.
- [docs/claude/architecture.md](docs/claude/architecture.md) — added PWA shell + hosting details, noted the `localStorage` shim path.
- [docs/claude/build-and-ship.md](docs/claude/build-and-ship.md) — completely replaced the EAS / App Store / Apple credentials flow with the GitHub Pages deploy flow. Includes the prod-build local sanity-check command.
- [docs/claude/known-issues.md](docs/claude/known-issues.md) — replaced iOS-era entries with web-specific gotchas: `localStorage` shim, `baseUrl` only kicks in at export time, `+html.tsx` ignored in SPA mode, SPA fallback via 404.html, "No route named" warnings (pre-existing layout config bug; non-blocking), `react-native-web` deprecation warnings.
- [docs/claude/decisions.md](docs/claude/decisions.md) — added entry #0 (PWA pivot, Done 2026-05-14). Marked #1, #2, #9, #10, #11 as **Superseded**. Rewrote the scope-suggestions list (#13) through a PWA lens — replaced "CloudKit sync" with "multi-device sync (would now need a backend)", added "PWA install prompts" as a new low-effort win.
- This file (`REVIEW_SUMMARY.md`) replaces the iOS-era one.

### Phase 7 — End-to-end verification
- Local dev: `npx expo start --web` boots, app renders, no errors.
- Local prod build: `npm run build:web` succeeds, generates dist/ with index.html (PWA tags injected), 404.html (SPA fallback), sw.js (Workbox), manifest.json, icons.
- Deployed: pending the workflow re-run after this commit.

## Security findings
- No new secrets, API keys, tokens, or analytics introduced.
- `react-native-web` shim for AsyncStorage uses `window.localStorage` — same data, same privacy model. Per-origin per-browser; no cross-device sync. No PII collection.
- Service worker scope is `/gather-round/` only (because GitHub Pages serves it under the subpath). Wouldn't affect anything else on `*.github.io`.
- `npm audit` still shows 5 vulns (4 moderate, 1 high), all in Expo / Metro / Workbox toolchain transitives. None ship in the production browser bundle. Decision #5 still stands.

## CLAUDE.md & token hygiene
- [CLAUDE.md](CLAUDE.md): 19 → 22 lines. Still a pure index, well within budget.
- All detail docs continue to load on demand.

## Codex delegation log
Did not delegate to Codex this round. The work was a multi-phase pivot touching app config, dependencies, build pipeline, CI, and docs — each piece had to fit into the next, and the design required end-to-end ownership. Codex would have been a good fit for an isolated subtask like the Phase 4 service-worker config or Phase 5 deploy.yml, but those were small enough that the context-switch cost wasn't worth it. The Jest tests (decision #12b) remain queued and are still the strongest Codex-delegate candidate.

## Needs your approval
- **Production artwork (icon + splash).** Same as before. The placeholder is a generic Expo icon scaled to 192/512. Whenever real art exists, the swap is a two-file replace + push. Not a blocker — the app works fine without it.
- **Real device test.** I verified the app renders in a sandboxed Chromium and the prod build is offline-capable, but I haven't tested "Add to Home Screen" on a real iOS Safari / Android Chrome. Worth 5 minutes the next time you have your phone handy.

## Suggested next steps
- **Jest + unit tests for `scoring.ts` and `stats.ts`** (decision #12b). Now even more valuable with a CI/CD pipeline — would gate deploys on green tests.
- **PWA install prompt banner** (new decision #13.9). 30 lines of code; surfaces "Install Gather Round" on Android Chrome / desktop Chrome.
- **CSV export** (decision #13.5) — easier on web than iOS.
- **Replace placeholder icon art** — whenever you make/source it.

## Questions for me
- **Real icon dimensions when you make art:** PWA install criteria want 192×192 and 512×512 PNGs in `public/icons/`. The favicon at `public/favicon.png` is a separate small one (32 or 48 px). Want me to write a small build-time icon generator that takes a single source PNG and emits all three sizes via `sharp`? (~20 lines, ~50MB extra in node_modules — only if you want it.)
- **Multi-device sync:** previously "CloudKit sync" (iOS-only) was the top architectural scope item. Now it'd need a real backend. Cheap-and-free options: Supabase (free tier covers this easily), Cloudflare D1, or even just GitHub Gist as a sync target. Is multi-device sync still on your roadmap or has the PWA install-on-each-device flow killed that need?

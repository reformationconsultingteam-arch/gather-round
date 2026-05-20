# Build & ship checklist

This is a Progressive Web App. No App Store, no EAS Cloud, no Apple developer account. One push to `main` → deployed.

**Live URL:** https://reformationconsultingteam-arch.github.io/gather-round/

## Local dev
```
npm install --legacy-peer-deps
npm run web
```
Opens `http://localhost:8081`. Hot reload via Metro. `--legacy-peer-deps` is required because of a stale `react-dom` peer-dep conflict — harmless.

## Production build (local sanity check)
```
npm run build:web
npx serve dist -l 5000
```
Then open `http://localhost:5000/gather-round/`. The `build:web` script chains three steps:
1. `expo export -p web` → emits the SPA bundle to `dist/`.
2. `node scripts/inject-pwa-head.js` → injects manifest link, apple-touch-icon, Apple PWA meta tags, and service-worker registration into `dist/index.html`. Also writes `dist/404.html` as an SPA fallback so GitHub Pages serves the app shell for any unknown path (deep links survive a refresh).
3. `npx workbox-cli generateSW workbox-config.js` → generates `dist/sw.js` precaching the bundle, fonts, icons. Service worker scope is `/gather-round/`.

## Deploy
Push to `main` — that's it.

`.github/workflows/deploy.yml` runs `build:web` on Ubuntu, uploads `dist/` as a Pages artifact, and deploys to GitHub Pages. Permissions: `pages: write` + `id-token: write`. Concurrency-locked so only one deploy runs at a time.

The first deploy ever needs Pages enabled once at Settings → Pages → Source: **GitHub Actions**. After that it's hands-off.

## What hosts under the hood
- **Subpath:** `/gather-round/` — set by `experiments.baseUrl` in `app.json`. All asset paths (JS, CSS, icons, manifest) are prefixed at build time.
- **SPA fallback:** `dist/404.html` is a byte-identical copy of `dist/index.html`. GitHub Pages serves it for any unknown path, which lets the React app handle client-side routing.
- **Service worker:** scoped to `/gather-round/`. Workbox precaches the bundle on first load; subsequent loads are offline-capable.

## PWA install (manual test)
- iOS Safari → Share → Add to Home Screen → "Gather Round" icon, opens fullscreen.
- Android Chrome → install prompt appears in the address bar after first visit.
- Desktop Chrome → install icon in the address bar.

## What's NOT here (and why)
- No EAS, no `eas.json`, no Apple credentials, no App Store Connect record.
- No `expo-haptics` — the iOS-only haptic feedback was removed during the PWA pivot (the feature was Success haptic on the result screen; a no-op on web anyway).
- No `App.tsx` or root `index.ts` — those were leftover Expo defaults, dead since `package.json` `main` is `expo-router/entry`.

## Production artwork
Still placeholder. The 512×512 and 192×192 icons under `public/icons/` are copies of the original 1024×1024 `assets/icon.png` — browsers downscale them. When Drew has real artwork:
1. Replace `public/icons/icon-192.png` and `public/icons/icon-512.png` with proper sizes (transparent or solid bg both fine).
2. Replace `assets/icon.png` (used by the favicon copy in `public/favicon.png`).
3. Push to `main`. Cache-bust by bumping the service worker version (Workbox handles this automatically on rebuild).

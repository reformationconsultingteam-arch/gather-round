# Build & ship checklist

Developer is on Windows — every iOS build runs in EAS Cloud. No Mac is involved.

## Local dev
```
npx expo start
```
Scan the QR with Expo Go on a physical iPhone. There is no web target (`platforms: ['ios']` in app.json).

## EAS build profiles (`eas.json`)
- `development` — internal dist, dev client.
- `preview` — internal dist, Release config.
- `production` — Release config, App Store distribution.

## First-time setup (not yet run as of 2026-04-07)
```
eas login
eas build:configure
```
Then fill in the empty fields in `eas.json` `submit.production.ios`:
- `appleId` (your Apple ID email)
- `ascAppId` (numeric App Store Connect app ID)
- `appleTeamId`

## App Store assets to create
> **BLOCKER before any submission:** as of 2026-04-27 there is no production
> artwork yet. The `assets/icon.png` and `assets/splash-icon.png` files in the
> repo are still placeholders / `create-expo-app` defaults. Production icon and
> splash mark must be created before the first EAS build is uploaded — Apple
> will reject the submission otherwise.

- `assets/icon.png` — 1024×1024 PNG, no transparency. Already referenced from `app.json`.
- `assets/splash-icon.png` — your logo mark (any size, transparent or dark bg). Splash background is `#1a1a2e`.
- Screenshots at the 6.9″ (iPhone 16 Pro Max) and 6.5″ sizes. Capture: Dashboard, Players, Session flow, Result celebration, Stats.

## Production build & submit
```
eas build --platform ios --profile production
eas submit --platform ios --profile production
```
EAS prompts for credentials on first run and creates the distribution cert + provisioning profile automatically (Managed credentials).

## App Store Connect record
Bundle id `com.gatherround.app`, category Games → Family, age rating 4+, privacy nutrition label "Data Not Collected" (the app makes no network calls). Then write the description, keywords, subtitle and click "Submit for Review".

## npm install gotcha
The repo uses `--legacy-peer-deps` because of a harmless `react-dom` peer-dep conflict (we don't ship a web target, so it never matters at runtime).

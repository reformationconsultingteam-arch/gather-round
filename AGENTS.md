# Gather Round

Progressive Web App for tracking family game-night sessions, scores, and stats. Local-only data via AsyncStorage (which maps to `localStorage` on web) — no auth, no backend, no network. Deployed free to GitHub Pages.

**Live URL:** https://reformationconsultingteam-arch.github.io/gather-round/

## Architectural decisions
- Expo SDK 54 managed workflow, **web-only platform target**, expo-router file-based navigation, AsyncStorage for persistence (browser `localStorage` under the hood via `react-native-web`).
- Single `DataContext` provider owns all CRUD (players, games, sessions). Ephemeral `SessionFlowContext` owns the 4-step session-creation modal state only.
- Sessions store `playerSnapshots` (name + color frozen at save time) so deleted players still render correctly in history.
- Games have a `scoreType` of `highest | lowest | winner`; `winner` games have no scorecard fields and the user manually crowns the winner.
- Production build is a SPA — `expo export -p web` → post-process to inject PWA head tags + 404.html SPA fallback → Workbox-generated service worker for offline.
- Hosted on GitHub Pages at the `/gather-round/` subpath (`experiments.baseUrl` in `app.json`). GitHub Actions deploys on every push to `main`.

## Detail docs
- Architecture & data flow → [docs/Codex/architecture.md](docs/Codex/architecture.md)
- File map (where to find what) → [docs/Codex/file-map.md](docs/Codex/file-map.md)
- UI conventions → [docs/Codex/ui-conventions.md](docs/Codex/ui-conventions.md)
- Build & ship checklist → [docs/Codex/build-and-ship.md](docs/Codex/build-and-ship.md)
- Known issues & non-obvious gotchas → [docs/Codex/known-issues.md](docs/Codex/known-issues.md)
- Decisions log (what's been agreed but not yet built) → [docs/Codex/decisions.md](docs/Codex/decisions.md)
- Latest review summary → [REVIEW_SUMMARY.md](REVIEW_SUMMARY.md)

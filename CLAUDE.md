# Gather Round

iOS-only React Native / Expo app for tracking family game-night sessions, scores, and stats. Local-only data via AsyncStorage — no auth, no backend, no network. Target: App Store submission.

## Architectural decisions
- Expo SDK 54 managed workflow, expo-router file-based navigation, AsyncStorage for persistence.
- Single `DataContext` provider owns all CRUD (players, games, sessions). Ephemeral `SessionFlowContext` owns the 4-step session-creation modal state only.
- Sessions store `playerSnapshots` (name + color frozen at save time) so deleted players still render correctly in history.
- Games have a `scoreType` of `highest | lowest | winner`; `winner` games have no scorecard fields and the user manually crowns the winner.
- All builds run via EAS Cloud (developer is on Windows, no Mac).

## Detail docs
- Architecture & data flow → [docs/claude/architecture.md](docs/claude/architecture.md)
- File map (where to find what) → [docs/claude/file-map.md](docs/claude/file-map.md)
- UI conventions → [docs/claude/ui-conventions.md](docs/claude/ui-conventions.md)
- Build & ship checklist → [docs/claude/build-and-ship.md](docs/claude/build-and-ship.md)
- Known issues & non-obvious gotchas → [docs/claude/known-issues.md](docs/claude/known-issues.md)
- Decisions log (what's been agreed but not yet built) → [docs/claude/decisions.md](docs/claude/decisions.md)
- Latest review summary → [REVIEW_SUMMARY.md](REVIEW_SUMMARY.md)

# Gather Round

A family game-night tracker for iOS. Add players, log sessions, and watch the leaderboard fight itself out over time. Local-only — no account, no network, no analytics.

## Stack
- Expo SDK 54 (managed workflow), React Native 0.81, expo-router 6.
- AsyncStorage for persistence.
- react-native-reanimated 4 for the result-screen confetti.
- iOS only. Builds run on EAS Cloud.

## Develop
```
npm install --legacy-peer-deps
npx expo start
```
Scan the QR with Expo Go on a physical iPhone.

## Build for the App Store
See [docs/claude/build-and-ship.md](docs/claude/build-and-ship.md).

## Project docs
For deeper context, start at [CLAUDE.md](CLAUDE.md) and follow the pointers.

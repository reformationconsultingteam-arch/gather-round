# UI conventions

## Theme
All colors, spacing, radii, and font sizes come from `src/constants/theme.ts` — never hardcode. `Colors.bg` (`#12121E`) is the screen background; `Colors.surface` is one shade lighter for cards; `Colors.surfaceAlt` is two shades lighter for inputs and chips.

Dark UI only (`userInterfaceStyle: 'dark'` in app.json). Status bar style is `light` everywhere.

## Components
Reach for these before rolling your own:
- **`AppText`** — wraps `<Text>` with `size`/`weight`/`color`/`align` props mapped to theme tokens. Default size `md`, weight `regular`.
- **`Avatar`** — circle with player initials, sized `sm | md | lg | xl`. Border + 20%-opacity fill use the player's color.
- **`Card`** — surface-colored, bordered, rounded container. Pass `onPress` to make it pressable.
- **`PrimaryButton` / `GhostButton`** — full-width by default (`fullWidth={false}` to opt out). Min height 50pt (above Apple HIG 44).
- **`ScreenHeader`** — large title row with optional right action (icon or label).

All screens use `react-native-safe-area-context`'s `<SafeAreaView edges={['top']}>` as the root view.

## Iconography
`@expo/vector-icons` (Ionicons family). Always typed via `React.ComponentProps<typeof Ionicons>['name']` when passed as a prop.

## Player colors
The 10-color palette in `src/data/colors.ts` cycles by index. Use `colorForIndex(players.length)` for the next-up preview color when adding a player. Tints are applied with appended hex alpha, e.g. `color + '22'` for ~13% fill or `color + '66'` for ~40% border.

## Score-type accent colors
Used for the badge in game lists and pickers:
- `highest` → `#6BCB77` (green)
- `lowest` → `#FF922B` (orange)
- `winner` → `#4D96FF` (blue)

## Resolving deleted players
Sessions persist player IDs even after a player is deleted. Always use [`resolvePlayer`](../../src/utils/players.ts) from `src/utils/players.ts`:
1. Looks up the player in the live `players` array.
2. Falls back to `session.playerSnapshots[playerId]` (frozen name + color).
3. Returns `null` if neither exists (skip the row).

Signature: `resolvePlayer(session, playerId, livePlayers): Player | null`.

## Animation
Confetti + winner reveal use `react-native-reanimated` 4 worklets. The 36 confetti particles are rendered as separate `ConfettiParticle` components so each owns its own `useSharedValue`/`useAnimatedStyle` hooks (no hook-in-loop violation).

/** Warm, vibrant player colors. New players cycle through this palette. */
export const PLAYER_COLORS = [
  '#FF6B6B', // coral red
  '#FFD93D', // golden yellow
  '#6BCB77', // leaf green
  '#4D96FF', // sky blue
  '#FF922B', // tangerine
  '#CC5DE8', // purple
  '#20C997', // teal
  '#F06595', // pink
  '#74C0FC', // light blue
  '#A9E34B', // lime
];

export function colorForIndex(index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

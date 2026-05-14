import { ScoreType } from '../types';

/** Sum all field values for one player */
export function getPlayerTotal(scores: Record<string, number>): number {
  return Object.values(scores).reduce((sum, v) => sum + (Number(v) || 0), 0);
}

/**
 * Display a score with trailing zeros trimmed and at most 2 decimal places.
 * `1` → "1", `1.5` → "1.5", `1.50` → "1.5", `1.555` → "1.56".
 */
export function formatScore(n: number): string {
  if (!Number.isFinite(n)) return '0';
  return Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(2)));
}

/**
 * Determine the winner from scores.
 * For 'winner' scoreType, pass the manually selected playerId as `manualWinner`.
 */
export function calculateWinner(
  playerIds: string[],
  scores: Record<string, Record<string, number>>,
  scoreType: ScoreType,
  manualWinner?: string | null,
): string {
  if (scoreType === 'winner') {
    return manualWinner ?? playerIds[0];
  }

  const totals = playerIds.map(pid => ({
    pid,
    total: getPlayerTotal(scores[pid] ?? {}),
  }));

  totals.sort((a, b) =>
    scoreType === 'highest' ? b.total - a.total : a.total - b.total,
  );

  return totals[0].pid;
}

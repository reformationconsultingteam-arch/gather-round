import { ScoreType, Game, Session } from '../types';

/** Default points per place if a placement game doesn't specify its own rubric. */
export const DEFAULT_PLACEMENT_POINTS = [5, 3, 2, 1, 0];

/** Sum all field values for one player. Used by highest/lowest games. */
export function getPlayerTotal(scores: Record<string, number>): number {
  return Object.values(scores).reduce((sum, v) => sum + (Number(v) || 0), 0);
}

/**
 * Points awarded for a given 1-indexed finishing place in a placement game.
 * Anything past the rubric length scores 0.
 */
export function getPlacementPoints(place: number | undefined, game: Pick<Game, 'placementPoints'>): number {
  if (!Number.isFinite(place) || (place as number) < 1) return 0;
  const rubric = game.placementPoints ?? DEFAULT_PLACEMENT_POINTS;
  return rubric[(place as number) - 1] ?? 0;
}

/**
 * Display a score with trailing zeros trimmed and at most 2 decimal places.
 * `1` → "1", `1.5` → "1.5", `1.50` → "1.5", `1.555` → "1.56".
 */
export function formatScore(n: number): string {
  if (!Number.isFinite(n)) return '0';
  return Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(2)));
}

/** 1 → "1st", 2 → "2nd", 3 → "3rd", 11 → "11th", 21 → "21st", etc. */
export function formatPlace(n: number): string {
  if (!Number.isFinite(n) || n < 1) return '—';
  const v = Math.trunc(n);
  const mod100 = v % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${v}th`;
  switch (v % 10) {
    case 1: return `${v}st`;
    case 2: return `${v}nd`;
    case 3: return `${v}rd`;
    default: return `${v}th`;
  }
}

/**
 * Determine the winner from scores.
 * For 'winner' scoreType, pass the manually selected playerId as `manualWinner`.
 * For 'placement', winner is the player whose `Place` field === 1.
 */
export function calculateWinner(
  playerIds: string[],
  scores: Record<string, Record<string, number>>,
  scoreType: ScoreType,
  manualWinner?: string | null,
): string {
  if (scoreType === 'winner' || scoreType === 'secretHitler' || scoreType === 'rook') {
    return manualWinner ?? playerIds[0];
  }

  if (scoreType === 'placement') {
    const first = playerIds.find(pid => (scores[pid]?.Place ?? 0) === 1);
    return first ?? playerIds[0];
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

/**
 * The set of players who should receive a "win" credit on the leaderboard for this session.
 *
 * - Secret Hitler: everyone whose role is on the winning team (Hitler counts as fascist).
 * - Rook: every player on the winning team.
 * - All other scoreTypes (incl. legacy SH sessions without roles): [session.winner].
 *
 * Falls back to [session.winner] whenever the team-game fields are missing, so legacy
 * data from before this feature continues to work.
 */
export function getWinningPlayerIds(session: Session): string[] {
  if (session.winningTeam && session.roles) {
    const team = session.winningTeam;
    const winners = session.players.filter(pid => {
      const role = session.roles?.[pid];
      if (!role) return false;
      if (team === 'fascist') return role === 'fascist' || role === 'hitler';
      return role === 'liberal';
    });
    return winners.length > 0 ? winners : [session.winner];
  }

  if (session.rookData) {
    const team = session.rookData.winningTeam;
    const winners = session.rookData.teams[team] ?? [];
    return winners.length > 0 ? winners : [session.winner];
  }

  return session.winner ? [session.winner] : [];
}


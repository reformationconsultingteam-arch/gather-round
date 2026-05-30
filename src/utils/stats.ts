import { Session, Player, Game, ScoreType } from '../types';
import { getWinningPlayerIds } from './scoring';

// ─── Basic counts ─────────────────────────────────────────────────────────────

/** Total wins per playerId across all sessions. Team games credit every player on the winning team. */
export function getWinCounts(sessions: Session[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of sessions) {
    for (const pid of getWinningPlayerIds(s)) {
      counts[pid] = (counts[pid] ?? 0) + 1;
    }
  }
  return counts;
}

/** Number of sessions each player participated in */
export function getSessionsPerPlayer(sessions: Session[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of sessions) {
    for (const pid of s.players) {
      counts[pid] = (counts[pid] ?? 0) + 1;
    }
  }
  return counts;
}

/** Number of times each game has been played */
export function getGamePlayCounts(sessions: Session[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of sessions) {
    counts[s.gameId] = (counts[s.gameId] ?? 0) + 1;
  }
  return counts;
}

// ─── Per-player stats ─────────────────────────────────────────────────────────

export function getWinRate(sessions: Session[], playerId: string): number {
  const played = sessions.filter(s => s.players.includes(playerId)).length;
  if (played === 0) return 0;
  const wins = sessions.filter(s => getWinningPlayerIds(s).includes(playerId)).length;
  return wins / played;
}

/**
 * Current and longest win streak for a player.
 * Sessions sorted oldest → newest.
 */
export function getStreaks(sessions: Session[], playerId: string): { current: number; longest: number } {
  const playerSessions = sessions
    .filter(s => s.players.includes(playerId))
    .sort((a, b) => a.date.localeCompare(b.date));

  let current = 0;
  let longest = 0;
  let running = 0;

  for (const s of playerSessions) {
    if (getWinningPlayerIds(s).includes(playerId)) {
      running++;
      if (running > longest) longest = running;
    } else {
      running = 0;
    }
  }
  current = running;

  return { current, longest };
}

/** gameId the player has played most */
export function getFavoriteGameId(sessions: Session[], playerId: string): string | null {
  const counts: Record<string, number> = {};
  for (const s of sessions.filter(s => s.players.includes(playerId))) {
    counts[s.gameId] = (counts[s.gameId] ?? 0) + 1;
  }
  const entries = Object.entries(counts);
  if (entries.length === 0) return null;
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

/** playerId the given player has shared the most sessions with */
export function getBestRivalId(sessions: Session[], playerId: string): string | null {
  const counts: Record<string, number> = {};
  for (const s of sessions.filter(s => s.players.includes(playerId))) {
    for (const pid of s.players) {
      if (pid !== playerId) {
        counts[pid] = (counts[pid] ?? 0) + 1;
      }
    }
  }
  const entries = Object.entries(counts);
  if (entries.length === 0) return null;
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

// ─── Head-to-head ─────────────────────────────────────────────────────────────

export interface HeadToHeadResult {
  p1Wins: number;
  p2Wins: number;
  total: number;
  sharedSessions: Session[];
}

export function getHeadToHead(sessions: Session[], p1Id: string, p2Id: string): HeadToHeadResult {
  const shared = sessions.filter(
    s => s.players.includes(p1Id) && s.players.includes(p2Id),
  );
  const p1Wins = shared.filter(s => getWinningPlayerIds(s).includes(p1Id)).length;
  const p2Wins = shared.filter(s => getWinningPlayerIds(s).includes(p2Id)).length;
  return { p1Wins, p2Wins, total: shared.length, sharedSessions: shared };
}

// ─── Per-game stats ───────────────────────────────────────────────────────────

import { getPlayerTotal } from './scoring';

export interface GameBestScore {
  playerId: string;
  score: number;
  /** Name from snapshot (in case player was deleted) */
  playerName: string;
  playerColor: string;
}

/**
 * "Best" score for a game, respecting the game's score type:
 * - `highest`   games → the highest total ever achieved
 * - `lowest`    games → the lowest total ever achieved
 * - `placement` games → the player with the most 1st-place finishes (score = count)
 * - `winner`    games → null (no scores)
 */
export function getGameBestScore(
  sessions: Session[],
  gameId: string,
  scoreType: ScoreType,
): GameBestScore | null {
  if (scoreType === 'winner') return null;

  const gameSessions = sessions.filter(s => s.gameId === gameId);

  if (scoreType === 'placement') {
    // Tally 1st-place finishes per player across this game's sessions.
    const counts: Record<string, { score: number; name: string; color: string }> = {};
    for (const s of gameSessions) {
      for (const pid of s.players) {
        if ((s.scores[pid]?.Place ?? 0) !== 1) continue;
        const snap = s.playerSnapshots?.[pid];
        if (!counts[pid]) counts[pid] = { score: 0, name: snap?.name ?? 'Unknown', color: snap?.color ?? '#888' };
        counts[pid].score += 1;
        // Refresh snapshot to the most-recent one available
        if (snap) {
          counts[pid].name = snap.name;
          counts[pid].color = snap.color;
        }
      }
    }
    let best: GameBestScore | null = null;
    for (const [pid, c] of Object.entries(counts)) {
      if (best === null || c.score > best.score) {
        best = { playerId: pid, score: c.score, playerName: c.name, playerColor: c.color };
      }
    }
    return best;
  }

  let best: GameBestScore | null = null;
  for (const s of gameSessions) {
    for (const pid of s.players) {
      const score = getPlayerTotal(s.scores[pid] ?? {});
      const isBetter =
        best === null ||
        (scoreType === 'highest' ? score > best.score : score < best.score);
      if (isBetter) {
        const snap = s.playerSnapshots?.[pid];
        best = {
          playerId: pid,
          score,
          playerName: snap?.name ?? 'Unknown',
          playerColor: snap?.color ?? '#888',
        };
      }
    }
  }
  return best;
}

/** Win count per player for a specific game. Team games credit every winning-team member. */
export function getGameWinsPerPlayer(sessions: Session[], gameId: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of sessions.filter(s => s.gameId === gameId)) {
    for (const pid of getWinningPlayerIds(s)) {
      counts[pid] = (counts[pid] ?? 0) + 1;
    }
  }
  return counts;
}

/** Total MVP awards per playerId (Secret Hitler / any future game that tags MVP). */
export function getMvpCounts(sessions: Session[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of sessions) {
    if (s.mvpPlayerId) counts[s.mvpPlayerId] = (counts[s.mvpPlayerId] ?? 0) + 1;
  }
  return counts;
}

/** Team-win counts for Secret Hitler across the given sessions. */
export function getSecretHitlerTeamWins(sessions: Session[]): { liberal: number; fascist: number } {
  let liberal = 0;
  let fascist = 0;
  for (const s of sessions) {
    if (s.winningTeam === 'liberal') liberal++;
    else if (s.winningTeam === 'fascist') fascist++;
  }
  return { liberal, fascist };
}

// ─── Dashboard helpers ────────────────────────────────────────────────────────

export function getWinLeader(sessions: Session[], players: Player[]): Player | null {
  if (sessions.length === 0 || players.length === 0) return null;
  const counts = getWinCounts(sessions);
  const sorted = [...players].sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0));
  const leader = sorted[0];
  return (counts[leader.id] ?? 0) > 0 ? leader : null;
}

export function getMostPlayedGame(sessions: Session[], games: Game[]): Game | null {
  if (sessions.length === 0) return null;
  const counts = getGamePlayCounts(sessions);
  const sorted = [...games].sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0));
  const top = sorted[0];
  return (counts[top.id] ?? 0) > 0 ? top : null;
}

export type ScoreType = 'highest' | 'lowest' | 'winner' | 'placement' | 'secretHitler' | 'rook';

export interface Player {
  id: string;
  name: string;
  color: string;
  /** Optional list of group IDs this player belongs to. A player can be in multiple groups. */
  groupIds?: string[];
}

/** A user-defined grouping of players (e.g. "Family", "Friends"). */
export interface Group {
  id: string;
  name: string;
  color: string;
}

export interface Game {
  id: string;
  name: string;
  emoji: string;
  category: string;
  scoreType: ScoreType;
  /** Field labels for structured scorecards. Empty array = single total input. */
  scorecardFields: string[];
  /**
   * For `placement` games: points awarded to 1st, 2nd, 3rd, ... finishers.
   * Anything past the array length scores 0. Default: [5, 3, 2, 1, 0].
   */
  placementPoints?: number[];
  custom: boolean;
}

export type SecretHitlerRole = 'liberal' | 'fascist' | 'hitler';
export type SecretHitlerTeam = 'liberal' | 'fascist';

export interface RookRound {
  biddingTeam: 'A' | 'B';
  bidWinnerPlayerId?: string;
  bidAmount: number;
  teamAPoints: number;
  teamBPoints: number;
}

export interface RookData {
  teams: { A: string[]; B: string[] };
  teamNames?: { A: string; B: string };
  targetScore: number;
  rounds: RookRound[];
  winningTeam: 'A' | 'B';
}

/**
 * scores shape:
 *   - highest/lowest games: { [playerId]: { [fieldName]: number } }
 *   - winner   games:       { [playerId]: {} }  (winner field identifies the winner)
 *   - placement games:      { [playerId]: { Place: number } }  (1-indexed finishing position)
 *   - secretHitler games:   { [playerId]: {} }  (roles + winningTeam carry the result)
 *   - rook games:           { [playerId]: {} }  (rookData carries the result)
 */
export interface Session {
  id: string;
  gameId: string;
  date: string; // ISO 8601
  players: string[]; // ordered player IDs
  scores: Record<string, Record<string, number>>;
  winner: string; // playerId — kept populated even for team games for back-compat
  /** Snapshot of each player's name+color at session save time, so deleted players still display correctly */
  playerSnapshots: Record<string, { name: string; color: string }>;

  /** Secret Hitler: role assignment per player */
  roles?: Record<string, SecretHitlerRole>;
  /** Secret Hitler: which team won the round */
  winningTeam?: SecretHitlerTeam;
  /** Optional MVP tag (any player) */
  mvpPlayerId?: string;
  /** Optional bonus-fascist tag (Secret Hitler) */
  bonusFascistPlayerId?: string;

  /** Rook: per-round ledger and team composition */
  rookData?: RookData;
}

export type ScoreType = 'highest' | 'lowest' | 'winner';

export interface Player {
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
  custom: boolean;
}

/**
 * scores shape:
 *   - point games:  { [playerId]: { [fieldName]: number } }
 *   - winner games: { [playerId]: {} }  (winner field identifies the winner)
 */
export interface Session {
  id: string;
  gameId: string;
  date: string; // ISO 8601
  players: string[]; // ordered player IDs
  scores: Record<string, Record<string, number>>;
  winner: string; // playerId
  /** Snapshot of each player's name+color at session save time, so deleted players still display correctly */
  playerSnapshots: Record<string, { name: string; color: string }>;
}

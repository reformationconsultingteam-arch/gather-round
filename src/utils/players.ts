import { Player, Session } from '../types';

/**
 * Resolve a player ID against the live players list, falling back to the
 * frozen `playerSnapshots` on a session so deleted players still render with
 * their original name + color. Returns `null` when neither source has them.
 */
export function resolvePlayer(
  session: Session,
  playerId: string,
  livePlayers: Player[],
): Player | null {
  const live = livePlayers.find(p => p.id === playerId);
  if (live) return live;
  const snap = session.playerSnapshots?.[playerId];
  return snap ? { id: playerId, name: snap.name, color: snap.color } : null;
}

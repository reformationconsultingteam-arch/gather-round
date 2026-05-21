import { Session, Player } from '../types';

/**
 * Return only sessions where **every participant** is a member of the given group.
 * Pass `groupId = null` (the default in callers) to bypass filtering entirely.
 *
 * Semantics rationale: this matches the "Family Secret Hitler leaderboard" mental
 * model — a session "counts" toward a group only when the entire roster belongs
 * to that group. Mixed-roster sessions are visible only in "All".
 *
 * Players whose records have been deleted are absent from `players` and so don't
 * carry a `groupIds` array — sessions including them are excluded from any
 * group filter (but still appear under "All" via the snapshot fallback).
 */
export function filterSessionsByGroup(
  sessions: Session[],
  groupId: string | null,
  players: Player[],
): Session[] {
  if (!groupId) return sessions;

  // Index live players for O(1) lookup
  const playerById = new Map(players.map(p => [p.id, p]));

  return sessions.filter(s =>
    s.players.every(pid => {
      const p = playerById.get(pid);
      return !!p && Array.isArray(p.groupIds) && p.groupIds.includes(groupId);
    }),
  );
}

import { Session } from '../types';

/**
 * Return only the sessions tagged with the given group. Pass `groupId = null`
 * (the default in callers) to bypass filtering entirely.
 *
 * The group is a property of the session itself (which kind of game-night was this?),
 * chosen at creation time and editable afterward — NOT inferred from player tags. This
 * is what keeps a "Friends night" off the Family leaderboard even when a player belongs
 * to both groups. Untagged sessions (no `groupId`) appear only under "All".
 */
export function filterSessionsByGroup(
  sessions: Session[],
  groupId: string | null,
): Session[] {
  if (!groupId) return sessions;
  return sessions.filter(s => s.groupId === groupId);
}

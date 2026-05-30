import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useData } from '../../src/context/DataContext';
import { AppText, Avatar, Card, ActionSheet } from '../../src/components';
import type { ActionSheetAction } from '../../src/components';
import { Colors, Spacing, Radius } from '../../src/constants/theme';
import { formatScore, getPlayerTotal, getPlacementPoints, formatPlace } from '../../src/utils/scoring';
import { resolvePlayer } from '../../src/utils/players';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sessions, games, players, groups, setSessionGroup } = useData();
  const router = useRouter();
  const [groupSheet, setGroupSheet] = useState(false);

  const session = sessions.find(s => s.id === id);
  const game = session ? games.find(g => g.id === session.gameId) : null;

  if (!session || !game) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppText color={Colors.textSecondary} align="center" style={{ marginTop: Spacing.xl }}>
          Session not found.
        </AppText>
      </SafeAreaView>
    );
  }

  const isSecretHitler = game.scoreType === 'secretHitler' && !!session.roles && !!session.winningTeam;
  const isRook = game.scoreType === 'rook' && !!session.rookData;
  const isTeamGame = isSecretHitler || isRook;
  // Points scorecard applies only to highest/lowest/placement. winner + team games (incl. legacy
  // team-game sessions saved before roles existed) just list players under the winner callout.
  const isPointsGame =
    game.scoreType === 'highest' || game.scoreType === 'lowest' || game.scoreType === 'placement';
  const isPlacementGame = game.scoreType === 'placement';
  const winner = resolvePlayer(session, session.winner, players);
  const currentGroup = session.groupId ? groups.find(g => g.id === session.groupId) ?? null : null;

  const groupActions: ActionSheetAction[] = [
    ...groups.map(g => ({ label: g.name, onPress: () => setSessionGroup(session.id, g.id) })),
    ...(session.groupId ? [{ label: 'No group', onPress: () => setSessionGroup(session.id, null) }] : []),
  ];

  // Sort players: winner first; then by Place ascending for placement, or by total desc for other points games
  const sortedPlayers = [...session.players].sort((a, b) => {
    if (a === session.winner) return -1;
    if (b === session.winner) return 1;
    if (isPlacementGame) {
      return (session.scores[a]?.Place ?? 99) - (session.scores[b]?.Place ?? 99);
    }
    if (isPointsGame) {
      return getPlayerTotal(session.scores[b] ?? {}) - getPlayerTotal(session.scores[a] ?? {});
    }
    return 0;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Back button */}
      <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
        <Ionicons name="chevron-back" size={22} color={Colors.accent} />
        <AppText size="md" weight="semibold" color={Colors.accent}>Back</AppText>
      </Pressable>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <AppText style={styles.gameEmoji}>{game.emoji}</AppText>
          <AppText size="xxl" weight="heavy" align="center">{game.name}</AppText>
          <AppText size="sm" color={Colors.textSecondary} align="center" style={{ marginTop: Spacing.xs }}>
            {format(parseISO(session.date), 'EEEE, MMMM d, yyyy')}
          </AppText>
          {groups.length > 0 && (
            <Pressable
              onPress={() => setGroupSheet(true)}
              style={({ pressed }) => [
                styles.groupChip,
                currentGroup
                  ? { borderColor: currentGroup.color, backgroundColor: currentGroup.color + '1A' }
                  : { borderColor: Colors.border },
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={8}
            >
              {currentGroup && <View style={[styles.groupDot, { backgroundColor: currentGroup.color }]} />}
              <AppText size="sm" weight="semibold" color={currentGroup ? currentGroup.color : Colors.textSecondary}>
                {currentGroup ? currentGroup.name : 'Add to a group'}
              </AppText>
              <Ionicons name="chevron-down" size={14} color={currentGroup ? currentGroup.color : Colors.textMuted} style={{ marginLeft: 4 }} />
            </Pressable>
          )}
        </View>

        {/* Team-game callout (Secret Hitler / Rook) */}
        {isSecretHitler && (
          <SecretHitlerDetail session={session} players={players} />
        )}
        {isRook && (
          <RookDetail session={session} players={players} />
        )}

        {/* Winner callout — single-winner games only */}
        {!isTeamGame && winner && (
          <Card style={[styles.winnerCard, { borderColor: winner.color + '66' }]} padding={Spacing.md}>
            <AppText size="xs" weight="bold" color={Colors.textMuted} style={styles.winnerLabel}>
              WINNER
            </AppText>
            <View style={styles.winnerRow}>
              <AppText style={{ fontSize: 20, marginRight: Spacing.sm }}>👑</AppText>
              <Avatar name={winner.name} color={winner.color} size="md" />
              <AppText size="xl" weight="heavy" color={winner.color} style={{ marginLeft: Spacing.md }}>
                {winner.name}
              </AppText>
            </View>
          </Card>
        )}

        {/* Scorecard — skipped for team games (handled above) */}
        {!isTeamGame && (
          <AppText size="xs" weight="bold" color={Colors.textMuted} style={styles.sectionLabel}>
            {isPointsGame ? 'SCORECARD' : 'PLAYERS'}
          </AppText>
        )}

        {!isTeamGame && sortedPlayers.map(pid => {
          const p = resolvePlayer(session, pid, players);
          if (!p) return null;
          const isWinner = pid === session.winner;
          const playerScores = session.scores[pid] ?? {};
          const total = getPlayerTotal(playerScores);
          const hasFields = game.scorecardFields.length > 0;
          const place = isPlacementGame ? playerScores.Place : undefined;
          const placementPts = isPlacementGame ? getPlacementPoints(place, game) : 0;

          return (
            <Card
              key={pid}
              style={[styles.playerCard, isWinner && { borderColor: p.color + '66' }]}
              padding={0}
            >
              {/* Player header */}
              <View style={[styles.playerHeader, isWinner && { backgroundColor: p.color + '18' }]}>
                <Avatar name={p.name} color={p.color} size="sm" />
                <AppText size="md" weight="bold" style={{ flex: 1, marginLeft: Spacing.sm }}>
                  {p.name}
                </AppText>
                {isPlacementGame && place !== undefined && (
                  <AppText
                    size="xs"
                    color={Colors.textSecondary}
                    style={{ marginRight: Spacing.sm }}
                  >
                    {formatPlace(place)}
                  </AppText>
                )}
                {isWinner && <AppText style={{ marginRight: Spacing.xs }}>👑</AppText>}
                {isPlacementGame ? (
                  <AppText size="lg" weight="heavy" color={isWinner ? p.color : Colors.textPrimary}>
                    {placementPts} pt{placementPts === 1 ? '' : 's'}
                  </AppText>
                ) : isPointsGame && (
                  <AppText size="lg" weight="heavy" color={isWinner ? p.color : Colors.textPrimary}>
                    {formatScore(total)}
                  </AppText>
                )}
              </View>

              {/* Field breakdown — only for highest/lowest games, not placement */}
              {isPointsGame && !isPlacementGame && hasFields && (
                <View style={styles.fields}>
                  {game.scorecardFields.map(field => (
                    <View key={field} style={styles.fieldRow}>
                      <AppText size="sm" color={Colors.textSecondary} style={{ flex: 1 }}>{field}</AppText>
                      <AppText size="sm" weight="semibold">
                        {formatScore(playerScores[field] ?? 0)}
                      </AppText>
                    </View>
                  ))}
                </View>
              )}

              {isPointsGame && !isPlacementGame && !hasFields && (
                <View style={styles.fields}>
                  <View style={styles.fieldRow}>
                    <AppText size="sm" color={Colors.textSecondary} style={{ flex: 1 }}>Score</AppText>
                    <AppText size="sm" weight="semibold">{formatScore(playerScores['score'] ?? 0)}</AppText>
                  </View>
                </View>
              )}
            </Card>
          );
        })}
      </ScrollView>

      <ActionSheet
        visible={groupSheet}
        onClose={() => setGroupSheet(false)}
        title="Tag this game-night"
        subtitle="Which group did this night belong to?"
        actions={groupActions}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: Spacing.sm,
    paddingVertical: 5,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  groupDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  scroll: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  gameEmoji: { fontSize: 56, marginBottom: Spacing.sm },
  winnerCard: {
    marginBottom: Spacing.lg,
    borderWidth: 1.5,
  },
  winnerLabel: { letterSpacing: 0.8, marginBottom: Spacing.sm },
  winnerRow: { flexDirection: 'row', alignItems: 'center' },
  sectionLabel: {
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  playerCard: {
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  fields: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
});

// ─── Secret Hitler detail ─────────────────────────────────────────────────────

const ROLE_COLORS = { liberal: '#3B82F6', fascist: '#EF4444', hitler: '#111827' } as const;
const ROLE_LABELS = { liberal: 'Liberal', fascist: 'Fascist', hitler: 'Hitler' } as const;

function SecretHitlerDetail({ session, players }: { session: any; players: any[] }) {
  const team = session.winningTeam as 'liberal' | 'fascist';
  const teamColor = team === 'fascist' ? ROLE_COLORS.fascist : ROLE_COLORS.liberal;
  const winningRoles = team === 'fascist' ? ['fascist', 'hitler'] : ['liberal'];

  return (
    <View style={{ marginBottom: Spacing.lg }}>
      <Card style={[styles.winnerCard, { borderColor: teamColor + '66' }]} padding={Spacing.md}>
        <AppText size="xs" weight="bold" color={Colors.textMuted} style={styles.winnerLabel}>
          WINNER
        </AppText>
        <AppText size="xl" weight="heavy" color={teamColor}>
          {team === 'fascist' ? 'Fascists' : 'Liberals'} won
        </AppText>
      </Card>

      <AppText size="xs" weight="bold" color={Colors.textMuted} style={styles.sectionLabel}>ROLES</AppText>
      {session.players.map((pid: string) => {
        const p = resolvePlayer(session, pid, players);
        if (!p) return null;
        const role = session.roles?.[pid] as 'liberal' | 'fascist' | 'hitler' | undefined;
        const isWinningSide = !!role && winningRoles.includes(role);
        const isMvp = session.mvpPlayerId === pid;
        const isBonus = session.bonusFascistPlayerId === pid;
        return (
          <Card
            key={pid}
            style={[styles.playerCard, isWinningSide && { borderColor: p.color + '66' }]}
            padding={0}
          >
            <View style={[styles.playerHeader, isWinningSide && { backgroundColor: p.color + '12' }]}>
              <Avatar name={p.name} color={p.color} size="sm" />
              <AppText size="md" weight={isWinningSide ? 'bold' : 'regular'} style={{ flex: 1, marginLeft: Spacing.sm }}>
                {p.name}
              </AppText>
              {isMvp && (
                <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1, borderColor: '#FFD93D', backgroundColor: '#FFD93D22', marginRight: 6 }}>
                  <AppText size="xs" weight="bold" color="#92710A">MVP</AppText>
                </View>
              )}
              {isBonus && (
                <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1, borderColor: '#EF4444', backgroundColor: '#EF444422', marginRight: 6 }}>
                  <AppText size="xs" weight="bold" color="#DC2626">Bonus F</AppText>
                </View>
              )}
              {role && (
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: ROLE_COLORS[role] }}>
                  <AppText size="xs" weight="bold" color="#fff">{ROLE_LABELS[role]}</AppText>
                </View>
              )}
            </View>
          </Card>
        );
      })}
    </View>
  );
}

// ─── Rook detail ──────────────────────────────────────────────────────────────

function RookDetail({ session, players }: { session: any; players: any[] }) {
  const data = session.rookData;
  if (!data) return null;
  const teamATotal = data.rounds.reduce((s: number, r: any) => s + r.teamAPoints, 0);
  const teamBTotal = data.rounds.reduce((s: number, r: any) => s + r.teamBPoints, 0);
  const winnerTeam = data.winningTeam as 'A' | 'B';

  return (
    <View style={{ marginBottom: Spacing.lg }}>
      <Card style={[styles.winnerCard, { borderColor: Colors.accent + '66' }]} padding={Spacing.md}>
        <AppText size="xs" weight="bold" color={Colors.textMuted} style={styles.winnerLabel}>
          WINNER
        </AppText>
        <AppText size="xl" weight="heavy" color={Colors.accent}>
          Team {winnerTeam} won  ({teamATotal} – {teamBTotal})
        </AppText>
        <AppText size="sm" color={Colors.textSecondary} style={{ marginTop: 4 }}>
          Target: {data.targetScore} · {data.rounds.length} round{data.rounds.length === 1 ? '' : 's'}
        </AppText>
      </Card>

      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
        {(['A', 'B'] as const).map(letter => (
          <Card key={letter} style={[
            { flex: 1, borderWidth: 2, borderColor: Colors.border, borderRadius: Radius.lg },
            winnerTeam === letter && { borderColor: Colors.accent, backgroundColor: Colors.accent + '14' },
          ]} padding={Spacing.md}>
            <AppText size="xs" color={Colors.textSecondary}>Team {letter}</AppText>
            <AppText size="xl" weight="heavy">{letter === 'A' ? teamATotal : teamBTotal}</AppText>
            {data.teams[letter].map((pid: string) => {
              const p = resolvePlayer(session, pid, players);
              if (!p) return null;
              return (
                <View key={pid} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  <Avatar name={p.name} color={p.color} size="sm" />
                  <AppText size="sm" weight="semibold" style={{ marginLeft: 6 }}>{p.name}</AppText>
                </View>
              );
            })}
          </Card>
        ))}
      </View>

      <AppText size="xs" weight="bold" color={Colors.textMuted} style={styles.sectionLabel}>ROUNDS</AppText>
      {data.rounds.map((r: any, i: number) => {
        const bidderPts = r.biddingTeam === 'A' ? r.teamAPoints : r.teamBPoints;
        const madeBid = bidderPts >= r.bidAmount;
        return (
          <Card key={i} style={{ marginBottom: 6, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md }} padding={Spacing.sm}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <AppText size="sm" weight="semibold">
                  R{i + 1} · Team {r.biddingTeam} bid {r.bidAmount}
                </AppText>
                <AppText size="xs" color={Colors.textSecondary}>
                  A: {r.teamAPoints}  ·  B: {r.teamBPoints}
                </AppText>
              </View>
              <View style={{
                paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1,
                borderColor: madeBid ? '#10B981' : '#EF4444',
                backgroundColor: (madeBid ? '#10B981' : '#EF4444') + '22',
              }}>
                <AppText size="xs" weight="bold" color={madeBid ? '#059669' : '#DC2626'}>
                  {madeBid ? 'Made' : 'Set'}
                </AppText>
              </View>
            </View>
          </Card>
        );
      })}
    </View>
  );
}

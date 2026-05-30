import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useData } from '../../src/context/DataContext';
import { AppText, Avatar, Card } from '../../src/components';
import { Colors, Spacing, Radius } from '../../src/constants/theme';
import { getGameBestScore, getGameWinsPerPlayer } from '../../src/utils/stats';
import { formatScore } from '../../src/utils/scoring';
import { resolvePlayer } from '../../src/utils/players';
import { filterSessionsByGroup } from '../../src/utils/groups';

export default function GameStatsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { games, sessions, players, groups } = useData();
  const router = useRouter();
  const [groupId, setGroupId] = useState<string | null>(null);

  const game = games.find(g => g.id === id);

  // Apply group filter before computing per-game derivatives.
  const scopedSessions = useMemo(
    () => filterSessionsByGroup(sessions, groupId),
    [sessions, groupId],
  );

  const gameSessions = useMemo(
    () => scopedSessions.filter(s => s.gameId === id).reverse(),
    [scopedSessions, id],
  );

  const bestScore = useMemo(
    () => (id && game) ? getGameBestScore(scopedSessions, id, game.scoreType) : null,
    [scopedSessions, id, game],
  );

  const winsPerPlayer = useMemo(
    () => id ? getGameWinsPerPlayer(scopedSessions, id) : {},
    [scopedSessions, id],
  );

  // Rank players by wins for this game (must be called before any early return — Rules of Hooks)
  const rankedPlayers = useMemo(() => {
    return players
      .filter(p => winsPerPlayer[p.id] !== undefined)
      .map(p => ({ player: p, wins: winsPerPlayer[p.id] ?? 0 }))
      .sort((a, b) => b.wins - a.wins);
  }, [players, winsPerPlayer]);

  if (!game) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppText color={Colors.textSecondary} align="center" style={{ marginTop: Spacing.xl }}>
          Game not found.
        </AppText>
      </SafeAreaView>
    );
  }

  const isPointsGame = game.scoreType !== 'winner';
  const isPlacementGame = game.scoreType === 'placement';

  const maxWins = rankedPlayers[0]?.wins ?? 1;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
        <Ionicons name="chevron-back" size={22} color={Colors.accent} />
        <AppText size="md" weight="semibold" color={Colors.accent}>Stats</AppText>
      </Pressable>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <AppText style={styles.emoji}>{game.emoji}</AppText>
          <AppText size="xxl" weight="heavy" align="center">{game.name}</AppText>
          <AppText size="sm" color={Colors.textSecondary} align="center" style={{ marginTop: Spacing.xs }}>
            Played {gameSessions.length} time{gameSessions.length !== 1 ? 's' : ''}
          </AppText>
        </View>

        {/* Group scope chips */}
        {groups.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scopeRow}
          >
            <Pressable
              onPress={() => setGroupId(null)}
              style={({ pressed }) => [
                styles.scopeChip,
                groupId === null && { backgroundColor: Colors.accent, borderColor: Colors.accent },
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={[styles.scopeChipDot, { backgroundColor: groupId === null ? '#fff' : Colors.accent }]} />
              <AppText size="sm" weight="semibold" color={groupId === null ? '#fff' : Colors.textPrimary}>
                All
              </AppText>
            </Pressable>
            {groups.map(g => {
              const selected = groupId === g.id;
              return (
                <Pressable
                  key={g.id}
                  onPress={() => setGroupId(g.id)}
                  style={({ pressed }) => [
                    styles.scopeChip,
                    selected && { backgroundColor: g.color, borderColor: g.color },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <View style={[styles.scopeChipDot, { backgroundColor: selected ? '#fff' : g.color }]} />
                  <AppText size="sm" weight="semibold" color={selected ? '#fff' : Colors.textPrimary}>
                    {g.name}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Best score */}
        {isPointsGame && bestScore && (
          <>
            <SectionLabel>
              {isPlacementGame
                ? 'MOST 1ST-PLACE FINISHES'
                : game.scoreType === 'lowest' ? 'BEST (LOWEST) SCORE' : 'ALL-TIME HIGH SCORE'}
            </SectionLabel>
            <Card style={styles.highScoreCard} padding={Spacing.md}>
              <AppText size="display" weight="heavy" color={bestScore.playerColor} align="center">
                {formatScore(bestScore.score)}
                {isPlacementGame && (
                  <AppText size="lg" weight="semibold" color={Colors.textSecondary}>
                    {' '}wins
                  </AppText>
                )}
              </AppText>
              <View style={styles.highScorePlayer}>
                <Avatar name={bestScore.playerName} color={bestScore.playerColor} size="sm" />
                <AppText size="md" weight="semibold" color={bestScore.playerColor} style={{ marginLeft: Spacing.sm }}>
                  {bestScore.playerName}
                </AppText>
              </View>
            </Card>
          </>
        )}

        {/* Wins by player */}
        {rankedPlayers.length > 0 && (
          <>
            <SectionLabel>WINS BY PLAYER</SectionLabel>
            <Card style={{ marginBottom: Spacing.lg }} padding={Spacing.md}>
              {rankedPlayers.map(({ player, wins }, index) => (
                <Pressable
                  key={player.id}
                  onPress={() => router.push(`/player/${player.id}`)}
                  style={styles.barRow}
                >
                  {/* Rank + avatar */}
                  <AppText size="sm" weight="bold" color={index === 0 ? player.color : Colors.textMuted} style={styles.barRank}>
                    {index === 0 ? '👑' : `#${index + 1}`}
                  </AppText>
                  <Avatar name={player.name} color={player.color} size="sm" />
                  <AppText size="sm" weight="semibold" style={styles.barName} numberOfLines={1}>
                    {player.name}
                  </AppText>
                  {/* Bar */}
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          flex: wins / maxWins,
                          backgroundColor: player.color,
                        },
                      ]}
                    />
                    <View style={{ flex: 1 - wins / maxWins }} />
                  </View>
                  <AppText size="sm" weight="bold" color={player.color} style={styles.barCount}>
                    {wins}
                  </AppText>
                </Pressable>
              ))}
            </Card>
          </>
        )}

        {/* Recent sessions */}
        {gameSessions.length > 0 && (
          <>
            <SectionLabel>SESSIONS</SectionLabel>
            {gameSessions.slice(0, 8).map(session => {
              const winner = resolvePlayer(session, session.winner, players);

              return (
                <Pressable
                  key={session.id}
                  onPress={() => router.push(`/history/${session.id}`)}
                  style={({ pressed }) => [styles.sessionRow, pressed && { opacity: 0.75 }]}
                >
                  <View style={{ flex: 1 }}>
                    <AppText size="sm" weight="semibold">
                      {format(parseISO(session.date), 'MMM d, yyyy')}
                    </AppText>
                    <AppText size="xs" color={Colors.textSecondary}>
                      {session.players.length} players
                    </AppText>
                  </View>
                  {winner && (
                    <View style={styles.sessionWinner}>
                      <AppText style={{ fontSize: 13 }}>👑 </AppText>
                      <AppText size="sm" weight="semibold" color={winner.color} numberOfLines={1}>
                        {winner.name}
                      </AppText>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} style={{ marginLeft: Spacing.xs }} />
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <AppText size="xs" weight="bold" color={Colors.textMuted} style={styles.sectionLabel}>
      {children}
    </AppText>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  scroll: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl },
  hero: { alignItems: 'center', paddingVertical: Spacing.lg },
  scopeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: 2,
    paddingBottom: Spacing.md,
  },
  scopeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.full,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minHeight: 32,
  },
  scopeChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  emoji: { fontSize: 64, marginBottom: Spacing.sm },
  sectionLabel: {
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    marginTop: Spacing.xs,
  },
  highScoreCard: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  highScorePlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  barRank: { width: 28, textAlign: 'center' },
  barName: { width: 72, marginLeft: Spacing.sm, marginRight: Spacing.sm },
  barTrack: {
    flex: 1,
    height: 10,
    flexDirection: 'row',
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceAlt,
  },
  barFill: { borderRadius: 5 },
  barCount: { width: 24, textAlign: 'right', marginLeft: Spacing.sm },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
    minHeight: 52,
  },
  sessionWinner: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 100,
  },
});

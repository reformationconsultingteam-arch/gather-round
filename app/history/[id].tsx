import React from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useData } from '../../src/context/DataContext';
import { AppText, Avatar, Card } from '../../src/components';
import { Colors, Spacing, Radius } from '../../src/constants/theme';
import { formatScore, getPlayerTotal } from '../../src/utils/scoring';
import { resolvePlayer } from '../../src/utils/players';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sessions, games, players } = useData();
  const router = useRouter();

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

  const isPointsGame = game.scoreType !== 'winner';
  const winner = resolvePlayer(session, session.winner, players);

  // Sort players: winner first, then by score desc (or original order for winner-pick)
  const sortedPlayers = [...session.players].sort((a, b) => {
    if (a === session.winner) return -1;
    if (b === session.winner) return 1;
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
        </View>

        {/* Winner callout */}
        {winner && (
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

        {/* Scorecard */}
        <AppText size="xs" weight="bold" color={Colors.textMuted} style={styles.sectionLabel}>
          {isPointsGame ? 'SCORECARD' : 'PLAYERS'}
        </AppText>

        {sortedPlayers.map(pid => {
          const p = resolvePlayer(session, pid, players);
          if (!p) return null;
          const isWinner = pid === session.winner;
          const playerScores = session.scores[pid] ?? {};
          const total = getPlayerTotal(playerScores);
          const hasFields = game.scorecardFields.length > 0;

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
                {isWinner && <AppText style={{ marginRight: Spacing.xs }}>👑</AppText>}
                {isPointsGame && (
                  <AppText size="lg" weight="heavy" color={isWinner ? p.color : Colors.textPrimary}>
                    {formatScore(total)}
                  </AppText>
                )}
              </View>

              {/* Field breakdown */}
              {isPointsGame && hasFields && (
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

              {isPointsGame && !hasFields && (
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
    </SafeAreaView>
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

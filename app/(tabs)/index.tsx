import React, { useMemo } from 'react';
import { View, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useData } from '../../src/context/DataContext';
import { AppText, Avatar, Card, ScreenHeader } from '../../src/components';
import { Colors, Spacing, Radius } from '../../src/constants/theme';
import { getWinLeader, getMostPlayedGame, getWinCounts } from '../../src/utils/stats';
import { resolvePlayer } from '../../src/utils/players';

export default function HomeScreen() {
  const { sessions, players, games } = useData();
  const router = useRouter();

  const winLeader = useMemo(() => getWinLeader(sessions, players), [sessions, players]);
  const mostPlayed = useMemo(() => getMostPlayedGame(sessions, games), [sessions, games]);
  const winCounts = useMemo(() => getWinCounts(sessions), [sessions]);
  const recentSessions = useMemo(() => [...sessions].reverse().slice(0, 5), [sessions]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={recentSessions}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <ScreenHeader title="Gather Round" />

            {/* Stat cards row */}
            <View style={styles.statsRow}>
              <StatCard
                icon="game-controller"
                label="Sessions"
                value={String(sessions.length)}
              />
              <StatCard
                icon="trophy"
                label="Win Leader"
                value={winLeader ? `${winLeader.name} (${winCounts[winLeader.id] ?? 0})` : '—'}
                color={winLeader?.color}
              />
              <StatCard
                icon="star"
                label="Top Game"
                value={mostPlayed ? `${mostPlayed.emoji} ${mostPlayed.name}` : '—'}
              />
            </View>

            {/* Recent sessions header */}
            {sessions.length > 0 && (
              <View style={styles.sectionHeader}>
                <AppText size="sm" weight="bold" color={Colors.textMuted} style={styles.sectionLabel}>
                  RECENT SESSIONS
                </AppText>
                <Pressable onPress={() => router.push('/history')} hitSlop={12}>
                  <AppText size="sm" weight="semibold" color={Colors.accent}>See all</AppText>
                </Pressable>
              </View>
            )}
          </>
        }
        ListEmptyComponent={<EmptyState />}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        renderItem={({ item }) => {
          const game = games.find(g => g.id === item.gameId);
          const winner = resolvePlayer(item, item.winner, players);

          return (
            <Pressable
              onPress={() => router.push(`/history/${item.id}`)}
              style={({ pressed }) => [styles.sessionRow, pressed && { opacity: 0.75 }]}
            >
              {/* Game emoji */}
              <AppText style={styles.sessionEmoji}>{game?.emoji ?? '🎲'}</AppText>

              <View style={styles.sessionInfo}>
                <AppText size="md" weight="semibold" numberOfLines={1}>
                  {game?.name ?? 'Unknown Game'}
                </AppText>
                <AppText size="xs" color={Colors.textSecondary}>
                  {format(parseISO(item.date), 'MMM d, yyyy')} · {item.players.length} players
                </AppText>
              </View>

              {/* Winner */}
              {winner && (
                <View style={styles.sessionWinner}>
                  <AppText style={{ fontSize: 12 }}>👑 </AppText>
                  <Avatar name={winner.name} color={winner.color} size="sm" />
                </View>
              )}

              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={{ marginLeft: Spacing.xs }} />
            </Pressable>
          );
        }}
      />

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] }]}
        onPress={() => router.push('/session/pick-game')}
      >
        <Ionicons name="add" size={26} color="#fff" />
        <AppText size="md" weight="bold" color="#fff" style={{ marginLeft: Spacing.sm }}>
          New Session
        </AppText>
      </Pressable>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <Card style={styles.statCard} padding={Spacing.sm}>
      <Ionicons name={icon} size={18} color={color ?? Colors.accent} />
      <AppText size="xs" color={Colors.textMuted} style={{ marginTop: 4 }}>{label}</AppText>
      <AppText size="sm" weight="bold" color={color ?? Colors.textPrimary} numberOfLines={1} style={{ marginTop: 2 }}>
        {value}
      </AppText>
    </Card>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <AppText style={{ fontSize: 56 }} align="center">🎲</AppText>
      <AppText size="xl" weight="heavy" align="center" style={{ marginTop: Spacing.md }}>
        Game night starts here
      </AppText>
      <AppText size="md" color={Colors.textSecondary} align="center" style={{ marginTop: Spacing.sm }}>
        Tap New Session to record your first game
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 120,
    flexGrow: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginVertical: Spacing.md,
  },
  statCard: {
    flex: 1,
    minHeight: 80,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionLabel: { letterSpacing: 0.8 },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 60,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sessionEmoji: { fontSize: 26, width: 36, textAlign: 'center' },
  sessionInfo: { flex: 1, marginLeft: Spacing.sm },
  sessionWinner: { flexDirection: 'row', alignItems: 'center' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: Spacing.xl,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});

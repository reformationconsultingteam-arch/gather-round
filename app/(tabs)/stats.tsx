import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../src/context/DataContext';
import { AppText, Avatar, Card, ScreenHeader, GroupChip } from '../../src/components';
import { Colors, Spacing, Radius } from '../../src/constants/theme';
import { getWinCounts } from '../../src/utils/stats';
import { filterSessionsByGroup } from '../../src/utils/groups';

// ─── Stats hub (landing) ──────────────────────────────────────────────────────

export default function StatsScreen() {
  const { players, sessions, games, groups } = useData();
  const router = useRouter();
  const [groupId, setGroupId] = useState<string | null>(null);

  const filteredSessions = useMemo(
    () => filterSessionsByGroup(sessions, groupId),
    [sessions, groupId],
  );

  const playedGames = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of filteredSessions) counts[s.gameId] = (counts[s.gameId] ?? 0) + 1;
    return games
      .filter(g => (counts[g.id] ?? 0) > 0)
      .map(g => ({ game: g, count: counts[g.id] }))
      .sort((a, b) => b.count - a.count);
  }, [games, filteredSessions]);

  const topPlayerPerGame = useMemo(() => {
    const map: Record<string, { id: string; name: string; color: string; wins: number } | null> = {};
    for (const { game } of playedGames) {
      const gameSessions = filteredSessions.filter(s => s.gameId === game.id);
      const counts = getWinCounts(gameSessions);
      let topId: string | null = null;
      let topWins = 0;
      for (const [pid, wins] of Object.entries(counts)) {
        if (wins > topWins) { topId = pid; topWins = wins; }
      }
      if (topId) {
        const snap = gameSessions.find(s => s.playerSnapshots?.[topId!])?.playerSnapshots?.[topId];
        const live = players.find(p => p.id === topId);
        map[game.id] = {
          id: topId,
          name: live?.name ?? snap?.name ?? 'Unknown',
          color: live?.color ?? snap?.color ?? '#888',
          wins: topWins,
        };
      } else {
        map[game.id] = null;
      }
    }
    return map;
  }, [playedGames, filteredSessions, players]);

  const totalSessions = filteredSessions.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Stats" />

        {/* Group scope chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scopeRow}
        >
          <GroupChip
            label="All"
            color={Colors.accent}
            selected={groupId === null}
            onPress={() => setGroupId(null)}
          />
          {groups.map(g => (
            <GroupChip
              key={g.id}
              label={g.name}
              color={g.color}
              selected={groupId === g.id}
              onPress={() => setGroupId(g.id)}
            />
          ))}
          <Pressable
            onPress={() => router.push('/modals/manage-groups')}
            style={({ pressed }) => [styles.scopeAdd, pressed && { opacity: 0.6 }]}
            hitSlop={8}
          >
            <Ionicons name="add" size={16} color={Colors.textSecondary} />
            <AppText size="sm" color={Colors.textSecondary} style={{ marginLeft: 4 }}>
              {groups.length === 0 ? 'Add group' : 'Manage'}
            </AppText>
          </Pressable>
        </ScrollView>

        <AppText size="sm" color={Colors.textSecondary} style={{ marginLeft: Spacing.xs, marginBottom: Spacing.md }}>
          Pick a leaderboard to view
        </AppText>

        {/* "All games" hero card */}
        <Pressable
          onPress={() => router.push({ pathname: '/stats/[gameId]', params: { gameId: 'all', groupId: groupId ?? '' } })}
          style={({ pressed }) => [
            styles.heroCard,
            pressed && { opacity: 0.85 },
          ]}
        >
          <View style={styles.heroIcon}>
            <Ionicons name="trophy" size={28} color={Colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText size="lg" weight="heavy">All games</AppText>
            <AppText size="sm" color={Colors.textSecondary}>
              Combined leaderboard · {totalSessions} session{totalSessions === 1 ? '' : 's'}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </Pressable>

        <SectionLabel>BY GAME</SectionLabel>

        {playedGames.length === 0 ? (
          <Card style={{ marginBottom: Spacing.lg }}>
            <AppText color={Colors.textSecondary} align="center">
              No sessions yet — play a game to see leaderboards here.
            </AppText>
          </Card>
        ) : (
          <View style={styles.gameGrid}>
            {playedGames.map(({ game, count }) => {
              const top = topPlayerPerGame[game.id];
              return (
                <Pressable
                  key={game.id}
                  onPress={() => router.push({ pathname: '/stats/[gameId]', params: { gameId: game.id, groupId: groupId ?? '' } })}
                  style={({ pressed }) => [styles.gameCard, pressed && { opacity: 0.75 }]}
                >
                  <AppText style={styles.gameCardEmoji}>{game.emoji}</AppText>
                  <AppText size="md" weight="bold" numberOfLines={1} style={{ marginTop: 6 }}>{game.name}</AppText>
                  <AppText size="xs" color={Colors.textSecondary}>
                    {count} play{count === 1 ? '' : 's'}
                  </AppText>
                  {top && (
                    <View style={styles.gameCardTop}>
                      <Avatar name={top.name} color={top.color} size="sm" />
                      <View style={{ marginLeft: 6, flex: 1 }}>
                        <AppText size="xs" color={Colors.textMuted}>Top</AppText>
                        <AppText size="xs" weight="semibold" numberOfLines={1}>
                          {top.name} · {top.wins}W
                        </AppText>
                      </View>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <AppText size="xs" weight="bold" color={Colors.textMuted} style={styles.sectionLabel}>
      {children}
    </AppText>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl },
  sectionLabel: { letterSpacing: 0.8, marginTop: Spacing.md, marginBottom: Spacing.sm, marginLeft: Spacing.xs },

  scopeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: 2,
    paddingVertical: Spacing.sm,
  },
  scopeAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    minHeight: 32,
  },

  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.accent + '66',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },

  gameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  gameCard: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    minHeight: 120,
  },
  gameCardEmoji: { fontSize: 28 },
  gameCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});

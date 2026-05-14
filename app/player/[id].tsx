import React, { useMemo } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useData } from '../../src/context/DataContext';
import { AppText, Avatar, Card } from '../../src/components';
import { Colors, Spacing, Radius } from '../../src/constants/theme';
import {
  getWinCounts,
  getSessionsPerPlayer,
  getWinRate,
  getStreaks,
  getFavoriteGameId,
  getBestRivalId,
} from '../../src/utils/stats';

export default function PlayerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { players, sessions, games } = useData();
  const router = useRouter();

  const player = players.find(p => p.id === id);

  const stats = useMemo(() => {
    if (!id) return null;
    const wins = (getWinCounts(sessions)[id]) ?? 0;
    const played = (getSessionsPerPlayer(sessions)[id]) ?? 0;
    const rate = getWinRate(sessions, id);
    const streaks = getStreaks(sessions, id);
    const favoriteGameId = getFavoriteGameId(sessions, id);
    const bestRivalId = getBestRivalId(sessions, id);
    return { wins, played, rate, streaks, favoriteGameId, bestRivalId };
  }, [id, sessions]);

  const recentSessions = useMemo(
    () => sessions.filter(s => s.players.includes(id ?? '')).reverse().slice(0, 5),
    [sessions, id],
  );

  if (!player || !stats) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppText color={Colors.textSecondary} align="center" style={{ marginTop: Spacing.xl }}>
          Player not found.
        </AppText>
      </SafeAreaView>
    );
  }

  const favoriteGame = stats.favoriteGameId ? games.find(g => g.id === stats.favoriteGameId) : null;
  const bestRival = stats.bestRivalId ? players.find(p => p.id === stats.bestRivalId) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
        <Ionicons name="chevron-back" size={22} color={Colors.accent} />
        <AppText size="md" weight="semibold" color={Colors.accent}>Stats</AppText>
      </Pressable>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Avatar name={player.name} color={player.color} size="xl" />
          <AppText size="xxl" weight="heavy" align="center" style={{ marginTop: Spacing.md, color: player.color }}>
            {player.name}
          </AppText>
        </View>

        {/* Top stat cards */}
        <View style={styles.statsGrid}>
          <StatBlock label="Wins" value={String(stats.wins)} color={player.color} />
          <StatBlock label="Played" value={String(stats.played)} />
          <StatBlock label="Win Rate" value={`${Math.round(stats.rate * 100)}%`} color={stats.rate >= 0.5 ? Colors.success : undefined} />
          <StatBlock label="Streak" value={String(stats.streaks.current)} sub="current" />
          <StatBlock label="Best Streak" value={String(stats.streaks.longest)} sub="all-time" />
        </View>

        {/* Favorite game */}
        {favoriteGame && (
          <>
            <SectionLabel>FAVORITE GAME</SectionLabel>
            <Pressable
              onPress={() => router.push(`/game/${favoriteGame.id}`)}
              style={({ pressed }) => [styles.infoRow, pressed && { opacity: 0.75 }]}
            >
              <AppText style={styles.rowEmoji}>{favoriteGame.emoji}</AppText>
              <AppText size="md" weight="semibold" style={{ flex: 1 }}>{favoriteGame.name}</AppText>
              <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
            </Pressable>
          </>
        )}

        {/* Best rival */}
        {bestRival && (
          <>
            <SectionLabel>BEST RIVAL</SectionLabel>
            <Pressable
              onPress={() => router.push(`/player/${bestRival.id}`)}
              style={({ pressed }) => [styles.infoRow, pressed && { opacity: 0.75 }]}
            >
              <Avatar name={bestRival.name} color={bestRival.color} size="sm" />
              <AppText size="md" weight="semibold" style={{ flex: 1, marginLeft: Spacing.sm }}>
                {bestRival.name}
              </AppText>
              <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
            </Pressable>
          </>
        )}

        {/* Recent sessions */}
        {recentSessions.length > 0 && (
          <>
            <SectionLabel>RECENT SESSIONS</SectionLabel>
            {recentSessions.map(session => {
              const game = games.find(g => g.id === session.gameId);
              const isWinner = session.winner === player.id;
              return (
                <Pressable
                  key={session.id}
                  onPress={() => router.push(`/history/${session.id}`)}
                  style={({ pressed }) => [styles.sessionRow, pressed && { opacity: 0.75 }]}
                >
                  <AppText style={styles.rowEmoji}>{game?.emoji ?? '🎲'}</AppText>
                  <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                    <AppText size="sm" weight="semibold" numberOfLines={1}>{game?.name ?? 'Unknown'}</AppText>
                    <AppText size="xs" color={Colors.textSecondary}>
                      {format(parseISO(session.date), 'MMM d, yyyy')}
                    </AppText>
                  </View>
                  {isWinner
                    ? <AppText style={{ fontSize: 18 }}>👑</AppText>
                    : <AppText size="xs" color={Colors.textMuted}>—</AppText>
                  }
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

function StatBlock({ label, value, color, sub }: {
  label: string; value: string; color?: string; sub?: string;
}) {
  return (
    <View style={styles.statBlock}>
      <AppText size="xxl" weight="heavy" color={color ?? Colors.textPrimary} align="center">
        {value}
      </AppText>
      <AppText size="xs" color={Colors.textSecondary} align="center">{label}</AppText>
      {sub && <AppText size="xs" color={Colors.textMuted} align="center">{sub}</AppText>}
    </View>
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
  hero: { alignItems: 'center', paddingVertical: Spacing.xl },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statBlock: {
    flex: 1,
    minWidth: '28%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
  },
  sectionLabel: {
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    marginTop: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    minHeight: 52,
  },
  rowEmoji: { fontSize: 22, width: 32, textAlign: 'center' },
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
});

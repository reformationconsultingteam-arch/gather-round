import React, { useMemo } from 'react';
import { View, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useData } from '../../src/context/DataContext';
import { AppText, Avatar, ScreenHeader } from '../../src/components';
import { Colors, Spacing, Radius } from '../../src/constants/theme';
import { resolvePlayer } from '../../src/utils/players';

export default function HistoryScreen() {
  const { sessions, games, players } = useData();
  const router = useRouter();

  const sorted = useMemo(() => [...sessions].reverse(), [sessions]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="History" />

      <FlatList
        data={sorted}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState />}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        renderItem={({ item }) => {
          const game = games.find(g => g.id === item.gameId);
          const winner = resolvePlayer(item, item.winner, players);

          return (
            <Pressable
              onPress={() => router.push(`/history/${item.id}`)}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}
            >
              <AppText style={styles.emoji}>{game?.emoji ?? '🎲'}</AppText>

              <View style={styles.info}>
                <AppText size="md" weight="semibold" numberOfLines={1}>
                  {game?.name ?? 'Unknown Game'}
                </AppText>
                <AppText size="xs" color={Colors.textSecondary} style={{ marginTop: 2 }}>
                  {format(parseISO(item.date), 'MMM d, yyyy')}
                </AppText>

                {/* Player avatars */}
                <View style={styles.avatarRow}>
                  {item.players.slice(0, 5).map(pid => {
                    const p = resolvePlayer(item, pid, players);
                    return p ? (
                      <View key={pid} style={styles.avatarWrap}>
                        <Avatar name={p.name} color={p.color} size="sm" />
                      </View>
                    ) : null;
                  })}
                  {item.players.length > 5 && (
                    <AppText size="xs" color={Colors.textMuted} style={{ marginLeft: 4 }}>
                      +{item.players.length - 5}
                    </AppText>
                  )}
                </View>
              </View>

              {/* Winner badge */}
              {winner && (
                <View style={[styles.winnerBadge, { borderColor: winner.color + '66' }]}>
                  <AppText style={{ fontSize: 11 }}>👑</AppText>
                  <AppText size="xs" weight="bold" color={winner.color} numberOfLines={1} style={{ marginTop: 1 }}>
                    {winner.name}
                  </AppText>
                </View>
              )}

              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={{ marginLeft: Spacing.xs }} />
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <AppText style={{ fontSize: 48 }} align="center">📜</AppText>
      <AppText size="lg" weight="semibold" align="center" style={{ marginTop: Spacing.sm }}>
        No sessions yet
      </AppText>
      <AppText size="sm" color={Colors.textSecondary} align="center" style={{ marginTop: Spacing.xs }}>
        Completed sessions will appear here
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  list: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 72,
  },
  emoji: { fontSize: 26, width: 36, textAlign: 'center' },
  info: { flex: 1, marginLeft: Spacing.sm },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: 4,
  },
  avatarWrap: { marginRight: -6 },
  winnerBadge: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    minWidth: 56,
    maxWidth: 72,
    marginLeft: Spacing.sm,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
});

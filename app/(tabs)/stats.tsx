import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../src/context/DataContext';
import { AppText, Avatar, Card, ScreenHeader } from '../../src/components';
import { Colors, Spacing, Radius } from '../../src/constants/theme';
import {
  getWinCounts,
  getSessionsPerPlayer,
  getWinRate,
  getHeadToHead,
} from '../../src/utils/stats';
import { filterSessionsByGroup } from '../../src/utils/groups';
import { Player } from '../../src/types';

// ─── Leaderboard ──────────────────────────────────────────────────────────────

function Leaderboard({ players, sessions }: { players: Player[]; sessions: import('../../src/types').Session[] }) {
  const router = useRouter();

  const ranked = useMemo(() => {
    const winCounts = getWinCounts(sessions);
    const sessionsPerPlayer = getSessionsPerPlayer(sessions);
    return [...players]
      .map(p => ({
        player: p,
        wins: winCounts[p.id] ?? 0,
        played: sessionsPerPlayer[p.id] ?? 0,
        rate: getWinRate(sessions, p.id),
      }))
      .sort((a, b) => b.wins - a.wins || b.rate - a.rate);
  }, [players, sessions]);

  if (ranked.length === 0) {
    return (
      <Card style={{ marginBottom: Spacing.lg }}>
        <AppText color={Colors.textSecondary} align="center">Add players to see the leaderboard</AppText>
      </Card>
    );
  }

  return (
    <View style={{ marginBottom: Spacing.lg }}>
      {ranked.map((entry, index) => {
        const isLeader = index === 0 && entry.wins > 0;
        return (
          <Pressable
            key={entry.player.id}
            onPress={() => router.push(`/player/${entry.player.id}`)}
            style={({ pressed }) => [
              styles.lbRow,
              isLeader && { borderColor: entry.player.color + '88', backgroundColor: entry.player.color + '12' },
              pressed && { opacity: 0.75 },
            ]}
          >
            {/* Rank */}
            <AppText
              size="md"
              weight="heavy"
              color={isLeader ? entry.player.color : Colors.textMuted}
              style={styles.rank}
            >
              {isLeader ? '👑' : `#${index + 1}`}
            </AppText>

            <Avatar name={entry.player.name} color={entry.player.color} size="md" />

            <View style={styles.lbInfo}>
              <AppText size="md" weight="semibold">{entry.player.name}</AppText>
              <AppText size="xs" color={Colors.textSecondary}>
                {entry.played} game{entry.played !== 1 ? 's' : ''}
              </AppText>
            </View>

            <View style={styles.lbStats}>
              <AppText size="lg" weight="heavy" color={entry.wins > 0 ? entry.player.color : Colors.textMuted}>
                {entry.wins}
              </AppText>
              <AppText size="xs" color={Colors.textSecondary}>
                {Math.round(entry.rate * 100)}%
              </AppText>
            </View>

            <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} style={{ marginLeft: Spacing.xs }} />
          </Pressable>
        );
      })}

      <View style={styles.lbLegend}>
        <AppText size="xs" color={Colors.textMuted}>Tap a player for full profile  ·  # wins / win %</AppText>
      </View>
    </View>
  );
}

// ─── Head-to-head ─────────────────────────────────────────────────────────────

function HeadToHead({
  players,
  sessions,
}: {
  players: Player[];
  sessions: import('../../src/types').Session[];
}) {
  const [p1Id, setP1Id] = useState<string | null>(null);
  const [p2Id, setP2Id] = useState<string | null>(null);
  const [picking, setPicking] = useState<1 | 2 | null>(null);

  const result = useMemo(() => {
    if (!p1Id || !p2Id) return null;
    return getHeadToHead(sessions, p1Id, p2Id);
  }, [sessions, p1Id, p2Id]);

  const p1 = players.find(p => p.id === p1Id);
  const p2 = players.find(p => p.id === p2Id);

  if (players.length < 2) {
    return (
      <Card style={{ marginBottom: Spacing.lg }}>
        <AppText color={Colors.textSecondary} align="center">Need at least 2 players</AppText>
      </Card>
    );
  }

  return (
    <Card style={{ marginBottom: Spacing.lg }} padding={Spacing.md}>
      {/* Picker row */}
      <View style={styles.h2hPickers}>
        <PlayerPicker
          label="Player 1"
          player={p1 ?? null}
          active={picking === 1}
          onPress={() => setPicking(picking === 1 ? null : 1)}
        />
        <AppText size="xl" weight="heavy" color={Colors.textMuted} align="center">vs</AppText>
        <PlayerPicker
          label="Player 2"
          player={p2 ?? null}
          active={picking === 2}
          onPress={() => setPicking(picking === 2 ? null : 2)}
        />
      </View>

      {/* Player list when picking */}
      {picking !== null && (
        <View style={styles.playerPickList}>
          {players
            .filter(p => p.id !== (picking === 1 ? p2Id : p1Id))
            .map(p => (
              <Pressable
                key={p.id}
                style={({ pressed }) => [styles.pickChip, pressed && { opacity: 0.7 }]}
                onPress={() => {
                  if (picking === 1) setP1Id(p.id);
                  else setP2Id(p.id);
                  setPicking(null);
                }}
              >
                <Avatar name={p.name} color={p.color} size="sm" />
                <AppText size="sm" weight="semibold" style={{ marginLeft: Spacing.xs }}>{p.name}</AppText>
              </Pressable>
            ))}
        </View>
      )}

      {/* Result */}
      {result && p1 && p2 && (
        <View style={styles.h2hResult}>
          <View style={styles.h2hDivider} />
          {result.total === 0 ? (
            <AppText color={Colors.textSecondary} align="center" style={{ marginTop: Spacing.sm }}>
              No head-to-head sessions yet
            </AppText>
          ) : (
            <>
              <View style={styles.h2hScoreRow}>
                <View style={styles.h2hScore}>
                  <AppText size="display" weight="heavy" color={p1.color}>{result.p1Wins}</AppText>
                  <AppText size="xs" color={Colors.textSecondary} numberOfLines={1}>{p1.name}</AppText>
                </View>
                <View style={styles.h2hTotal}>
                  <AppText size="sm" color={Colors.textMuted}>{result.total} sessions</AppText>
                </View>
                <View style={styles.h2hScore}>
                  <AppText size="display" weight="heavy" color={p2.color}>{result.p2Wins}</AppText>
                  <AppText size="xs" color={Colors.textSecondary} numberOfLines={1}>{p2.name}</AppText>
                </View>
              </View>

              {/* Win bar */}
              <WinBar
                p1Name={p1.name}
                p2Name={p2.name}
                p1Wins={result.p1Wins}
                p2Wins={result.p2Wins}
                p1Color={p1.color}
                p2Color={p2.color}
                total={result.total}
              />
            </>
          )}
        </View>
      )}
    </Card>
  );
}

function PlayerPicker({ label, player, active, onPress }: {
  label: string;
  player: Player | null;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pickerBtn,
        active && { borderColor: Colors.accent },
        player && { borderColor: player.color + '88' },
      ]}
    >
      {player ? (
        <>
          <Avatar name={player.name} color={player.color} size="sm" />
          <AppText size="sm" weight="semibold" numberOfLines={1} style={{ marginTop: 4 }}>
            {player.name}
          </AppText>
        </>
      ) : (
        <>
          <Ionicons name="person-add" size={22} color={Colors.textMuted} />
          <AppText size="xs" color={Colors.textMuted} style={{ marginTop: 4 }}>{label}</AppText>
        </>
      )}
    </Pressable>
  );
}

function WinBar({ p1Name, p2Name, p1Wins, p2Wins, p1Color, p2Color, total }: {
  p1Name: string; p2Name: string;
  p1Wins: number; p2Wins: number;
  p1Color: string; p2Color: string;
  total: number;
}) {
  // Sessions where neither selected player won — i.e. a third player took it.
  const otherWins = total - p1Wins - p2Wins;
  return (
    <>
      <View style={styles.winBarWrap}>
        <View style={[styles.winBarSegment, { flex: p1Wins, backgroundColor: p1Color }]} />
        {otherWins > 0 && <View style={[styles.winBarSegment, { flex: otherWins, backgroundColor: Colors.border }]} />}
        <View style={[styles.winBarSegment, { flex: p2Wins, backgroundColor: p2Color }]} />
      </View>
      <View style={styles.winBarLegend}>
        <LegendSwatch color={p1Color} label={p1Name} />
        {otherWins > 0 && <LegendSwatch color={Colors.border} label="Other player" />}
        <LegendSwatch color={p2Color} label={p2Name} />
      </View>
    </>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <AppText size="xs" color={Colors.textSecondary} numberOfLines={1}>{label}</AppText>
    </View>
  );
}

// ─── Games section ────────────────────────────────────────────────────────────

function GamesSection({ sessions }: { sessions: import('../../src/types').Session[] }) {
  const { games } = useData();
  const router = useRouter();
  const played = games.filter(g => sessions.some(s => s.gameId === g.id));

  if (played.length === 0) return null;

  return (
    <View style={{ marginBottom: Spacing.lg }}>
      {played.map(game => {
        const count = sessions.filter(s => s.gameId === game.id).length;
        return (
          <Pressable
            key={game.id}
            onPress={() => router.push(`/game/${game.id}`)}
            style={({ pressed }) => [styles.gameRow, pressed && { opacity: 0.75 }]}
          >
            <AppText style={styles.gameEmoji}>{game.emoji}</AppText>
            <AppText size="md" weight="semibold" style={{ flex: 1 }}>{game.name}</AppText>
            <AppText size="sm" color={Colors.textSecondary}>{count}×</AppText>
            <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} style={{ marginLeft: Spacing.xs }} />
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function StatsScreen() {
  const { players, sessions, groups } = useData();
  const router = useRouter();
  const [groupId, setGroupId] = useState<string | null>(null);

  const filteredSessions = useMemo(
    () => filterSessionsByGroup(sessions, groupId, players),
    [sessions, groupId, players],
  );

  // For group views, only show players who are members of that group.
  const filteredPlayers = useMemo(() => {
    if (!groupId) return players;
    return players.filter(p => p.groupIds?.includes(groupId));
  }, [players, groupId]);

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
            style={({ pressed }) => [
              styles.scopeAdd,
              pressed && { opacity: 0.6 },
            ]}
            hitSlop={8}
          >
            <Ionicons name="add" size={16} color={Colors.textSecondary} />
            <AppText size="sm" color={Colors.textSecondary} style={{ marginLeft: 4 }}>
              {groups.length === 0 ? 'Add group' : 'Manage'}
            </AppText>
          </Pressable>
        </ScrollView>

        <SectionLabel>LEADERBOARD</SectionLabel>
        <Leaderboard players={filteredPlayers} sessions={filteredSessions} />

        <SectionLabel>HEAD TO HEAD</SectionLabel>
        <HeadToHead players={filteredPlayers} sessions={filteredSessions} />

        <SectionLabel>GAMES PLAYED</SectionLabel>
        <GamesSection sessions={filteredSessions} />
      </ScrollView>
    </SafeAreaView>
  );
}

function GroupChip({
  label,
  color,
  selected,
  onPress,
}: {
  label: string;
  color: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.scopeChip,
        selected && { backgroundColor: color, borderColor: color },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View
        style={[
          styles.scopeChipDot,
          { backgroundColor: selected ? '#fff' : color },
        ]}
      />
      <AppText
        size="sm"
        weight="semibold"
        color={selected ? '#fff' : Colors.textPrimary}
      >
        {label}
      </AppText>
    </Pressable>
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
  scroll: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl },
  sectionLabel: { letterSpacing: 0.8, marginBottom: Spacing.sm, marginLeft: Spacing.xs },

  // Group scope chips
  scopeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: 2,
    paddingVertical: Spacing.sm,
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

  // Leaderboard
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
    minHeight: 60,
  },
  rank: { width: 32, textAlign: 'center' },
  lbInfo: { flex: 1, marginLeft: Spacing.sm },
  lbStats: { alignItems: 'flex-end' },
  lbLegend: { alignItems: 'center', marginTop: Spacing.xs },

  // H2H
  h2hPickers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  pickerBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.sm,
  },
  playerPickList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  pickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  h2hResult: { marginTop: Spacing.sm },
  h2hDivider: { height: 1, backgroundColor: Colors.border },
  h2hScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  h2hScore: { flex: 1, alignItems: 'center' },
  h2hTotal: { alignItems: 'center', paddingHorizontal: Spacing.sm },
  winBarWrap: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    gap: 2,
  },
  winBarSegment: { borderRadius: 4 },
  winBarLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.sm,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: Spacing.xs,
  },

  // Games
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    minHeight: 52,
  },
  gameEmoji: { fontSize: 22, width: 32, textAlign: 'center' },
});

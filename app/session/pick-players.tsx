import React, { useState, useMemo } from 'react';
import { View, FlatList, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../src/context/DataContext';
import { useSessionFlow } from '../../src/context/SessionFlowContext';
import { AppText, Avatar, PrimaryButton, GroupChip } from '../../src/components';
import { Colors, Spacing, Radius } from '../../src/constants/theme';
import { Player } from '../../src/types';

export default function PickPlayersScreen() {
  const { players, games, groups } = useData();
  const flow = useSessionFlow();
  const router = useRouter();

  const game = useMemo(() => games.find(g => g.id === flow.gameId), [games, flow.gameId]);
  const isRook = game?.scoreType === 'rook';

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<'pick' | 'teams'>('pick');
  // Rook team assignment: playerId → 'A' | 'B' | undefined
  const [teamMap, setTeamMap] = useState<Record<string, 'A' | 'B'>>({});
  const [targetStr, setTargetStr] = useState('500');

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // Tagging the night with a group also pre-selects that group's members as a shortcut
  // (the user can still toggle individuals afterward). "No group" just clears the tag.
  function pickGroup(groupId: string | null) {
    flow.setGroupId(groupId);
    if (groupId) {
      setSelected(new Set(players.filter(p => p.groupIds?.includes(groupId)).map(p => p.id)));
    }
  }

  function cycleTeam(id: string) {
    setTeamMap(prev => {
      const cur = prev[id];
      const next = { ...prev };
      if (!cur) next[id] = 'A';
      else if (cur === 'A') next[id] = 'B';
      else delete next[id];
      return next;
    });
  }

  function handleNext() {
    if (selected.size < 2) return;
    if (isRook) {
      // Seed an even-ish default split for convenience: alternate A/B
      const seeded: Record<string, 'A' | 'B'> = {};
      [...selected].forEach((id, i) => { seeded[id] = i % 2 === 0 ? 'A' : 'B'; });
      setTeamMap(seeded);
      setPhase('teams');
      return;
    }
    flow.setPlayerIds([...selected]);
    router.push('/session/enter-scores');
  }

  function handleStartRook() {
    const selectedIds = [...selected];
    const teamA = selectedIds.filter(id => teamMap[id] === 'A');
    const teamB = selectedIds.filter(id => teamMap[id] === 'B');
    const target = parseInt(targetStr, 10);
    if (teamA.length === 0 || teamB.length === 0 || !Number.isFinite(target) || target <= 0) return;
    flow.setPlayerIds(selectedIds);
    flow.setRookTeams(teamA, teamB);
    flow.setRookTargetScore(target);
    router.push('/session/enter-scores');
  }

  const canProceed = selected.size >= 2;
  const needsMorePlayers = players.length < 2;

  // ── Rook team-assignment phase ──────────────────────────────────────────────
  if (phase === 'teams') {
    const selectedIds = [...selected];
    const teamA = selectedIds.filter(id => teamMap[id] === 'A');
    const teamB = selectedIds.filter(id => teamMap[id] === 'B');
    const unassigned = selectedIds.filter(id => !teamMap[id]);
    const target = parseInt(targetStr, 10);
    const targetOk = Number.isFinite(target) && target > 0;
    const canStart = teamA.length > 0 && teamB.length > 0 && unassigned.length === 0 && targetOk;
    const nameById = Object.fromEntries(players.map(p => [p.id, p]));

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
          <AppText size="sm" color={Colors.textSecondary} style={styles.hint}>
            Tap each player to cycle: Team A → Team B → Unassigned
          </AppText>

          {selectedIds.map(id => {
            const p = nameById[id];
            if (!p) return null;
            const team = teamMap[id];
            const color = team === 'A' ? '#3B82F6' : team === 'B' ? '#EF4444' : Colors.surfaceAlt;
            return (
              <Pressable
                key={id}
                onPress={() => cycleTeam(id)}
                style={({ pressed }) => [
                  rookSetupStyles.row,
                  team && { borderColor: color, backgroundColor: color + '14' },
                  pressed && { opacity: 0.75 },
                ]}
              >
                <Avatar name={p.name} color={p.color} size="md" />
                <AppText size="lg" weight="semibold" style={{ flex: 1, marginLeft: Spacing.md }}>
                  {p.name}
                </AppText>
                <View style={[rookSetupStyles.teamBadge, { backgroundColor: team ? color : Colors.surfaceAlt }]}>
                  <AppText size="sm" weight="bold" color={team ? '#fff' : Colors.textMuted}>
                    {team ? `Team ${team}` : 'Tap'}
                  </AppText>
                </View>
              </Pressable>
            );
          })}

          <View style={rookSetupStyles.targetRow}>
            <AppText size="md" weight="semibold" style={{ flex: 1 }}>Target score</AppText>
            <TextInput
              style={rookSetupStyles.targetInput}
              value={targetStr}
              onChangeText={setTargetStr}
              keyboardType="number-pad"
              placeholder="500"
              placeholderTextColor={Colors.textMuted}
              selectTextOnFocus
            />
          </View>

          <AppText size="sm" color={Colors.textMuted} align="center" style={{ marginTop: Spacing.md }}>
            Team A: {teamA.length}  ·  Team B: {teamB.length}
            {unassigned.length > 0 && `  ·  ${unassigned.length} unassigned`}
          </AppText>
        </ScrollView>
        <View style={styles.footer}>
          <Pressable onPress={() => setPhase('pick')} style={{ paddingVertical: Spacing.sm }}>
            <AppText size="sm" color={Colors.textSecondary} align="center">← Back to player select</AppText>
          </Pressable>
          <PrimaryButton label="Start Rook →" onPress={handleStartRook} disabled={!canStart} />
        </View>
      </View>
    );
  }

  // ── Standard player selection ───────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {players.length === 0 ? (
        <EmptyState onAdd={() => router.push('/modals/add-player')} />
      ) : (
        <FlatList
          data={players}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          ListHeaderComponent={
            <View>
              {groups.length > 0 && (
                <View style={styles.groupSection}>
                  <AppText size="xs" weight="bold" color={Colors.textMuted} style={styles.groupLabel}>
                    GROUP (OPTIONAL)
                  </AppText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupRow}>
                    <GroupChip label="No group" color={Colors.textMuted} selected={flow.groupId === null} onPress={() => pickGroup(null)} />
                    {groups.map(g => (
                      <GroupChip key={g.id} label={g.name} color={g.color} selected={flow.groupId === g.id} onPress={() => pickGroup(g.id)} />
                    ))}
                  </ScrollView>
                </View>
              )}
              <AppText size="sm" color={Colors.textSecondary} style={styles.hint}>
                {isRook ? 'Select players (you\'ll split them into teams next)' : 'Select at least 2 players'}
              </AppText>
              {needsMorePlayers && (
                <AppText size="sm" color={Colors.warning} style={styles.hint}>
                  Need at least 2 players — add another to continue.
                </AppText>
              )}
            </View>
          }
          ListFooterComponent={
            <Pressable
              onPress={() => router.push('/modals/add-player')}
              style={({ pressed }) => [styles.addRow, pressed && { opacity: 0.75 }]}
            >
              <Ionicons name="add-circle-outline" size={22} color={Colors.accent} />
              <AppText size="sm" weight="semibold" color={Colors.accent} style={{ marginLeft: Spacing.sm }}>
                Add new player
              </AppText>
            </Pressable>
          }
          renderItem={({ item }) => (
            <PlayerCard
              player={item}
              selected={selected.has(item.id)}
              onPress={() => toggle(item.id)}
            />
          )}
        />
      )}

      <View style={styles.footer}>
        {canProceed && (
          <AppText size="sm" color={Colors.textSecondary} align="center" style={{ marginBottom: Spacing.sm }}>
            {selected.size} player{selected.size !== 1 ? 's' : ''} selected
          </AppText>
        )}
        <PrimaryButton
          label={isRook ? 'Form teams →' : 'Next →'}
          onPress={handleNext}
          disabled={!canProceed}
        />
      </View>
    </View>
  );
}

function PlayerCard({ player, selected, onPress }: {
  player: Player;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        { borderColor: selected ? player.color : Colors.border },
        pressed && { opacity: 0.75 },
      ]}
    >
      {selected && (
        <View style={[styles.check, { backgroundColor: player.color }]}>
          <Ionicons name="checkmark" size={14} color="#fff" />
        </View>
      )}
      <Avatar name={player.name} color={player.color} size="lg" />
      <AppText
        size="sm"
        weight="semibold"
        align="center"
        style={{ marginTop: Spacing.sm }}
        numberOfLines={1}
      >
        {player.name}
      </AppText>
    </Pressable>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.empty}>
      <AppText size="xxl" align="center">👥</AppText>
      <AppText size="lg" weight="semibold" align="center" style={{ marginTop: Spacing.sm }}>
        No players yet
      </AppText>
      <AppText size="md" color={Colors.textSecondary} align="center" style={{ marginTop: Spacing.xs, marginBottom: Spacing.lg }}>
        Add at least two players to start a session
      </AppText>
      <PrimaryButton label="Add Player" onPress={onAdd} fullWidth={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  grid: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 120,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  hint: {
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  groupSection: {
    marginBottom: Spacing.md,
  },
  groupLabel: {
    letterSpacing: 0.8,
    marginLeft: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: 2,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border,
  },
  card: {
    flex: 0.48,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 2,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  cardSelected: {
    backgroundColor: Colors.surfaceAlt,
  },
  check: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
});

const rookSetupStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    minHeight: 64,
  },
  teamBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    minWidth: 86,
    alignItems: 'center',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  targetInput: {
    width: 100,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
  },
});

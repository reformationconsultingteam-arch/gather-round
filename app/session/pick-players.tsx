import React, { useState } from 'react';
import { View, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../src/context/DataContext';
import { useSessionFlow } from '../../src/context/SessionFlowContext';
import { AppText, Avatar, PrimaryButton, GhostButton } from '../../src/components';
import { Colors, Spacing, Radius } from '../../src/constants/theme';
import { Player } from '../../src/types';

export default function PickPlayersScreen() {
  const { players } = useData();
  const { setPlayerIds } = useSessionFlow();
  const router = useRouter();

  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleNext() {
    if (selected.size < 2) return;
    setPlayerIds([...selected]);
    router.push('/session/enter-scores');
  }

  const canProceed = selected.size >= 2;
  const needsMorePlayers = players.length < 2;

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
              <AppText size="sm" color={Colors.textSecondary} style={styles.hint}>
                Select at least 2 players
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
          label="Next →"
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

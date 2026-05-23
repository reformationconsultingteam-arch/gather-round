import React, { useCallback, useState } from 'react';
import {
  FlatList,
  View,
  Pressable,
  Modal,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../src/context/DataContext';
import {
  AppText,
  Avatar,
  PrimaryButton,
  GhostButton,
  ActionSheet,
  PromptDialog,
  ActionSheetAction,
} from '../../src/components';
import { Colors, Spacing, Radius } from '../../src/constants/theme';
import { Player } from '../../src/types';

export default function PlayersScreen() {
  const { players, groups, renamePlayer, deletePlayer, setPlayerGroups } = useData();
  const router = useRouter();

  // Three independent overlay states so the ActionSheet can dismiss before
  // the follow-up Rename / Edit-groups dialog opens.
  const [actionsFor, setActionsFor] = useState<Player | null>(null);
  const [renamingPlayer, setRenamingPlayer] = useState<Player | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editSelection, setEditSelection] = useState<Set<string>>(new Set());

  const openOptions = useCallback((player: Player) => {
    setActionsFor(player);
  }, []);

  const openEditGroups = useCallback((player: Player) => {
    setEditingPlayer(player);
    setEditSelection(new Set(player.groupIds ?? []));
  }, []);

  const actionsForPlayer = (player: Player): ActionSheetAction[] => [
    {
      label: 'Rename',
      onPress: () => setRenamingPlayer(player),
    },
    {
      label: 'Edit groups',
      onPress: () => openEditGroups(player),
    },
    {
      label: 'Delete',
      destructive: true,
      onPress: () => deletePlayer(player.id),
      confirmation: {
        title: `Delete ${player.name}?`,
        message: 'Their game history will be preserved.',
        confirmLabel: 'Delete',
      },
    },
  ];

  function saveEditGroups() {
    if (!editingPlayer) return;
    setPlayerGroups(editingPlayer.id, Array.from(editSelection));
    setEditingPlayer(null);
  }

  function toggleEditGroup(id: string) {
    setEditSelection(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <AppText size="xxl" weight="heavy">Players</AppText>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push('/modals/manage-groups')}
            style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
            hitSlop={8}
          >
            <Ionicons name="pricetags-outline" size={22} color={Colors.accent} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/modals/add-player')}
            style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
            hitSlop={8}
          >
            <Ionicons name="add" size={28} color={Colors.accent} />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          const memberOf = (item.groupIds ?? [])
            .map(gid => groups.find(g => g.id === gid))
            .filter((g): g is NonNullable<typeof g> => !!g);
          const visible = memberOf.slice(0, 3);
          const overflow = memberOf.length - visible.length;
          return (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
              onPress={() => router.push(`/player/${item.id}`)}
              onLongPress={() => openOptions(item)}
              delayLongPress={300}
            >
              <Avatar name={item.name} color={item.color} size="md" />
              <View style={styles.rowText}>
                <AppText size="lg" weight="semibold">{item.name}</AppText>
                <View style={styles.subRow}>
                  {memberOf.length > 0 ? (
                    <>
                      {visible.map(g => (
                        <View key={g.id} style={styles.groupChip}>
                          <View style={[styles.groupDot, { backgroundColor: g.color }]} />
                          <AppText size="xs" color={Colors.textSecondary} numberOfLines={1}>
                            {g.name}
                          </AppText>
                        </View>
                      ))}
                      {overflow > 0 && (
                        <AppText size="xs" color={Colors.textMuted}>+{overflow}</AppText>
                      )}
                    </>
                  ) : (
                    <AppText size="xs" color={Colors.textMuted}>Tap ⋯ for options</AppText>
                  )}
                </View>
              </View>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  openOptions(item);
                }}
                hitSlop={12}
                style={({ pressed }) => [styles.moreBtn, pressed && { opacity: 0.6 }]}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textSecondary} />
              </Pressable>
            </Pressable>
          );
        }}
      />

      {/* Per-row options (Rename / Edit groups / Delete) */}
      <ActionSheet
        visible={!!actionsFor}
        title={actionsFor?.name}
        actions={actionsFor ? actionsForPlayer(actionsFor) : []}
        onClose={() => setActionsFor(null)}
      />

      {/* Rename prompt */}
      <PromptDialog
        visible={!!renamingPlayer}
        title="Rename Player"
        initialValue={renamingPlayer?.name ?? ''}
        placeholder="Player name"
        onSubmit={(name) => {
          if (renamingPlayer) renamePlayer(renamingPlayer.id, name);
          setRenamingPlayer(null);
        }}
        onClose={() => setRenamingPlayer(null)}
      />

      {/* Edit-groups modal — re-uses the same chip UI as add-player */}
      <Modal
        visible={!!editingPlayer}
        animationType="fade"
        transparent
        onRequestClose={() => setEditingPlayer(null)}
      >
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.card}>
            <AppText size="lg" weight="bold" style={{ marginBottom: Spacing.xs }}>
              Edit groups
            </AppText>
            <AppText size="sm" color={Colors.textSecondary} style={{ marginBottom: Spacing.md }}>
              {editingPlayer?.name}
            </AppText>

            {groups.length === 0 ? (
              <AppText size="sm" color={Colors.textMuted}>
                No groups yet — add some via the tag icon at the top of the Players tab.
              </AppText>
            ) : (
              <View style={modalStyles.chipsRow}>
                {groups.map(group => {
                  const selected = editSelection.has(group.id);
                  return (
                    <Pressable
                      key={group.id}
                      onPress={() => toggleEditGroup(group.id)}
                      style={({ pressed }) => [
                        modalStyles.chip,
                        selected && { backgroundColor: group.color, borderColor: group.color },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <View
                        style={[
                          modalStyles.chipDot,
                          { backgroundColor: selected ? '#fff' : group.color },
                        ]}
                      />
                      <AppText
                        size="sm"
                        weight="semibold"
                        color={selected ? '#fff' : Colors.textPrimary}
                      >
                        {group.name}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <PrimaryButton label="Save" onPress={saveEditGroups} />
            <GhostButton
              label="Cancel"
              onPress={() => setEditingPlayer(null)}
              style={{ marginTop: Spacing.sm }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <AppText size="xxl" align="center" style={{ marginBottom: Spacing.sm }}>👥</AppText>
      <AppText size="lg" weight="semibold" align="center">No players yet</AppText>
      <AppText size="md" color={Colors.textSecondary} align="center" style={{ marginTop: Spacing.xs }}>
        Tap + to add your first player
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  list: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    minHeight: 64,
  },
  rowText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  subRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groupDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  moreBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  separator: {
    height: Spacing.sm,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerBtn: {
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minHeight: 36,
  },
  chipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.xs,
  },
});

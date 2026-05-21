import React, { useState } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../src/context/DataContext';
import { AppText, PrimaryButton, GhostButton, Card } from '../../src/components';
import { Colors, Spacing, Radius } from '../../src/constants/theme';
import { PLAYER_COLORS } from '../../src/data/colors';
import { Group } from '../../src/types';

export default function ManageGroupsModal() {
  const { groups, addGroup, renameGroup, recolorGroup, deleteGroup, players } = useData();
  const router = useRouter();

  const [newName, setNewName] = useState('');

  const newTrimmed = newName.trim();
  const newValid = newTrimmed.length > 0;

  function handleAdd() {
    if (!newValid) return;
    addGroup(newTrimmed);
    setNewName('');
  }

  function handleLongPress(group: Group) {
    Alert.alert(group.name, undefined, [
      {
        text: 'Rename',
        onPress: () => {
          Alert.prompt(
            'Rename Group',
            undefined,
            (next) => {
              if (next && next.trim()) renameGroup(group.id, next.trim());
            },
            'plain-text',
            group.name,
          );
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const count = players.filter(p => p.groupIds?.includes(group.id)).length;
          Alert.alert(
            `Delete "${group.name}"?`,
            count > 0
              ? `${count} player${count === 1 ? '' : 's'} will be removed from this group. Their sessions remain intact.`
              : 'No players are in this group.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => deleteGroup(group.id),
              },
            ],
          );
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function cycleColor(group: Group) {
    const i = PLAYER_COLORS.indexOf(group.color);
    const next = PLAYER_COLORS[(i + 1) % PLAYER_COLORS.length];
    recolorGroup(group.id, next);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.handle} />

        <Pressable style={styles.closeBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={24} color={Colors.textSecondary} />
        </Pressable>

        <AppText size="xxl" weight="heavy" style={styles.title}>Groups</AppText>
        <AppText size="sm" color={Colors.textSecondary} style={{ marginBottom: Spacing.lg }}>
          Tag players into groups (e.g. Family, Friends) to scope leaderboards.
          A player can belong to multiple groups.
        </AppText>

        {/* Existing groups */}
        {groups.length === 0 ? (
          <Card style={{ marginBottom: Spacing.lg }} padding={Spacing.lg}>
            <AppText color={Colors.textSecondary} align="center">
              No groups yet — add your first one below.
            </AppText>
          </Card>
        ) : (
          groups.map(group => {
            const count = players.filter(p => p.groupIds?.includes(group.id)).length;
            return (
              <Pressable
                key={group.id}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
                onLongPress={() => handleLongPress(group)}
                delayLongPress={300}
              >
                <Pressable
                  style={[styles.swatch, { backgroundColor: group.color }]}
                  onPress={() => cycleColor(group)}
                  hitSlop={8}
                />
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <AppText size="md" weight="semibold">{group.name}</AppText>
                  <AppText size="xs" color={Colors.textMuted} style={{ marginTop: 2 }}>
                    {count} player{count === 1 ? '' : 's'}  ·  Long-press for options
                  </AppText>
                </View>
              </Pressable>
            );
          })
        )}

        {/* Add new */}
        <AppText size="sm" weight="semibold" color={Colors.textSecondary} style={styles.label}>
          NEW GROUP
        </AppText>
        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            placeholder="e.g. Family"
            placeholderTextColor={Colors.textMuted}
            value={newName}
            onChangeText={setNewName}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
            maxLength={30}
          />
        </View>
        <PrimaryButton label="Add Group" onPress={handleAdd} disabled={!newValid} />
        <GhostButton label="Done" onPress={() => router.back()} style={{ marginTop: Spacing.sm }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginBottom: Spacing.xs,
  },
  label: {
    letterSpacing: 0.8,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
    minHeight: 64,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  addRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 17,
    color: Colors.textPrimary,
  },
});

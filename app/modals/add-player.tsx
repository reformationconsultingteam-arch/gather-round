import React, { useState } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../src/context/DataContext';
import { colorForIndex } from '../../src/data/colors';
import { AppText, Avatar, PrimaryButton, GhostButton } from '../../src/components';
import { Colors, Spacing, Radius } from '../../src/constants/theme';

export default function AddPlayerModal() {
  const { players, addPlayer, groups } = useData();
  const router = useRouter();
  const [name, setName] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

  const previewColor = colorForIndex(players.length);
  const trimmed = name.trim();
  const isValid = trimmed.length > 0;

  function handleSave() {
    if (!isValid) return;
    addPlayer(trimmed, Array.from(selectedGroups));
    router.back();
  }

  function toggleGroup(id: string) {
    setSelectedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
        {/* Handle bar */}
        <View style={styles.handle} />

        {/* Close button */}
        <Pressable
          style={styles.closeBtn}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Ionicons name="close" size={24} color={Colors.textSecondary} />
        </Pressable>

        <AppText size="xxl" weight="heavy" style={styles.title}>
          New Player
        </AppText>

        {/* Avatar preview */}
        <View style={styles.preview}>
          <Avatar
            name={trimmed || '?'}
            color={previewColor}
            size="xl"
          />
          <AppText size="sm" color={Colors.textSecondary} style={{ marginTop: Spacing.sm }}>
            Auto-assigned color
          </AppText>
        </View>

        {/* Name input */}
        <TextInput
          style={styles.input}
          placeholder="Player name"
          placeholderTextColor={Colors.textMuted}
          value={name}
          onChangeText={setName}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSave}
          maxLength={30}
        />

        {/* Groups multi-select */}
        <AppText size="sm" weight="semibold" color={Colors.textSecondary} style={styles.label}>
          GROUPS
        </AppText>
        {groups.length === 0 ? (
          <AppText size="sm" color={Colors.textMuted} style={{ marginBottom: Spacing.md }}>
            No groups yet — manage from the Players tab.
          </AppText>
        ) : (
          <View style={styles.chipsRow}>
            {groups.map(group => {
              const selected = selectedGroups.has(group.id);
              return (
                <Pressable
                  key={group.id}
                  onPress={() => toggleGroup(group.id)}
                  style={({ pressed }) => [
                    styles.chip,
                    selected && { backgroundColor: group.color, borderColor: group.color },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <View
                    style={[
                      styles.chipDot,
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

        <View style={styles.actions}>
          <PrimaryButton label="Add Player" onPress={handleSave} disabled={!isValid} />
          <GhostButton label="Cancel" onPress={() => router.back()} style={{ marginTop: Spacing.sm }} />
        </View>
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
    flexGrow: 1,
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
    marginBottom: Spacing.xl,
  },
  preview: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 17,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  label: {
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
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
  actions: {
    marginTop: 'auto',
  },
});

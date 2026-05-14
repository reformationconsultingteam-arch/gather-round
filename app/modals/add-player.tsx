import React, { useState } from 'react';
import {
  View,
  TextInput,
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
  const { players, addPlayer } = useData();
  const router = useRouter();
  const [name, setName] = useState('');

  const previewColor = colorForIndex(players.length);
  const trimmed = name.trim();
  const isValid = trimmed.length > 0;

  function handleSave() {
    if (!isValid) return;
    addPlayer(trimmed);
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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

      <View style={styles.actions}>
        <PrimaryButton label="Add Player" onPress={handleSave} disabled={!isValid} />
        <GhostButton label="Cancel" onPress={() => router.back()} style={{ marginTop: Spacing.sm }} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
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
    marginBottom: Spacing.xl,
  },
  actions: {
    marginTop: 'auto',
  },
});

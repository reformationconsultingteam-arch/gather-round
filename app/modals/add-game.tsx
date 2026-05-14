import React, { useState } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../src/context/DataContext';
import { AppText, PrimaryButton, GhostButton } from '../../src/components';
import { Colors, Spacing, Radius } from '../../src/constants/theme';
import { ScoreType } from '../../src/types';

const QUICK_EMOJIS = [
  '🎲','🃏','♟️','🎯','🎳','🧩','🎮','🏆',
  '🎴','🀄','🎰','🎪','🌟','🔥','💎','🎭',
];

const SCORE_TYPES: { value: ScoreType; label: string; sub: string }[] = [
  { value: 'highest', label: 'Highest wins',  sub: 'Most points wins' },
  { value: 'lowest',  label: 'Lowest wins',   sub: 'Fewest points wins' },
  { value: 'winner',  label: 'Pick a winner', sub: 'No scoring, just crown someone' },
];

export default function AddGameModal() {
  const { addCustomGame } = useData();
  const router = useRouter();

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎲');
  const [emojiInput, setEmojiInput] = useState('🎲');
  const [scoreType, setScoreType] = useState<ScoreType>('highest');

  const isValid = name.trim().length > 0;

  function handleEmojiInputChange(val: string) {
    setEmojiInput(val);
    // Take the last character if the user typed/pasted something
    const chars = [...val]; // spread handles multi-byte emoji correctly
    if (chars.length > 0) {
      setEmoji(chars[chars.length - 1]);
    }
  }

  function handleSave() {
    if (!isValid) return;
    addCustomGame({
      name: name.trim(),
      emoji,
      category: 'Custom',
      scoreType,
    });
    router.back();
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
        {/* Handle */}
        <View style={styles.handle} />

        {/* Close */}
        <Pressable style={styles.closeBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={24} color={Colors.textSecondary} />
        </Pressable>

        <AppText size="xxl" weight="heavy" style={styles.title}>New Game</AppText>

        {/* Emoji preview */}
        <View style={styles.emojiPreview}>
          <AppText style={styles.emojiLarge}>{emoji}</AppText>
        </View>

        {/* Emoji quick-picks */}
        <AppText size="sm" weight="semibold" color={Colors.textSecondary} style={styles.label}>
          EMOJI
        </AppText>
        <View style={styles.quickEmojis}>
          {QUICK_EMOJIS.map((e) => (
            <Pressable
              key={e}
              style={[styles.emojiChip, emoji === e && styles.emojiChipSelected]}
              onPress={() => { setEmoji(e); setEmojiInput(e); }}
            >
              <AppText style={{ fontSize: 22 }}>{e}</AppText>
            </Pressable>
          ))}
        </View>
        <TextInput
          style={styles.input}
          value={emojiInput}
          onChangeText={handleEmojiInputChange}
          placeholder="Or type any emoji…"
          placeholderTextColor={Colors.textMuted}
          maxLength={8}
        />

        {/* Game name */}
        <AppText size="sm" weight="semibold" color={Colors.textSecondary} style={styles.label}>
          GAME NAME
        </AppText>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Sushi Go, Coup…"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="words"
          returnKeyType="done"
          maxLength={40}
        />

        {/* Score type */}
        <AppText size="sm" weight="semibold" color={Colors.textSecondary} style={styles.label}>
          SCORING
        </AppText>
        {SCORE_TYPES.map((st) => (
          <Pressable
            key={st.value}
            style={[styles.scoreRow, scoreType === st.value && styles.scoreRowSelected]}
            onPress={() => setScoreType(st.value)}
          >
            <View style={[styles.radio, scoreType === st.value && styles.radioSelected]}>
              {scoreType === st.value && <View style={styles.radioDot} />}
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <AppText size="md" weight="semibold">{st.label}</AppText>
              <AppText size="sm" color={Colors.textSecondary}>{st.sub}</AppText>
            </View>
          </Pressable>
        ))}

        {/* Actions */}
        <View style={styles.actions}>
          <PrimaryButton label="Add Game" onPress={handleSave} disabled={!isValid} />
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
    right: 0,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginBottom: Spacing.lg,
  },
  emojiPreview: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emojiLarge: {
    fontSize: 64,
  },
  label: {
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  quickEmojis: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  emojiChip: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  emojiChipSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '22',
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
    marginBottom: Spacing.xs,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    minHeight: 56,
  },
  scoreRowSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '15',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.accent,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
  },
  actions: {
    marginTop: Spacing.xl,
  },
});

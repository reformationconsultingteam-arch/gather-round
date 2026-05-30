import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { Colors, Radius, Spacing } from '../constants/theme';

/**
 * Pill-shaped group selector chip with a colored dot. Used wherever the user picks or filters by a
 * group (stats scope filters, the session-creation group picker, etc.).
 */
export function GroupChip({ label, color, selected, onPress }: {
  label: string;
  color: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && { backgroundColor: color, borderColor: color },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: selected ? '#fff' : color }]} />
      <AppText size="sm" weight="semibold" color={selected ? '#fff' : Colors.textPrimary}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
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
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
});

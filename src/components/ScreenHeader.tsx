import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { Colors, Spacing } from '../constants/theme';

interface ScreenHeaderProps {
  title: string;
  rightLabel?: string;
  onRightPress?: () => void;
  rightIcon?: React.ReactNode;
}

export function ScreenHeader({
  title,
  rightLabel,
  onRightPress,
  rightIcon,
}: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <AppText size="xxl" weight="heavy">
        {title}
      </AppText>
      {(rightLabel || rightIcon) && onRightPress && (
        <Pressable
          onPress={onRightPress}
          style={({ pressed }) => [styles.rightAction, pressed && { opacity: 0.6 }]}
          hitSlop={12}
        >
          {rightIcon ?? (
            <AppText size="md" weight="semibold" color={Colors.accent}>
              {rightLabel}
            </AppText>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  rightAction: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});

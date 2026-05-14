import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<AvatarSize, number> = {
  sm: 32,
  md: 44,
  lg: 56,
  xl: 80,
};

const FONT_SIZE_MAP: Record<AvatarSize, number> = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
};

interface AvatarProps {
  name: string;
  color: string;
  size?: AvatarSize;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, color, size = 'md' }: AvatarProps) {
  const diameter = SIZE_MAP[size];
  const fontSize = FONT_SIZE_MAP[size];

  return (
    <View
      style={[
        styles.circle,
        {
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          backgroundColor: color + '33', // 20% opacity fill
          borderColor: color,
        },
      ]}
    >
      <AppText
        style={{ fontSize, fontWeight: '700', color }}
      >
        {getInitials(name)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

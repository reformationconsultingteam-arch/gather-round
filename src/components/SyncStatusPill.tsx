import React from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppText } from './AppText';
import { useSync } from '../context/SyncContext';
import { Colors, Spacing, Radius } from '../constants/theme';

export function SyncStatusPill() {
  const sync = useSync();
  const router = useRouter();

  if (!sync.isConnected) return null;

  const { status } = sync;

  let dotColor: string = Colors.success;
  let label = 'Synced';
  let icon: React.ReactNode = null;

  if (status === 'syncing') {
    label = 'Syncing';
    icon = <ActivityIndicator size="small" color={Colors.accent} style={styles.spinner} />;
  } else if (status === 'error') {
    dotColor = Colors.danger;
    label = 'Sync error';
    icon = <Ionicons name="alert-circle" size={12} color={Colors.danger} style={styles.iconLeft} />;
  } else if (status === 'offline') {
    dotColor = Colors.textMuted;
    label = 'Offline';
  } else if (status === 'idle') {
    dotColor = Colors.textMuted;
    label = 'Idle';
  }

  return (
    <Pressable
      onPress={() => router.push('/settings')}
      style={({ pressed }) => [styles.pill, pressed && { opacity: 0.7 }]}
      hitSlop={8}
    >
      {icon ?? <View style={[styles.dot, { backgroundColor: dotColor }]} />}
      <AppText size="xs" weight="semibold" color={Colors.textSecondary} style={{ marginLeft: 6 }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  spinner: {
    width: 12,
    height: 12,
  },
  iconLeft: {
    marginRight: 0,
  },
});

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useSync } from '../src/context/SyncContext';
import { AppText, PrimaryButton, GhostButton } from '../src/components';
import { Colors, Spacing, Radius } from '../src/constants/theme';

export default function SettingsScreen() {
  const sync = useSync();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await sync.refresh();
    setRefreshing(false);
  }

  async function handleDisconnect() {
    await sync.disconnect();
    router.replace('/setup');
  }

  const lastSyncedLabel = sync.lastSyncedAt
    ? formatDistanceToNow(sync.lastSyncedAt, { addSuffix: true })
    : 'Never';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Settings', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText size="sm" weight="bold" color={Colors.textMuted} style={styles.sectionLabel}>
          GITHUB SYNC
        </AppText>

        {sync.isConnected ? (
          <>
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.iconBubble}>
                  <Ionicons name="logo-github" size={20} color={Colors.textPrimary} />
                </View>
                <View style={styles.rowBody}>
                  <AppText size="md" weight="semibold">Connected</AppText>
                  <AppText size="sm" color={Colors.textSecondary} numberOfLines={1}>
                    {sync.owner}/{sync.repo}
                  </AppText>
                </View>
                <StatusBadge status={sync.status} />
              </View>

              <View style={styles.divider} />

              <View style={styles.kvRow}>
                <AppText size="sm" color={Colors.textSecondary}>Last synced</AppText>
                <AppText size="sm" weight="semibold">{lastSyncedLabel}</AppText>
              </View>

              {sync.error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color={Colors.danger} />
                  <AppText size="sm" color={Colors.danger} style={{ flex: 1, marginLeft: Spacing.sm, lineHeight: 18 }}>
                    {sync.error}
                  </AppText>
                </View>
              )}
            </View>

            <Pressable
              onPress={handleRefresh}
              disabled={refreshing}
              style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.7 }]}
            >
              {refreshing ? (
                <ActivityIndicator color={Colors.accent} />
              ) : (
                <Ionicons name="refresh" size={20} color={Colors.accent} />
              )}
              <AppText size="md" weight="semibold" color={Colors.accent} style={{ marginLeft: Spacing.sm }}>
                {refreshing ? 'Refreshing…' : 'Refresh from GitHub'}
              </AppText>
            </Pressable>

            <AppText size="xs" color={Colors.textMuted} style={styles.helpText}>
              Pulls the latest data.json from your repo and replaces what's on this device.
            </AppText>

            {confirmingDisconnect ? (
              <View style={styles.confirmCard}>
                <AppText size="md" weight="semibold" align="center">Disconnect this device?</AppText>
                <AppText size="sm" color={Colors.textSecondary} align="center" style={{ marginTop: Spacing.sm, lineHeight: 18 }}>
                  Your token will be removed from this device. The data in GitHub stays put — you can re-connect any time. New changes you make here won't sync until you re-connect.
                </AppText>
                <View style={{ marginTop: Spacing.lg }}>
                  <PrimaryButton label="Yes, disconnect" onPress={handleDisconnect} />
                  <GhostButton label="Cancel" onPress={() => setConfirmingDisconnect(false)} style={{ marginTop: Spacing.sm }} />
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => setConfirmingDisconnect(true)}
                style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
                <AppText size="md" weight="semibold" color={Colors.danger} style={{ marginLeft: Spacing.sm }}>
                  Disconnect this device
                </AppText>
              </Pressable>
            )}
          </>
        ) : (
          <View style={styles.card}>
            <AppText size="md" weight="semibold">Not connected</AppText>
            <AppText size="sm" color={Colors.textSecondary} style={{ marginTop: Spacing.sm, lineHeight: 18 }}>
              Your data is only saved on this device. If anything happens to it, the data is gone. Connect to GitHub to keep a cloud backup.
            </AppText>
            <View style={{ marginTop: Spacing.md }}>
              <PrimaryButton label="Connect to GitHub" onPress={() => router.push('/setup')} />
            </View>
          </View>
        )}

        <View style={{ height: Spacing.xl }} />

        <AppText size="xs" color={Colors.textMuted} align="center">
          Gather Round · local-first PWA
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusBadge({ status }: { status: 'idle' | 'syncing' | 'synced' | 'error' | 'offline' }) {
  let color: string = Colors.success;
  let label = 'Synced';
  if (status === 'syncing') { color = Colors.accent; label = 'Syncing'; }
  else if (status === 'error') { color = Colors.danger; label = 'Error'; }
  else if (status === 'idle') { color = Colors.textMuted; label = 'Idle'; }
  else if (status === 'offline') { color = Colors.textMuted; label = 'Offline'; }

  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <AppText size="xs" weight="semibold" color={color}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  sectionLabel: {
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  helpText: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    lineHeight: 16,
  },
  confirmCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.danger,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
});

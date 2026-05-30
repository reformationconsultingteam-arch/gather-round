import React, { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { Colors, Spacing, Radius } from '../constants/theme';

/**
 * Floating "a new version is available" banner. The service-worker registration script (injected
 * in scripts/inject-pwa-head.js) dispatches a `swUpdateReady` window event and stashes the waiting
 * worker on `window.__swWaiting` when an update is installed. Tapping Reload tells that worker to
 * activate, which triggers `controllerchange` → the page reloads into the fresh assets.
 *
 * Web-only: on native (or when there's no service worker, e.g. dev) the event never fires and this
 * renders nothing.
 */
export function UpdateBanner() {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onReady = () => setVisible(true);
    window.addEventListener('swUpdateReady', onReady);
    return () => window.removeEventListener('swUpdateReady', onReady);
  }, []);

  if (!visible) return null;

  function reload() {
    const w = window as any;
    if (w.__swWaiting) {
      w.__swWaiting.postMessage({ type: 'SKIP_WAITING' });
      // Fallback in case controllerchange doesn't fire (e.g. worker already active).
      setTimeout(() => window.location.reload(), 1500);
    } else {
      window.location.reload();
    }
  }

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom + Spacing.md }]} pointerEvents="box-none">
      <View style={styles.banner}>
        <Ionicons name="sparkles" size={18} color={Colors.accent} />
        <View style={styles.text}>
          <AppText size="sm" weight="semibold">A new version is available</AppText>
          <AppText size="xs" color={Colors.textSecondary}>Reload to get the latest Gather Round.</AppText>
        </View>
        <Pressable
          onPress={reload}
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}
          hitSlop={8}
        >
          <AppText size="sm" weight="bold" color={Colors.bg}>Reload</AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    zIndex: 9999,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    maxWidth: 460,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  text: {
    flex: 1,
  },
  button: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
});

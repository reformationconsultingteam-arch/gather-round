import React, { useState } from 'react';
import { Modal, View, Pressable, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { Colors, Radius, Spacing } from '../constants/theme';

/**
 * In-app replacement for `Alert.alert(title, msg, [actions])`.
 *
 * `Alert.alert` on `react-native-web` collapses multi-button menus to a single
 * `window.confirm`, and `Alert.prompt` doesn't exist on web at all. This
 * component is the cross-platform-safe stand-in we use everywhere we'd
 * previously have reached for a native Alert.
 *
 * Each action may include `confirmation` — if present, tapping the action
 * shows a second confirm-step (title + message + destructive button) before
 * firing `onPress`. Keeps the call-site flat.
 */
export interface ActionSheetAction {
  label: string;
  destructive?: boolean;
  onPress: () => void;
  confirmation?: {
    title: string;
    message?: string;
    confirmLabel?: string;
  };
}

interface ActionSheetProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  actions: ActionSheetAction[];
  onClose: () => void;
}

export function ActionSheet({ visible, title, subtitle, actions, onClose }: ActionSheetProps) {
  const [confirmingIndex, setConfirmingIndex] = useState<number | null>(null);

  const confirming = confirmingIndex !== null ? actions[confirmingIndex] : null;

  function handleActionPress(idx: number) {
    const action = actions[idx];
    if (action.confirmation) {
      setConfirmingIndex(idx);
    } else {
      onClose();
      // Defer onPress so the parent's close-state can settle before
      // any chained navigation / modal-open from the handler.
      setTimeout(() => action.onPress(), 0);
    }
  }

  function handleConfirm() {
    if (confirming) {
      setConfirmingIndex(null);
      onClose();
      setTimeout(() => confirming.onPress(), 0);
    }
  }

  function handleClose() {
    setConfirmingIndex(null);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        {/* Inner Pressable stops the backdrop tap from firing when the card is tapped. */}
        <Pressable style={styles.card} onPress={() => {}}>
          {confirming && confirming.confirmation ? (
            <>
              <AppText size="lg" weight="bold" align="center" style={styles.title}>
                {confirming.confirmation.title}
              </AppText>
              {confirming.confirmation.message && (
                <AppText
                  size="sm"
                  color={Colors.textSecondary}
                  align="center"
                  style={styles.subtitle}
                >
                  {confirming.confirmation.message}
                </AppText>
              )}
              <Pressable
                style={({ pressed }) => [
                  styles.action,
                  pressed && styles.actionPressed,
                ]}
                onPress={handleConfirm}
              >
                <AppText size="md" weight="bold" color={Colors.danger} align="center">
                  {confirming.confirmation.confirmLabel ?? confirming.label}
                </AppText>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.action,
                  styles.cancelAction,
                  pressed && styles.actionPressed,
                ]}
                onPress={() => setConfirmingIndex(null)}
              >
                <AppText size="md" weight="semibold" color={Colors.textSecondary} align="center">
                  Cancel
                </AppText>
              </Pressable>
            </>
          ) : (
            <>
              {title && (
                <AppText size="lg" weight="bold" align="center" style={styles.title}>
                  {title}
                </AppText>
              )}
              {subtitle && (
                <AppText
                  size="sm"
                  color={Colors.textSecondary}
                  align="center"
                  style={styles.subtitle}
                >
                  {subtitle}
                </AppText>
              )}
              {actions.map((action, idx) => (
                <Pressable
                  key={`${action.label}-${idx}`}
                  style={({ pressed }) => [
                    styles.action,
                    pressed && styles.actionPressed,
                  ]}
                  onPress={() => handleActionPress(idx)}
                >
                  <AppText
                    size="md"
                    weight={action.destructive ? 'bold' : 'semibold'}
                    color={action.destructive ? Colors.danger : Colors.textPrimary}
                    align="center"
                  >
                    {action.label}
                  </AppText>
                </Pressable>
              ))}
              <Pressable
                style={({ pressed }) => [
                  styles.action,
                  styles.cancelAction,
                  pressed && styles.actionPressed,
                ]}
                onPress={handleClose}
              >
                <AppText size="md" weight="semibold" color={Colors.textSecondary} align="center">
                  Cancel
                </AppText>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.md,
  },
  action: {
    minHeight: 50,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    backgroundColor: Colors.surfaceAlt,
  },
  actionPressed: {
    opacity: 0.7,
  },
  cancelAction: {
    backgroundColor: 'transparent',
    marginTop: Spacing.sm,
  },
});

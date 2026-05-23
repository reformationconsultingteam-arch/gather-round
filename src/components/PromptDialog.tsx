import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { AppText } from './AppText';
import { PrimaryButton, GhostButton } from './Buttons';
import { Colors, Radius, Spacing } from '../constants/theme';

/**
 * In-app replacement for iOS-only `Alert.prompt`.
 *
 * Shows a single-line text input + Save/Cancel. The `onSubmit` only fires
 * when the trimmed value is non-empty, matching the original Alert.prompt
 * call-sites' intent (they all guarded with `if (value && value.trim())`).
 */
interface PromptDialogProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  initialValue?: string;
  placeholder?: string;
  submitLabel?: string;
  maxLength?: number;
  onSubmit: (value: string) => void;
  onClose: () => void;
}

export function PromptDialog({
  visible,
  title,
  subtitle,
  initialValue = '',
  placeholder,
  submitLabel = 'Save',
  maxLength = 60,
  onSubmit,
  onClose,
}: PromptDialogProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<TextInput>(null);

  // Reset to the initial value every time the dialog opens, and autofocus the
  // input so the keyboard pops without an extra tap.
  useEffect(() => {
    if (visible) {
      setValue(initialValue);
      // Small delay so the Modal animation doesn't fight the focus.
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [visible, initialValue]);

  const trimmed = value.trim();
  const valid = trimmed.length > 0;

  function handleSubmit() {
    if (!valid) return;
    const v = trimmed;
    onClose();
    // Defer so any chained Alert / modal triggered by the parent renders
    // after this one's close animation begins.
    setTimeout(() => onSubmit(v), 0);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdropPress} onPress={onClose}>
          <Pressable style={styles.card} onPress={() => {}}>
            <AppText size="lg" weight="bold" style={{ marginBottom: Spacing.xs }}>
              {title}
            </AppText>
            {subtitle && (
              <AppText size="sm" color={Colors.textSecondary} style={{ marginBottom: Spacing.sm }}>
                {subtitle}
              </AppText>
            )}
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={value}
              onChangeText={setValue}
              placeholder={placeholder}
              placeholderTextColor={Colors.textMuted}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              maxLength={maxLength}
            />
            <PrimaryButton label={submitLabel} onPress={handleSubmit} disabled={!valid} />
            <GhostButton label="Cancel" onPress={onClose} style={{ marginTop: Spacing.sm }} />
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  backdropPress: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
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
    marginBottom: Spacing.md,
  },
});

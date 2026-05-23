import React, { useState } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSync } from '../src/context/SyncContext';
import { AppText, PrimaryButton, GhostButton } from '../src/components';
import { Colors, Spacing, Radius, FontSize } from '../src/constants/theme';

const DEFAULT_OWNER = 'reformationconsultingteam-arch';
const DEFAULT_REPO = 'gather-round-data';
const PAT_URL = `https://github.com/settings/personal-access-tokens/new`;

const STEPS = [
  {
    n: 1,
    title: 'Open the GitHub token page',
    body: 'Tap the button below — it opens GitHub in a new tab. Sign in if asked.',
  },
  {
    n: 2,
    title: 'Fill in the fields',
    body: `Token name: "Gather Round (this device)"\nExpiration: 1 year (or longer if you want)\nRepository access: "Only select repositories" → choose ${DEFAULT_REPO}\nPermissions: Repository → Contents → Read and write`,
  },
  {
    n: 3,
    title: 'Generate the token',
    body: 'Scroll to the bottom, tap "Generate token", then copy the long string that appears (it starts with "github_pat_…"). GitHub will only show it once.',
  },
  {
    n: 4,
    title: 'Paste it below',
    body: 'Come back here, paste the token into the box, and tap Connect.',
  },
];

export default function SetupScreen() {
  const sync = useSync();
  const router = useRouter();
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = token.trim();
  const isValid = trimmed.length > 0 && !busy;
  const alreadyConnected = sync.isConnected;

  async function handleConnect() {
    if (!isValid) return;
    setError(null);
    setBusy(true);
    const result = await sync.connect(trimmed, DEFAULT_OWNER, DEFAULT_REPO);
    setBusy(false);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    // Connected — DataContext will pull on the next tick. Go home.
    router.replace('/');
  }

  function openTokenPage() {
    Linking.openURL(PAT_URL).catch(() => { /* best-effort */ });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.iconBubble}>
              <Ionicons name="cloud-upload" size={28} color={Colors.accent} />
            </View>
            <AppText size="xxl" weight="heavy" style={{ marginTop: Spacing.md }} align="center">
              {alreadyConnected ? 'Re-connect this device' : 'Set up cloud backup'}
            </AppText>
            <AppText size="md" color={Colors.textSecondary} align="center" style={styles.intro}>
              Your game data is backed up to a private GitHub repo. If this phone is ever lost, broken, or wiped, you can install the app on a new device and your data will be right there.
            </AppText>
          </View>

          <View style={styles.repoCard}>
            <AppText size="xs" color={Colors.textMuted} weight="bold" style={styles.repoLabel}>
              YOUR DATA WILL LIVE AT
            </AppText>
            <AppText size="md" weight="semibold" style={{ marginTop: 4 }}>
              {DEFAULT_OWNER}/{DEFAULT_REPO}
            </AppText>
            <AppText size="xs" color={Colors.textSecondary} style={{ marginTop: 4 }}>
              Private repo · one JSON file · every change becomes a commit
            </AppText>
          </View>

          <AppText size="sm" weight="bold" color={Colors.textMuted} style={styles.stepsHeader}>
            HOW TO GENERATE A TOKEN
          </AppText>

          {STEPS.map(step => (
            <View key={step.n} style={styles.step}>
              <View style={styles.stepNumber}>
                <AppText size="sm" weight="bold" color="#fff">{step.n}</AppText>
              </View>
              <View style={styles.stepBody}>
                <AppText size="md" weight="semibold">{step.title}</AppText>
                <AppText size="sm" color={Colors.textSecondary} style={{ marginTop: 4, lineHeight: 20 }}>
                  {step.body}
                </AppText>
              </View>
            </View>
          ))}

          <Pressable
            onPress={openTokenPage}
            style={({ pressed }) => [styles.linkBtn, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="open-outline" size={18} color={Colors.accent} />
            <AppText size="md" weight="semibold" color={Colors.accent} style={{ marginLeft: Spacing.xs }}>
              Open GitHub token page
            </AppText>
          </Pressable>

          <AppText size="sm" weight="bold" color={Colors.textMuted} style={styles.inputLabel}>
            PASTE TOKEN HERE
          </AppText>

          <TextInput
            style={styles.input}
            placeholder="github_pat_…"
            placeholderTextColor={Colors.textMuted}
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            multiline={false}
            editable={!busy}
          />

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={20} color={Colors.danger} />
              <AppText size="sm" color={Colors.danger} style={{ flex: 1, marginLeft: Spacing.sm, lineHeight: 18 }}>
                {error}
              </AppText>
            </View>
          )}

          <View style={styles.actions}>
            {busy ? (
              <View style={styles.busyRow}>
                <ActivityIndicator color={Colors.accent} />
                <AppText size="md" color={Colors.textSecondary} style={{ marginLeft: Spacing.sm }}>
                  Checking token…
                </AppText>
              </View>
            ) : (
              <PrimaryButton label="Connect" onPress={handleConnect} disabled={!isValid} />
            )}
            {alreadyConnected && !busy && (
              <GhostButton
                label="Cancel"
                onPress={() => router.replace('/')}
                style={{ marginTop: Spacing.sm }}
              />
            )}
          </View>

          <AppText size="xs" color={Colors.textMuted} align="center" style={styles.footnote}>
            Your token is stored only on this device. To remove access, revoke the token in GitHub Settings or tap Disconnect in the app.
          </AppText>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intro: {
    marginTop: Spacing.sm,
    lineHeight: 22,
    paddingHorizontal: Spacing.sm,
  },
  repoCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  repoLabel: {
    letterSpacing: 0.8,
  },
  stepsHeader: {
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  stepBody: {
    flex: 1,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.danger,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  actions: {
    marginTop: Spacing.xl,
  },
  busyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  footnote: {
    marginTop: Spacing.lg,
    lineHeight: 16,
  },
});

import React, { useMemo, useCallback } from 'react';
import {
  View, ScrollView, TextInput, Pressable,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../src/context/DataContext';
import { useSessionFlow } from '../../src/context/SessionFlowContext';
import { AppText, Avatar, PrimaryButton } from '../../src/components';
import { Colors, Spacing, Radius } from '../../src/constants/theme';
import { calculateWinner, formatScore, getPlayerTotal } from '../../src/utils/scoring';
import { Player, Game } from '../../src/types';

// ─── Score input for a single field ──────────────────────────────────────────

function ScoreField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  const [text, setTextRaw] = React.useState(value !== undefined ? String(value) : '');

  function handleChange(raw: string) {
    setTextRaw(raw);
    // Empty field → clear to 0 so the running total updates and stale values don't persist
    if (raw === '') {
      onChange(0);
      return;
    }
    // Allow a lone leading minus or a trailing decimal point while the user is mid-type
    if (raw === '-' || raw === '.' || raw === '-.' || raw.endsWith('.')) return;
    const n = parseFloat(raw);
    if (!isNaN(n)) onChange(n);
  }

  return (
    <View style={fieldStyles.row}>
      <AppText size="sm" color={Colors.textSecondary} style={{ flex: 1 }}>{label}</AppText>
      <TextInput
        style={fieldStyles.input}
        value={text}
        onChangeText={handleChange}
        keyboardType="numbers-and-punctuation"
        returnKeyType="done"
        placeholder="0"
        placeholderTextColor={Colors.textMuted}
        selectTextOnFocus
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  input: {
    width: 72,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function EnterScoresScreen() {
  const { games, players, addSession } = useData();
  const flow = useSessionFlow();
  const router = useRouter();

  const game = useMemo(
    () => games.find(g => g.id === flow.gameId),
    [games, flow.gameId],
  );

  const sessionPlayers = useMemo(
    () => flow.playerIds.map(id => players.find(p => p.id === id)).filter(Boolean) as Player[],
    [flow.playerIds, players],
  );

  const handleSave = useCallback(() => {
    if (!game) return;

    const winner = calculateWinner(
      flow.playerIds,
      flow.scores,
      game.scoreType,
      flow.selectedWinner,
    );

    const session = addSession({
      gameId: game.id,
      date: new Date().toISOString(),
      players: flow.playerIds,
      scores: flow.scores,
      winner,
    });

    flow.setSavedSessionId(session.id);
    router.push('/session/result');
  }, [game, flow, addSession, router]);

  if (!game) return null;

  // ── Winner-pick mode ────────────────────────────────────────────────────────
  if (game.scoreType === 'winner') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <AppText size="sm" color={Colors.textSecondary} style={styles.hint}>
            Tap to crown the winner
          </AppText>
          {sessionPlayers.map(player => {
            const isWinner = flow.selectedWinner === player.id;
            return (
              <Pressable
                key={player.id}
                onPress={() => flow.setSelectedWinner(player.id)}
                style={({ pressed }) => [
                  styles.winnerRow,
                  isWinner && { borderColor: player.color, backgroundColor: player.color + '18' },
                  pressed && { opacity: 0.75 },
                ]}
              >
                <Avatar name={player.name} color={player.color} size="md" />
                <AppText size="lg" weight="semibold" style={{ flex: 1, marginLeft: Spacing.md }}>
                  {player.name}
                </AppText>
                {isWinner && (
                  <AppText style={{ fontSize: 24 }}>👑</AppText>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton
            label="Save Session"
            onPress={handleSave}
            disabled={!flow.selectedWinner}
          />
        </View>
      </View>
    );
  }

  // ── Points mode ─────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <AppText size="sm" color={Colors.textSecondary} style={styles.hint}>
          {game.scoreType === 'lowest' ? 'Lowest total wins' : 'Highest total wins'}
        </AppText>

        {sessionPlayers.map(player => {
          const playerScores = flow.scores[player.id] ?? {};
          const total = getPlayerTotal(playerScores);
          const hasFields = game.scorecardFields.length > 0;

          return (
            <View key={player.id} style={styles.playerCard}>
              {/* Player header */}
              <View style={styles.playerHeader}>
                <Avatar name={player.name} color={player.color} size="sm" />
                <AppText size="md" weight="bold" style={{ flex: 1, marginLeft: Spacing.sm }}>
                  {player.name}
                </AppText>
                <View style={[styles.totalBadge, { borderColor: player.color + '66' }]}>
                  <AppText size="xs" color={Colors.textSecondary}>Total</AppText>
                  <AppText size="lg" weight="heavy" color={player.color}>
                    {formatScore(total)}
                  </AppText>
                </View>
              </View>

              {/* Score fields */}
              <View style={styles.fields}>
                {hasFields ? (
                  game.scorecardFields.map(field => (
                    <ScoreField
                      key={field}
                      label={field}
                      value={playerScores[field]}
                      onChange={v => flow.setFieldScore(player.id, field, v)}
                    />
                  ))
                ) : (
                  <ScoreField
                    label="Score"
                    value={playerScores['score']}
                    onChange={v => flow.setFieldScore(player.id, 'score', v)}
                  />
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label="Save Session" onPress={handleSave} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 120,
  },
  hint: {
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  // Winner-pick rows
  winnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    minHeight: 64,
  },
  // Points mode player cards
  playerCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  totalBadge: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    minWidth: 52,
  },
  fields: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});

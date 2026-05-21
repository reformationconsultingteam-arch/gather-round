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
import {
  calculateWinner,
  formatScore,
  getPlayerTotal,
  getPlacementPoints,
  formatPlace,
} from '../../src/utils/scoring';
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

const placeStyles = StyleSheet.create({
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  pill: {
    minWidth: 48,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

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

  // ── Placement mode ──────────────────────────────────────────────────────────
  if (game.scoreType === 'placement') {
    const n = sessionPlayers.length;
    const placeOf = (pid: string) => flow.scores[pid]?.Place;

    // Validation: every place from 1..n must appear exactly once
    const placesUsed = sessionPlayers
      .map(p => placeOf(p.id))
      .filter((v): v is number => Number.isFinite(v) && (v as number) >= 1 && (v as number) <= n);
    const placeCounts: Record<number, number> = {};
    for (const place of placesUsed) {
      placeCounts[place] = (placeCounts[place] ?? 0) + 1;
    }
    const isDuplicate = (place: number | undefined) =>
      Number.isFinite(place) && (placeCounts[place as number] ?? 0) > 1;
    const allAssigned = placesUsed.length === n;
    const noDuplicates = Object.values(placeCounts).every(c => c === 1);
    const isValid = allAssigned && noDuplicates;

    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <AppText size="sm" color={Colors.textSecondary} style={styles.hint}>
            Tap a place for each player ({game.placementPoints ? game.placementPoints.join(' / ') : '5 / 3 / 2 / 1 / 0'} pts)
          </AppText>

          {sessionPlayers.map(player => {
            const place = placeOf(player.id);
            const dup = isDuplicate(place);
            const points = place ? getPlacementPoints(place, game) : 0;

            return (
              <View
                key={player.id}
                style={[
                  styles.playerCard,
                  dup && { borderColor: Colors.danger ?? '#FF6B6B' },
                ]}
              >
                <View style={styles.playerHeader}>
                  <Avatar name={player.name} color={player.color} size="sm" />
                  <AppText size="md" weight="bold" style={{ flex: 1, marginLeft: Spacing.sm }}>
                    {player.name}
                  </AppText>
                  <View style={[styles.totalBadge, { borderColor: player.color + '66' }]}>
                    <AppText size="xs" color={Colors.textSecondary}>
                      {place ? formatPlace(place) : '—'}
                    </AppText>
                    <AppText size="lg" weight="heavy" color={place ? player.color : Colors.textMuted}>
                      {place ? `${points} pt${points === 1 ? '' : 's'}` : '—'}
                    </AppText>
                  </View>
                </View>

                {/* Place pills */}
                <View style={placeStyles.pillRow}>
                  {Array.from({ length: n }, (_, i) => i + 1).map(p => {
                    const selected = place === p;
                    return (
                      <Pressable
                        key={p}
                        onPress={() => flow.setFieldScore(player.id, 'Place', p)}
                        style={({ pressed }) => [
                          placeStyles.pill,
                          selected && { backgroundColor: player.color, borderColor: player.color },
                          dup && selected && { borderColor: Colors.danger ?? '#FF6B6B' },
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <AppText
                          size="sm"
                          weight="bold"
                          color={selected ? '#fff' : Colors.textPrimary}
                        >
                          {formatPlace(p)}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}

          {!isValid && (
            <AppText size="sm" color={Colors.textMuted} align="center" style={{ marginTop: Spacing.sm }}>
              {!allAssigned
                ? 'Assign a place to every player.'
                : 'Each place can only be used once.'}
            </AppText>
          )}
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton label="Save Session" onPress={handleSave} disabled={!isValid} />
        </View>
      </View>
    );
  }

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

import React, { useMemo, useCallback } from 'react';
import {
  View, ScrollView, TextInput, Pressable,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
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
import { Player, SecretHitlerRole, RookRound } from '../../src/types';

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
    if (raw === '') {
      onChange(0);
      return;
    }
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

const ROLE_COLORS: Record<SecretHitlerRole, string> = {
  liberal: '#3B82F6',
  fascist: '#EF4444',
  hitler: '#111827',
};
const ROLE_LABELS: Record<SecretHitlerRole, string> = {
  liberal: 'Liberal',
  fascist: 'Fascist',
  hitler: 'Hitler',
};
const ROLE_CYCLE: SecretHitlerRole[] = ['liberal', 'fascist', 'hitler'];

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
      ...(flow.groupId ? { groupId: flow.groupId } : {}),
    });

    flow.setSavedSessionId(session.id);
    router.push('/session/result');
  }, [game, flow, addSession, router]);

  const handleSaveSecretHitler = useCallback(() => {
    if (!game || !flow.winningTeam) return;

    const winningRoles: SecretHitlerRole[] = flow.winningTeam === 'fascist'
      ? ['fascist', 'hitler']
      : ['liberal'];

    const winnersOnTeam = flow.playerIds.filter(pid => winningRoles.includes(flow.roles[pid]));
    const legacyWinner = flow.mvpPlayerId
      ?? winnersOnTeam[0]
      ?? flow.playerIds[0];

    const session = addSession({
      gameId: game.id,
      date: new Date().toISOString(),
      players: flow.playerIds,
      scores: {},
      winner: legacyWinner,
      roles: { ...flow.roles },
      winningTeam: flow.winningTeam,
      mvpPlayerId: flow.mvpPlayerId ?? undefined,
      bonusFascistPlayerId: flow.bonusFascistPlayerId ?? undefined,
      ...(flow.groupId ? { groupId: flow.groupId } : {}),
    });

    flow.setSavedSessionId(session.id);
    router.push('/session/result');
  }, [game, flow, addSession, router]);

  const handleSaveRook = useCallback(() => {
    if (!game || !flow.rookWinningTeam) return;

    const winningTeamPlayers = flow.rookWinningTeam === 'A' ? flow.rookTeamA : flow.rookTeamB;
    const legacyWinner = winningTeamPlayers[0] ?? flow.playerIds[0];

    const session = addSession({
      gameId: game.id,
      date: new Date().toISOString(),
      players: flow.playerIds,
      scores: {},
      winner: legacyWinner,
      rookData: {
        teams: { A: [...flow.rookTeamA], B: [...flow.rookTeamB] },
        targetScore: flow.rookTargetScore,
        rounds: [...flow.rookRounds],
        winningTeam: flow.rookWinningTeam,
      },
      ...(flow.groupId ? { groupId: flow.groupId } : {}),
    });

    flow.setSavedSessionId(session.id);
    router.push('/session/result');
  }, [game, flow, addSession, router]);

  if (!game) return null;

  // ── Secret Hitler ───────────────────────────────────────────────────────────
  if (game.scoreType === 'secretHitler') {
    const hitlerCount = sessionPlayers.filter(p => flow.roles[p.id] === 'hitler').length;
    const allAssigned = sessionPlayers.every(p => !!flow.roles[p.id]);
    const isValid = allAssigned && hitlerCount === 1 && !!flow.winningTeam;
    const validationMsg = !allAssigned
      ? 'Assign a role to every player.'
      : hitlerCount === 0
        ? 'One player must be Hitler.'
        : hitlerCount > 1
          ? 'Only one player can be Hitler.'
          : !flow.winningTeam
            ? 'Pick which team won.'
            : null;

    function cycleRole(pid: string) {
      const current = flow.roles[pid];
      const idx = current ? ROLE_CYCLE.indexOf(current) : -1;
      const next = ROLE_CYCLE[(idx + 1) % ROLE_CYCLE.length];
      flow.setRole(pid, next);
    }

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <AppText size="sm" weight="bold" color={Colors.textSecondary} style={styles.sectionLabel}>
            ROLES
          </AppText>
          <AppText size="sm" color={Colors.textMuted} style={styles.hint}>
            Tap each player to cycle Liberal → Fascist → Hitler
          </AppText>
          {sessionPlayers.map(player => {
            const role = flow.roles[player.id];
            const color = role ? ROLE_COLORS[role] : Colors.surfaceAlt;
            const label = role ? ROLE_LABELS[role] : 'Tap to assign';
            return (
              <Pressable
                key={player.id}
                onPress={() => cycleRole(player.id)}
                style={({ pressed }) => [
                  styles.winnerRow,
                  role && { borderColor: color, backgroundColor: color + '18' },
                  pressed && { opacity: 0.75 },
                ]}
              >
                <Avatar name={player.name} color={player.color} size="md" />
                <AppText size="lg" weight="semibold" style={{ flex: 1, marginLeft: Spacing.md }}>
                  {player.name}
                </AppText>
                <View style={[shStyles.roleBadge, { backgroundColor: role ? color : Colors.surfaceAlt }]}>
                  <AppText size="sm" weight="bold" color={role ? '#fff' : Colors.textMuted}>
                    {label}
                  </AppText>
                </View>
              </Pressable>
            );
          })}

          <AppText size="sm" weight="bold" color={Colors.textSecondary} style={styles.sectionLabel}>
            WINNING TEAM
          </AppText>
          <View style={shStyles.teamRow}>
            {(['liberal', 'fascist'] as const).map(team => {
              const selected = flow.winningTeam === team;
              const color = team === 'liberal' ? ROLE_COLORS.liberal : ROLE_COLORS.fascist;
              return (
                <Pressable
                  key={team}
                  onPress={() => flow.setWinningTeam(team)}
                  style={({ pressed }) => [
                    shStyles.teamBtn,
                    selected && { borderColor: color, backgroundColor: color + '18' },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <AppText size="lg" weight="heavy" color={selected ? color : Colors.textPrimary}>
                    {team === 'liberal' ? 'Liberals' : 'Fascists'}
                  </AppText>
                  <AppText size="xs" color={Colors.textSecondary}>
                    {team === 'liberal' ? 'won the game' : 'won the game'}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <AppText size="sm" weight="bold" color={Colors.textSecondary} style={styles.sectionLabel}>
            OPTIONAL
          </AppText>
          <OptionalPicker
            label="MVP"
            players={sessionPlayers}
            selectedId={flow.mvpPlayerId}
            onSelect={flow.setMvpPlayerId}
          />
          <OptionalPicker
            label="Bonus fascist"
            players={sessionPlayers}
            selectedId={flow.bonusFascistPlayerId}
            onSelect={flow.setBonusFascistPlayerId}
          />

          {validationMsg && (
            <AppText size="sm" color={Colors.textMuted} align="center" style={{ marginTop: Spacing.md }}>
              {validationMsg}
            </AppText>
          )}
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton label="Save Session" onPress={handleSaveSecretHitler} disabled={!isValid} />
        </View>
      </View>
    );
  }

  // ── Rook ────────────────────────────────────────────────────────────────────
  if (game.scoreType === 'rook') {
    const teamATotal = flow.rookRounds.reduce((sum, r) => sum + r.teamAPoints, 0);
    const teamBTotal = flow.rookRounds.reduce((sum, r) => sum + r.teamBPoints, 0);
    const teamsValid = flow.rookTeamA.length > 0 && flow.rookTeamB.length > 0;
    const someoneHit = teamATotal >= flow.rookTargetScore || teamBTotal >= flow.rookTargetScore;
    const autoWinner: 'A' | 'B' | null = someoneHit
      ? (teamATotal >= teamBTotal ? 'A' : 'B')
      : null;
    const effectiveWinner = flow.rookWinningTeam ?? autoWinner;
    const canFinish = teamsValid && someoneHit && !!effectiveWinner;

    return (
      <RookEntry
        teamA={flow.rookTeamA}
        teamB={flow.rookTeamB}
        players={sessionPlayers}
        target={flow.rookTargetScore}
        rounds={flow.rookRounds}
        teamATotal={teamATotal}
        teamBTotal={teamBTotal}
        winningTeam={effectiveWinner}
        canFinish={canFinish}
        onAddRound={flow.addRookRound}
        onRemoveRound={flow.removeRookRound}
        onSelectWinner={flow.setRookWinningTeam}
        onFinish={() => {
          if (effectiveWinner && !flow.rookWinningTeam) flow.setRookWinningTeam(effectiveWinner);
          handleSaveRook();
        }}
      />
    );
  }

  // ── Placement mode ──────────────────────────────────────────────────────────
  if (game.scoreType === 'placement') {
    const n = sessionPlayers.length;
    const placeOf = (pid: string) => flow.scores[pid]?.Place;

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
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
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
                        <AppText size="sm" weight="bold" color={selected ? '#fff' : Colors.textPrimary}>
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
              {!allAssigned ? 'Assign a place to every player.' : 'Each place can only be used once.'}
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
                {isWinner && (<AppText style={{ fontSize: 24 }}>👑</AppText>)}
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton label="Save Session" onPress={handleSave} disabled={!flow.selectedWinner} />
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
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <AppText size="sm" color={Colors.textSecondary} style={styles.hint}>
          {game.scoreType === 'lowest' ? 'Lowest total wins' : 'Highest total wins'}
        </AppText>

        {sessionPlayers.map(player => {
          const playerScores = flow.scores[player.id] ?? {};
          const total = getPlayerTotal(playerScores);
          const hasFields = game.scorecardFields.length > 0;

          return (
            <View key={player.id} style={styles.playerCard}>
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

// ─── Optional MVP / bonus fascist picker ─────────────────────────────────────

function OptionalPicker({
  label,
  players,
  selectedId,
  onSelect,
}: {
  label: string;
  players: Player[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <View style={shStyles.optionalRow}>
      <AppText size="sm" color={Colors.textSecondary} style={{ marginBottom: 6 }}>{label}</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Pressable
          onPress={() => onSelect(null)}
          style={({ pressed }) => [
            shStyles.pickerChip,
            selectedId === null && { backgroundColor: Colors.surfaceAlt, borderColor: Colors.border },
            pressed && { opacity: 0.7 },
          ]}
        >
          <AppText size="sm" color={Colors.textSecondary}>None</AppText>
        </Pressable>
        {players.map(p => {
          const selected = selectedId === p.id;
          return (
            <Pressable
              key={p.id}
              onPress={() => onSelect(p.id)}
              style={({ pressed }) => [
                shStyles.pickerChip,
                selected && { backgroundColor: p.color + '22', borderColor: p.color },
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={[shStyles.dot, { backgroundColor: p.color }]} />
              <AppText size="sm" weight={selected ? 'bold' : 'medium'}>{p.name}</AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Rook entry sub-view ─────────────────────────────────────────────────────

function RookEntry({
  teamA, teamB, players, target, rounds, teamATotal, teamBTotal,
  winningTeam, canFinish, onAddRound, onRemoveRound, onSelectWinner, onFinish,
}: {
  teamA: string[]; teamB: string[]; players: Player[];
  target: number; rounds: RookRound[];
  teamATotal: number; teamBTotal: number;
  winningTeam: 'A' | 'B' | null; canFinish: boolean;
  onAddRound: (r: RookRound) => void;
  onRemoveRound: (i: number) => void;
  onSelectWinner: (t: 'A' | 'B' | null) => void;
  onFinish: () => void;
}) {
  const [bidTeam, setBidTeam] = React.useState<'A' | 'B'>('A');
  const [bidAmount, setBidAmount] = React.useState('');
  const [aPts, setAPts] = React.useState('');
  const [bPts, setBPts] = React.useState('');

  const nameById = useMemo(() => {
    const m: Record<string, Player> = {};
    for (const p of players) m[p.id] = p;
    return m;
  }, [players]);

  const teamsValid = teamA.length > 0 && teamB.length > 0;

  function submitRound() {
    const bid = parseInt(bidAmount, 10);
    const a = parseInt(aPts, 10) || 0;
    const b = parseInt(bPts, 10) || 0;
    if (!Number.isFinite(bid) || bid <= 0) return;
    onAddRound({ biddingTeam: bidTeam, bidAmount: bid, teamAPoints: a, teamBPoints: b });
    setBidAmount(''); setAPts(''); setBPts('');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {!teamsValid && (
          <AppText size="sm" color={Colors.danger ?? '#FF6B6B'} align="center" style={{ marginBottom: Spacing.md }}>
            Go back and assign both teams.
          </AppText>
        )}

        {/* Running totals */}
        <View style={rookStyles.totalsRow}>
          <View style={[rookStyles.totalCard, winningTeam === 'A' && rookStyles.totalCardWinner]}>
            <AppText size="xs" color={Colors.textSecondary}>TEAM A</AppText>
            <AppText size="xl" weight="heavy">{teamATotal}</AppText>
            <AppText size="xs" color={Colors.textMuted}>
              {teamA.map(id => nameById[id]?.name ?? '?').join(' & ')}
            </AppText>
          </View>
          <View style={rookStyles.targetCard}>
            <AppText size="xs" color={Colors.textSecondary}>TARGET</AppText>
            <AppText size="lg" weight="bold">{target}</AppText>
          </View>
          <View style={[rookStyles.totalCard, winningTeam === 'B' && rookStyles.totalCardWinner]}>
            <AppText size="xs" color={Colors.textSecondary}>TEAM B</AppText>
            <AppText size="xl" weight="heavy">{teamBTotal}</AppText>
            <AppText size="xs" color={Colors.textMuted}>
              {teamB.map(id => nameById[id]?.name ?? '?').join(' & ')}
            </AppText>
          </View>
        </View>

        {/* Round list */}
        {rounds.length > 0 && (
          <>
            <AppText size="sm" weight="bold" color={Colors.textSecondary} style={styles.sectionLabel}>
              ROUNDS
            </AppText>
            {rounds.map((r, i) => {
              const bidderPts = r.biddingTeam === 'A' ? r.teamAPoints : r.teamBPoints;
              const madeBid = bidderPts >= r.bidAmount;
              return (
                <View key={i} style={rookStyles.roundRow}>
                  <View style={{ flex: 1 }}>
                    <AppText size="sm" weight="semibold">
                      R{i + 1} · Team {r.biddingTeam} bid {r.bidAmount}
                    </AppText>
                    <AppText size="xs" color={Colors.textSecondary}>
                      A: {r.teamAPoints}  ·  B: {r.teamBPoints}
                    </AppText>
                  </View>
                  <View style={[
                    rookStyles.badge,
                    madeBid
                      ? { backgroundColor: '#10B98122', borderColor: '#10B981' }
                      : { backgroundColor: '#EF444422', borderColor: '#EF4444' },
                  ]}>
                    <AppText size="xs" weight="bold" color={madeBid ? '#059669' : '#DC2626'}>
                      {madeBid ? 'Made' : 'Set'}
                    </AppText>
                  </View>
                  <Pressable onPress={() => onRemoveRound(i)} hitSlop={8} style={{ marginLeft: Spacing.sm }}>
                    <AppText size="lg" color={Colors.textMuted}>×</AppText>
                  </Pressable>
                </View>
              );
            })}
          </>
        )}

        {/* Add round form */}
        <AppText size="sm" weight="bold" color={Colors.textSecondary} style={styles.sectionLabel}>
          ADD ROUND
        </AppText>
        <View style={rookStyles.addCard}>
          <View style={rookStyles.formRow}>
            <AppText size="sm" color={Colors.textSecondary} style={{ width: 90 }}>Bidder</AppText>
            <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
              {(['A', 'B'] as const).map(t => (
                <Pressable
                  key={t}
                  onPress={() => setBidTeam(t)}
                  style={({ pressed }) => [
                    rookStyles.teamToggle,
                    bidTeam === t && { backgroundColor: Colors.accent + '22', borderColor: Colors.accent },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <AppText size="sm" weight="bold">Team {t}</AppText>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={rookStyles.formRow}>
            <AppText size="sm" color={Colors.textSecondary} style={{ width: 90 }}>Bid</AppText>
            <TextInput
              style={fieldStyles.input}
              value={bidAmount}
              onChangeText={setBidAmount}
              keyboardType="number-pad"
              placeholder="120"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
          <View style={rookStyles.formRow}>
            <AppText size="sm" color={Colors.textSecondary} style={{ width: 90 }}>Team A pts</AppText>
            <TextInput
              style={fieldStyles.input}
              value={aPts}
              onChangeText={setAPts}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
          <View style={rookStyles.formRow}>
            <AppText size="sm" color={Colors.textSecondary} style={{ width: 90 }}>Team B pts</AppText>
            <TextInput
              style={fieldStyles.input}
              value={bPts}
              onChangeText={setBPts}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
          <Pressable
            onPress={submitRound}
            disabled={!bidAmount || !teamsValid}
            style={({ pressed }) => [
              rookStyles.addBtn,
              (!bidAmount || !teamsValid) && { opacity: 0.4 },
              pressed && { opacity: 0.7 },
            ]}
          >
            <AppText size="sm" weight="bold" color="#fff">Add round</AppText>
          </Pressable>
        </View>

        {/* Winner override */}
        {(teamATotal >= target || teamBTotal >= target) && (
          <>
            <AppText size="sm" weight="bold" color={Colors.textSecondary} style={styles.sectionLabel}>
              WINNER
            </AppText>
            <View style={shStyles.teamRow}>
              {(['A', 'B'] as const).map(t => {
                const selected = winningTeam === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => onSelectWinner(t)}
                    style={({ pressed }) => [
                      shStyles.teamBtn,
                      selected && { borderColor: Colors.accent, backgroundColor: Colors.accent + '18' },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <AppText size="lg" weight="heavy" color={selected ? Colors.accent : Colors.textPrimary}>
                      Team {t}
                    </AppText>
                    <AppText size="xs" color={Colors.textSecondary}>
                      {t === 'A' ? teamATotal : teamBTotal} pts
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton label="Save Session" onPress={onFinish} disabled={!canFinish} />
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
  sectionLabel: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
    letterSpacing: 1,
  },
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

const shStyles = StyleSheet.create({
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
    minWidth: 88,
    alignItems: 'center',
  },
  teamRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  teamBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  optionalRow: {
    marginBottom: Spacing.md,
  },
  pickerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginRight: Spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
});

const rookStyles = StyleSheet.create({
  totalsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  totalCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  totalCardWinner: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '12',
  },
  targetCard: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  roundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  addCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  teamToggle: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
  },
  addBtn: {
    marginTop: Spacing.xs,
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
});

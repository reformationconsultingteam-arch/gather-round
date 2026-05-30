import React, { useEffect, useRef, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useData } from '../../src/context/DataContext';
import { useSessionFlow } from '../../src/context/SessionFlowContext';
import { AppText, Avatar, PrimaryButton } from '../../src/components';
import { Colors, Spacing, Radius } from '../../src/constants/theme';
import { PLAYER_COLORS } from '../../src/data/colors';
import { formatScore, getPlayerTotal, getPlacementPoints, formatPlace } from '../../src/utils/scoring';
import { resolvePlayer } from '../../src/utils/players';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PARTICLE_COUNT = 36;
const CONFETTI_COLORS = [...PLAYER_COLORS, '#FFFFFF', '#FFD93D', '#FF6B6B'];

// ─── Confetti particle ────────────────────────────────────────────────────────

interface ParticleConfig {
  x: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  rotationEnd: number;
  shape: 'square' | 'circle';
}

function ConfettiParticle({ config }: { config: ParticleConfig }) {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    const { delay, duration } = config;

    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT + 60, {
        duration,
        easing: Easing.in(Easing.quad),
      }),
    );

    // Slight horizontal drift
    translateX.value = withDelay(
      delay,
      withTiming((Math.random() - 0.5) * 80, { duration }),
    );

    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 120 }),
        withDelay(
          duration - 500,
          withTiming(0, { duration: 380 }),
        ),
      ),
    );

    rotate.value = withDelay(
      delay,
      withTiming(config.rotationEnd, { duration }),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: config.x,
          top: 0,
          width: config.size,
          height: config.size,
          borderRadius: config.shape === 'circle' ? config.size / 2 : config.size / 4,
          backgroundColor: config.color,
        },
        animStyle,
      ]}
    />
  );
}

// ─── Confetti emitter ─────────────────────────────────────────────────────────

function Confetti() {
  const particles = useRef<ParticleConfig[]>(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * (SCREEN_WIDTH - 16),
      size: 6 + Math.random() * 9,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      duration: 1800 + Math.random() * 1000,
      delay: Math.random() * 700,
      rotationEnd: 360 + Math.random() * 720,
      shape: Math.random() > 0.5 ? 'square' : 'circle',
    })),
  ).current;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {particles.map((cfg, i) => (
        <ConfettiParticle key={i} config={cfg} />
      ))}
    </View>
  );
}

// ─── Animated winner section ──────────────────────────────────────────────────

function WinnerReveal({ name, color, gameEmoji, gameName }: {
  name: string;
  color: string;
  gameEmoji: string;
  gameName: string;
}) {
  const trophyScale = useSharedValue(0);
  const avatarScale = useSharedValue(0);
  const nameOpacity = useSharedValue(0);
  const nameTranslateY = useSharedValue(20);

  useEffect(() => {
    trophyScale.value = withSpring(1, { damping: 8, stiffness: 120, mass: 0.8 });

    avatarScale.value = withDelay(
      200,
      withSpring(1, { damping: 7, stiffness: 130, mass: 0.9 }),
    );

    nameOpacity.value = withDelay(420, withTiming(1, { duration: 350 }));
    nameTranslateY.value = withDelay(420, withTiming(0, { duration: 350 }));
  }, []);

  const trophyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: trophyScale.value }],
  }));

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  const nameStyle = useAnimatedStyle(() => ({
    opacity: nameOpacity.value,
    transform: [{ translateY: nameTranslateY.value }],
  }));

  return (
    <View style={winStyles.container}>
      <Animated.Text style={[winStyles.trophy, trophyStyle]}>🏆</Animated.Text>

      <Animated.View style={avatarStyle}>
        <Avatar name={name} color={color} size="xl" />
      </Animated.View>

      <Animated.View style={[winStyles.nameBlock, nameStyle]}>
        <AppText size="xxl" weight="heavy" align="center" color={color}>
          {name}
        </AppText>
        <AppText size="md" color={Colors.textSecondary} align="center" style={{ marginTop: Spacing.xs }}>
          wins {gameEmoji} {gameName}!
        </AppText>
      </Animated.View>
    </View>
  );
}

const winStyles = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: Spacing.xl },
  trophy: { fontSize: 72, marginBottom: Spacing.lg },
  nameBlock: { alignItems: 'center', marginTop: Spacing.md },
});

// ─── Secret Hitler team result ────────────────────────────────────────────────

function SecretHitlerResult({ session, game, players }: { session: any; game: any; players: any[] }) {
  const team = session.winningTeam as 'liberal' | 'fascist' | undefined;
  const teamColor = team === 'fascist' ? '#EF4444' : '#3B82F6';
  const teamLabel = team === 'fascist' ? 'Fascists' : 'Liberals';
  const winningRoles = team === 'fascist' ? ['fascist', 'hitler'] : ['liberal'];
  const winners = session.players.filter((pid: string) => winningRoles.includes(session.roles?.[pid]));
  const losers = session.players.filter((pid: string) => !winningRoles.includes(session.roles?.[pid]));

  return (
    <View style={{ alignSelf: 'stretch', marginBottom: Spacing.xl }}>
      <AppText style={{ fontSize: 72, textAlign: 'center', marginBottom: Spacing.md }}>🏆</AppText>
      <AppText size="xxl" weight="heavy" align="center" color={teamColor}>
        {teamLabel} win!
      </AppText>
      <AppText size="md" color={Colors.textSecondary} align="center" style={{ marginTop: Spacing.xs, marginBottom: Spacing.lg }}>
        {game.emoji} {game.name}
      </AppText>
      <RoleList session={session} players={players} ids={winners} winning />
      {losers.length > 0 && <View style={{ height: Spacing.sm }} />}
      <RoleList session={session} players={players} ids={losers} winning={false} />
    </View>
  );
}

function RoleList({ session, players, ids, winning }: { session: any; players: any[]; ids: string[]; winning: boolean }) {
  return (
    <View>
      {ids.map((pid: string) => {
        const p = resolvePlayer(session, pid, players);
        if (!p) return null;
        const role = session.roles?.[pid];
        const roleColor = role === 'hitler' ? '#111827' : role === 'fascist' ? '#EF4444' : '#3B82F6';
        const isMvp = session.mvpPlayerId === pid;
        const isBonus = session.bonusFascistPlayerId === pid;
        return (
          <View key={pid} style={[
            roleListStyles.row,
            winning && { backgroundColor: p.color + '12', borderColor: p.color + '66' },
          ]}>
            <Avatar name={p.name} color={p.color} size="sm" />
            <AppText size="md" weight={winning ? 'bold' : 'regular'} style={{ flex: 1, marginLeft: Spacing.sm }}>
              {p.name}
            </AppText>
            {isMvp && (
              <View style={[roleListStyles.tag, { backgroundColor: '#FFD93D22', borderColor: '#FFD93D' }]}>
                <AppText size="xs" weight="bold" color="#92710A">MVP</AppText>
              </View>
            )}
            {isBonus && (
              <View style={[roleListStyles.tag, { backgroundColor: '#EF444422', borderColor: '#EF4444' }]}>
                <AppText size="xs" weight="bold" color="#DC2626">Bonus F</AppText>
              </View>
            )}
            <View style={[roleListStyles.roleBadge, { backgroundColor: roleColor }]}>
              <AppText size="xs" weight="bold" color="#fff">
                {role === 'hitler' ? 'Hitler' : role === 'fascist' ? 'Fascist' : 'Liberal'}
              </AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const roleListStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginRight: 6,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
});

// ─── Rook team result ─────────────────────────────────────────────────────────

function RookResult({ session, game, players }: { session: any; game: any; players: any[] }) {
  const data = session.rookData;
  if (!data) return null;
  const teamATotal = data.rounds.reduce((s: number, r: any) => s + r.teamAPoints, 0);
  const teamBTotal = data.rounds.reduce((s: number, r: any) => s + r.teamBPoints, 0);
  const winnerTeam = data.winningTeam as 'A' | 'B';
  const winnerLabel = `Team ${winnerTeam}`;

  return (
    <View style={{ alignSelf: 'stretch', marginBottom: Spacing.xl }}>
      <AppText style={{ fontSize: 72, textAlign: 'center', marginBottom: Spacing.md }}>🏆</AppText>
      <AppText size="xxl" weight="heavy" align="center" color={Colors.accent}>
        {winnerLabel} wins!
      </AppText>
      <AppText size="md" color={Colors.textSecondary} align="center" style={{ marginTop: Spacing.xs, marginBottom: Spacing.lg }}>
        {game.emoji} {game.name}  ·  {teamATotal} – {teamBTotal}
      </AppText>
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <RookTeamCard label="Team A" total={teamATotal} ids={data.teams.A} session={session} players={players} isWinner={winnerTeam === 'A'} />
        <RookTeamCard label="Team B" total={teamBTotal} ids={data.teams.B} session={session} players={players} isWinner={winnerTeam === 'B'} />
      </View>
    </View>
  );
}

function RookTeamCard({ label, total, ids, session, players, isWinner }: { label: string; total: number; ids: string[]; session: any; players: any[]; isWinner: boolean }) {
  return (
    <View style={[
      rookCardStyles.card,
      isWinner && { borderColor: Colors.accent, backgroundColor: Colors.accent + '14' },
    ]}>
      <AppText size="xs" color={Colors.textSecondary}>{label}</AppText>
      <AppText size="xl" weight="heavy" color={isWinner ? Colors.accent : Colors.textPrimary}>{total}</AppText>
      {ids.map((pid: string) => {
        const p = resolvePlayer(session, pid, players);
        if (!p) return null;
        return (
          <View key={pid} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <Avatar name={p.name} color={p.color} size="sm" />
            <AppText size="sm" weight="semibold" style={{ marginLeft: 6 }}>{p.name}</AppText>
          </View>
        );
      })}
    </View>
  );
}

const rookCardStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ResultScreen() {
  const { games, sessions, players } = useData();
  const { savedSessionId, reset } = useSessionFlow();
  const router = useRouter();
  const didAutoAdvance = useRef(false);

  const session = sessions.find(s => s.id === savedSessionId);
  const game = session ? games.find(g => g.id === session.gameId) : null;

  const winner = session ? resolvePlayer(session, session.winner, players) : null;
  const winnerId = session?.winner ?? null;

  // Use a stable string id for the dep — `winner` is a fresh object reference each render
  // and would otherwise reset the auto-advance timer on every re-render.
  useEffect(() => {
    if (!winnerId) return;

    const timer = setTimeout(() => {
      if (!didAutoAdvance.current) {
        didAutoAdvance.current = true;
        reset();
        router.dismissAll();
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [winnerId, reset, router]);

  function handleDone() {
    didAutoAdvance.current = true;
    reset();
    router.dismissAll();
  }

  if (!session || !game || !winner) {
    return (
      <View style={styles.container}>
        <AppText color={Colors.textSecondary} align="center">Something went wrong.</AppText>
        <PrimaryButton label="Go Home" onPress={handleDone} style={{ marginTop: Spacing.lg }} />
      </View>
    );
  }

  const isPlacementGame = game.scoreType === 'placement';
  const isTeamGame = game.scoreType === 'secretHitler' || game.scoreType === 'rook';
  const isPointsGame = game.scoreType !== 'winner' && !isTeamGame;

  return (
    <View style={styles.container}>
      {/* Confetti layer — rendered behind everything */}
      <Confetti />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {game.scoreType === 'secretHitler' ? (
          <SecretHitlerResult session={session} game={game} players={players} />
        ) : game.scoreType === 'rook' ? (
          <RookResult session={session} game={game} players={players} />
        ) : (
          <WinnerReveal
            name={winner.name}
            color={winner.color}
            gameEmoji={game.emoji}
            gameName={game.name}
          />
        )}

        {isPointsGame && (
          <View style={styles.scoreCard}>
            <AppText size="xs" weight="bold" color={Colors.textMuted} style={styles.sectionLabel}>
              FINAL SCORES
            </AppText>
            {(() => {
              // For placement games, sort by Place ascending so the result list reads 1st → last.
              const ordered = isPlacementGame
                ? [...session.players].sort(
                    (a, b) =>
                      (session.scores[a]?.Place ?? 99) - (session.scores[b]?.Place ?? 99),
                  )
                : session.players;
              return ordered.map(pid => {
                const p = resolvePlayer(session, pid, players);
                if (!p) return null;
                const isWinner = pid === session.winner;
                const place = isPlacementGame ? session.scores[pid]?.Place : undefined;
                const value = isPlacementGame
                  ? `${getPlacementPoints(place, game)} pt${getPlacementPoints(place, game) === 1 ? '' : 's'}`
                  : formatScore(getPlayerTotal(session.scores[pid] ?? {}));
                return (
                  <View
                    key={pid}
                    style={[styles.scoreRow, isWinner && { backgroundColor: p.color + '18' }]}
                  >
                    <Avatar name={p.name} color={p.color} size="sm" />
                    <AppText
                      size="md"
                      weight={isWinner ? 'bold' : 'regular'}
                      style={{ flex: 1, marginLeft: Spacing.sm }}
                    >
                      {p.name}
                    </AppText>
                    {isPlacementGame && place !== undefined && (
                      <AppText
                        size="xs"
                        color={Colors.textSecondary}
                        style={{ marginRight: Spacing.sm }}
                      >
                        {formatPlace(place)}
                      </AppText>
                    )}
                    {isWinner && (
                      <AppText style={{ marginRight: Spacing.xs }}>👑</AppText>
                    )}
                    <AppText size="lg" weight="heavy" color={isWinner ? p.color : Colors.textPrimary}>
                      {value}
                    </AppText>
                  </View>
                );
              });
            })()}
          </View>
        )}

        <AppText size="sm" color={Colors.textMuted} align="center" style={{ marginTop: Spacing.lg }}>
          Returning home in a moment…
        </AppText>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label="Done" onPress={handleDone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: 120,
    alignItems: 'center',
  },
  scoreCard: {
    alignSelf: 'stretch',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  sectionLabel: {
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 52,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
    backgroundColor: Colors.bg + 'DD',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});

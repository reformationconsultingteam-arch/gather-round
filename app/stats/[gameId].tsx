import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../src/context/DataContext';
import { AppText, Avatar, Card, GroupChip } from '../../src/components';
import { Colors, Spacing, Radius } from '../../src/constants/theme';
import {
  getWinCounts,
  getSessionsPerPlayer,
  getWinRate,
  getHeadToHead,
  getGameBestScore,
  getGamePointsPerPlayer,
  getMvpCounts,
  getSecretHitlerTeamWins,
} from '../../src/utils/stats';
import { filterSessionsByGroup } from '../../src/utils/groups';
import { formatScore } from '../../src/utils/scoring';
import { Player, Session, Game } from '../../src/types';

export default function PerGameStatsScreen() {
  const { gameId, groupId: groupIdParam } = useLocalSearchParams<{ gameId: string; groupId?: string }>();
  const { players, sessions, games, groups } = useData();
  const router = useRouter();

  const isAll = gameId === 'all';
  const game = isAll ? null : games.find(g => g.id === gameId);

  const [groupId, setGroupId] = useState<string | null>(groupIdParam || null);

  const groupScoped = useMemo(
    () => filterSessionsByGroup(sessions, groupId),
    [sessions, groupId],
  );

  const scopedSessions = useMemo(
    () => isAll ? groupScoped : groupScoped.filter(s => s.gameId === gameId),
    [groupScoped, gameId, isAll],
  );

  // Leaderboard scopes itself to players with played > 0 within scopedSessions (already group-
  // filtered by session.groupId), so pass the full roster — no separate player-tag filtering.
  const filteredPlayers = players;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
        <Ionicons name="chevron-back" size={22} color={Colors.accent} />
        <AppText size="md" weight="semibold" color={Colors.accent}>Back to Stats</AppText>
      </Pressable>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          {isAll ? (
            <>
              <Ionicons name="trophy" size={44} color={Colors.accent} />
              <AppText size="xxl" weight="heavy" align="center" style={{ marginTop: Spacing.xs }}>
                All games
              </AppText>
              <AppText size="sm" color={Colors.textSecondary} align="center">
                Combined leaderboard
              </AppText>
            </>
          ) : game ? (
            <>
              <AppText style={styles.headerEmoji}>{game.emoji}</AppText>
              <AppText size="xxl" weight="heavy" align="center">{game.name}</AppText>
              <AppText size="sm" color={Colors.textSecondary} align="center">
                {scopedSessions.length} session{scopedSessions.length === 1 ? '' : 's'}
              </AppText>
            </>
          ) : (
            <AppText color={Colors.textSecondary} align="center">Game not found.</AppText>
          )}
        </View>

        {/* Group filter */}
        {groups.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scopeRow}>
            <GroupChip label="All" color={Colors.accent} selected={groupId === null} onPress={() => setGroupId(null)} />
            {groups.map(g => (
              <GroupChip
                key={g.id}
                label={g.name}
                color={g.color}
                selected={groupId === g.id}
                onPress={() => setGroupId(g.id)}
              />
            ))}
          </ScrollView>
        )}

        <SectionLabel>LEADERBOARD</SectionLabel>
        <Leaderboard players={filteredPlayers} sessions={scopedSessions} game={isAll ? null : game} />

        {/* Game-specific extras */}
        {game && !isAll && (
          <GameBestScoreSection game={game} sessions={scopedSessions} />
        )}

        {game?.scoreType === 'secretHitler' && (
          <SecretHitlerExtras sessions={scopedSessions} players={players} />
        )}

        {game?.scoreType === 'rook' && (
          <RookExtras sessions={scopedSessions} />
        )}

        <SectionLabel>HEAD TO HEAD</SectionLabel>
        <HeadToHead players={filteredPlayers} sessions={scopedSessions} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

function Leaderboard({ players, sessions, game }: { players: Player[]; sessions: Session[]; game?: Game | null }) {
  const router = useRouter();

  // Points-based single-game view headlines accumulated points; everything else (team/winner
  // games, and the combined "All games" view) ranks by wins.
  const isPointsGame =
    !!game && (game.scoreType === 'highest' || game.scoreType === 'lowest' || game.scoreType === 'placement');
  const lowerIsBetter = game?.scoreType === 'lowest';

  const ranked = useMemo(() => {
    const winCounts = getWinCounts(sessions);
    const sessionsPerPlayer = getSessionsPerPlayer(sessions);
    const points = isPointsGame && game ? getGamePointsPerPlayer(sessions, game) : {};
    return [...players]
      .map(p => ({
        player: p,
        wins: winCounts[p.id] ?? 0,
        played: sessionsPerPlayer[p.id] ?? 0,
        rate: getWinRate(sessions, p.id),
        points: points[p.id] ?? 0,
      }))
      .filter(e => e.played > 0)
      .sort((a, b) =>
        isPointsGame
          ? (lowerIsBetter ? a.points - b.points : b.points - a.points) || b.wins - a.wins
          : b.wins - a.wins || b.rate - a.rate,
      );
  }, [players, sessions, game, isPointsGame, lowerIsBetter]);

  if (ranked.length === 0) {
    return (
      <Card style={{ marginBottom: Spacing.lg }}>
        <AppText color={Colors.textSecondary} align="center">No sessions yet</AppText>
      </Card>
    );
  }

  return (
    <View style={{ marginBottom: Spacing.lg }}>
      {ranked.map((entry, index) => {
        const isLeader = index === 0;
        const headline = isPointsGame ? formatScore(entry.points) : String(entry.wins);
        const subline = isPointsGame
          ? `${entry.wins} win${entry.wins !== 1 ? 's' : ''}`
          : `${Math.round(entry.rate * 100)}%`;
        const headlineColor = isPointsGame
          ? entry.player.color
          : entry.wins > 0 ? entry.player.color : Colors.textMuted;
        return (
          <Pressable
            key={entry.player.id}
            onPress={() => router.push(`/player/${entry.player.id}`)}
            style={({ pressed }) => [
              styles.lbRow,
              isLeader && { borderColor: entry.player.color + '88', backgroundColor: entry.player.color + '12' },
              pressed && { opacity: 0.75 },
            ]}
          >
            <AppText size="md" weight="heavy" color={isLeader ? entry.player.color : Colors.textMuted} style={styles.rank}>
              {isLeader ? '👑' : `#${index + 1}`}
            </AppText>
            <Avatar name={entry.player.name} color={entry.player.color} size="md" />
            <View style={styles.lbInfo}>
              <AppText size="md" weight="semibold">{entry.player.name}</AppText>
              <AppText size="xs" color={Colors.textSecondary}>
                {entry.played} game{entry.played !== 1 ? 's' : ''}
              </AppText>
            </View>
            <View style={styles.lbStats}>
              <AppText size="lg" weight="heavy" color={headlineColor}>
                {headline}
              </AppText>
              <AppText size="xs" color={Colors.textSecondary}>{subline}</AppText>
            </View>
            <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} style={{ marginLeft: Spacing.xs }} />
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Game best score ──────────────────────────────────────────────────────────

function GameBestScoreSection({ game, sessions }: { game: any; sessions: Session[] }) {
  if (game.scoreType === 'winner' || game.scoreType === 'secretHitler' || game.scoreType === 'rook') return null;
  const best = getGameBestScore(sessions, game.id, game.scoreType);
  if (!best) return null;

  return (
    <>
      <SectionLabel>{game.scoreType === 'placement' ? 'MOST FIRST-PLACE FINISHES' : (game.scoreType === 'lowest' ? 'LOWEST SCORE' : 'HIGHEST SCORE')}</SectionLabel>
      <Card style={{ marginBottom: Spacing.lg, borderColor: best.playerColor + '66', borderWidth: 1.5 }} padding={Spacing.md}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar name={best.playerName} color={best.playerColor} size="md" />
          <View style={{ flex: 1, marginLeft: Spacing.sm }}>
            <AppText size="md" weight="bold">{best.playerName}</AppText>
            <AppText size="xs" color={Colors.textSecondary}>
              {game.scoreType === 'placement' ? `${best.score} first-place finish${best.score === 1 ? '' : 'es'}` : 'Personal best'}
            </AppText>
          </View>
          <AppText size="xxl" weight="heavy" color={best.playerColor}>
            {game.scoreType === 'placement' ? best.score : formatScore(best.score)}
          </AppText>
        </View>
      </Card>
    </>
  );
}

// ─── Secret Hitler extras ─────────────────────────────────────────────────────

function SecretHitlerExtras({ sessions, players }: { sessions: Session[]; players: Player[] }) {
  const teamWins = getSecretHitlerTeamWins(sessions);
  const mvpCounts = getMvpCounts(sessions);
  const mvpRanked = Object.entries(mvpCounts)
    .map(([pid, count]) => {
      const live = players.find(p => p.id === pid);
      const snap = sessions.find(s => s.playerSnapshots?.[pid])?.playerSnapshots?.[pid];
      return {
        id: pid,
        name: live?.name ?? snap?.name ?? 'Unknown',
        color: live?.color ?? snap?.color ?? '#888',
        count,
      };
    })
    .sort((a, b) => b.count - a.count);
  const totalTeamGames = teamWins.liberal + teamWins.fascist;

  return (
    <>
      <SectionLabel>TEAM WINS</SectionLabel>
      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
        <Card style={{ flex: 1, borderColor: '#3B82F666', borderWidth: 1.5 }} padding={Spacing.md}>
          <AppText size="xs" color={Colors.textSecondary}>LIBERALS</AppText>
          <AppText size="xxl" weight="heavy" color="#3B82F6">{teamWins.liberal}</AppText>
          <AppText size="xs" color={Colors.textMuted}>
            {totalTeamGames > 0 ? `${Math.round(teamWins.liberal / totalTeamGames * 100)}% win rate` : '—'}
          </AppText>
        </Card>
        <Card style={{ flex: 1, borderColor: '#EF444466', borderWidth: 1.5 }} padding={Spacing.md}>
          <AppText size="xs" color={Colors.textSecondary}>FASCISTS</AppText>
          <AppText size="xxl" weight="heavy" color="#EF4444">{teamWins.fascist}</AppText>
          <AppText size="xs" color={Colors.textMuted}>
            {totalTeamGames > 0 ? `${Math.round(teamWins.fascist / totalTeamGames * 100)}% win rate` : '—'}
          </AppText>
        </Card>
      </View>

      {mvpRanked.length > 0 && (
        <>
          <SectionLabel>MVP AWARDS</SectionLabel>
          <View style={{ marginBottom: Spacing.lg }}>
            {mvpRanked.map(m => (
              <View key={m.id} style={styles.lbRow}>
                <AppText style={{ marginRight: Spacing.sm }}>🏅</AppText>
                <Avatar name={m.name} color={m.color} size="sm" />
                <AppText size="md" weight="semibold" style={{ flex: 1, marginLeft: Spacing.sm }}>{m.name}</AppText>
                <AppText size="lg" weight="heavy" color={m.color}>{m.count}</AppText>
              </View>
            ))}
          </View>
        </>
      )}
    </>
  );
}

// ─── Rook extras ──────────────────────────────────────────────────────────────

function RookExtras({ sessions }: { sessions: Session[] }) {
  let teamWins = { A: 0, B: 0 };
  let rounds = 0;
  let made = 0;
  let bids = 0;
  for (const s of sessions) {
    if (!s.rookData) continue;
    teamWins[s.rookData.winningTeam]++;
    for (const r of s.rookData.rounds) {
      rounds++;
      bids++;
      const bidderPts = r.biddingTeam === 'A' ? r.teamAPoints : r.teamBPoints;
      if (bidderPts >= r.bidAmount) made++;
    }
  }
  if (rounds === 0) return null;

  return (
    <>
      <SectionLabel>ROOK SUMMARY</SectionLabel>
      <Card style={{ marginBottom: Spacing.lg }} padding={Spacing.md}>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <AppText size="xs" color={Colors.textSecondary}>TEAM A WINS</AppText>
            <AppText size="xxl" weight="heavy">{teamWins.A}</AppText>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <AppText size="xs" color={Colors.textSecondary}>TEAM B WINS</AppText>
            <AppText size="xxl" weight="heavy">{teamWins.B}</AppText>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <AppText size="xs" color={Colors.textSecondary}>BID SUCCESS</AppText>
            <AppText size="xxl" weight="heavy">
              {bids > 0 ? `${Math.round(made / bids * 100)}%` : '—'}
            </AppText>
            <AppText size="xs" color={Colors.textMuted}>{made}/{bids} bids</AppText>
          </View>
        </View>
      </Card>
    </>
  );
}

// ─── Head-to-head ─────────────────────────────────────────────────────────────

function HeadToHead({ players, sessions }: { players: Player[]; sessions: Session[] }) {
  const [p1Id, setP1Id] = useState<string | null>(null);
  const [p2Id, setP2Id] = useState<string | null>(null);
  const [picking, setPicking] = useState<1 | 2 | null>(null);

  const result = useMemo(() => {
    if (!p1Id || !p2Id) return null;
    return getHeadToHead(sessions, p1Id, p2Id);
  }, [sessions, p1Id, p2Id]);

  const p1 = players.find(p => p.id === p1Id);
  const p2 = players.find(p => p.id === p2Id);

  if (players.length < 2) {
    return (
      <Card style={{ marginBottom: Spacing.lg }}>
        <AppText color={Colors.textSecondary} align="center">Need at least 2 players</AppText>
      </Card>
    );
  }

  return (
    <Card style={{ marginBottom: Spacing.lg }} padding={Spacing.md}>
      <View style={styles.h2hPickers}>
        <PlayerPicker label="Player 1" player={p1 ?? null} active={picking === 1} onPress={() => setPicking(picking === 1 ? null : 1)} />
        <AppText size="xl" weight="heavy" color={Colors.textMuted} align="center">vs</AppText>
        <PlayerPicker label="Player 2" player={p2 ?? null} active={picking === 2} onPress={() => setPicking(picking === 2 ? null : 2)} />
      </View>

      {picking !== null && (
        <View style={styles.playerPickList}>
          {players
            .filter(p => p.id !== (picking === 1 ? p2Id : p1Id))
            .map(p => (
              <Pressable
                key={p.id}
                style={({ pressed }) => [styles.pickChip, pressed && { opacity: 0.7 }]}
                onPress={() => {
                  if (picking === 1) setP1Id(p.id);
                  else setP2Id(p.id);
                  setPicking(null);
                }}
              >
                <Avatar name={p.name} color={p.color} size="sm" />
                <AppText size="sm" weight="semibold" style={{ marginLeft: Spacing.xs }}>{p.name}</AppText>
              </Pressable>
            ))}
        </View>
      )}

      {result && p1 && p2 && (
        <View style={{ marginTop: Spacing.sm }}>
          <View style={{ height: 1, backgroundColor: Colors.border }} />
          {result.total === 0 ? (
            <AppText color={Colors.textSecondary} align="center" style={{ marginTop: Spacing.sm }}>
              No shared sessions yet
            </AppText>
          ) : (
            <View style={styles.h2hScoreRow}>
              <View style={styles.h2hScore}>
                <AppText size="display" weight="heavy" color={p1.color}>{result.p1Wins}</AppText>
                <AppText size="xs" color={Colors.textSecondary} numberOfLines={1}>{p1.name}</AppText>
              </View>
              <AppText size="sm" color={Colors.textMuted}>{result.total} sessions</AppText>
              <View style={styles.h2hScore}>
                <AppText size="display" weight="heavy" color={p2.color}>{result.p2Wins}</AppText>
                <AppText size="xs" color={Colors.textSecondary} numberOfLines={1}>{p2.name}</AppText>
              </View>
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

function PlayerPicker({ label, player, active, onPress }: {
  label: string; player: Player | null; active: boolean; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pickerBtn,
        active && { borderColor: Colors.accent },
        player && { borderColor: player.color + '88' },
      ]}
    >
      {player ? (
        <>
          <Avatar name={player.name} color={player.color} size="sm" />
          <AppText size="sm" weight="semibold" numberOfLines={1} style={{ marginTop: 4 }}>{player.name}</AppText>
        </>
      ) : (
        <>
          <Ionicons name="person-add" size={22} color={Colors.textMuted} />
          <AppText size="xs" color={Colors.textMuted} style={{ marginTop: 4 }}>{label}</AppText>
        </>
      )}
    </Pressable>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <AppText size="xs" weight="bold" color={Colors.textMuted} style={styles.sectionLabel}>
      {children}
    </AppText>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  scroll: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl },
  header: { alignItems: 'center', paddingVertical: Spacing.md },
  headerEmoji: { fontSize: 48, marginBottom: 4 },
  sectionLabel: { letterSpacing: 0.8, marginTop: Spacing.md, marginBottom: Spacing.sm, marginLeft: Spacing.xs },

  scopeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: 2, paddingVertical: Spacing.sm },

  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
    minHeight: 60,
  },
  rank: { width: 32, textAlign: 'center' },
  lbInfo: { flex: 1, marginLeft: Spacing.sm },
  lbStats: { alignItems: 'flex-end' },

  h2hPickers: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  pickerBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.sm,
  },
  playerPickList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  pickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  h2hScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
  },
  h2hScore: { flex: 1, alignItems: 'center' },
});

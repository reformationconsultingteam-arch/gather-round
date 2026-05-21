import React, { useMemo } from 'react';
import { SectionList, View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useData } from '../../src/context/DataContext';
import { useSessionFlow } from '../../src/context/SessionFlowContext';
import { AppText, PrimaryButton } from '../../src/components';
import { Colors, Spacing, Radius } from '../../src/constants/theme';
import { Game, ScoreType } from '../../src/types';

const SCORE_TYPE_COLOR: Record<ScoreType, string> = {
  highest:   '#6BCB77',
  lowest:    '#FF922B',
  winner:    '#4D96FF',
  placement: '#C56BFF',
};

const SCORE_TYPE_LABEL: Record<ScoreType, string> = {
  highest:   'Highest wins',
  lowest:    'Lowest wins',
  winner:    'Pick winner',
  placement: 'Placement',
};

export default function PickGameScreen() {
  const { games } = useData();
  const { gameId, setGameId } = useSessionFlow();
  const router = useRouter();

  const sections = useMemo(() => {
    const preset = games.filter(g => !g.custom);
    const custom = games.filter(g => g.custom);
    const result = [{ title: 'Preset Games', data: preset }];
    if (custom.length > 0) result.push({ title: 'My Games', data: custom });
    return result;
  }, [games]);

  function handleNext() {
    if (!gameId) return;
    router.push('/session/pick-players');
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <AppText size="xs" weight="bold" color={Colors.textMuted} style={styles.sectionLabel}>
            {section.title.toUpperCase()}
          </AppText>
        )}
        renderSectionFooter={() => <View style={{ height: Spacing.md }} />}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.xs }} />}
        renderItem={({ item }) => (
          <GameItem
            game={item}
            selected={gameId === item.id}
            onPress={() => setGameId(item.id)}
          />
        )}
      />

      <View style={styles.footer}>
        <PrimaryButton
          label="Next →"
          onPress={handleNext}
          disabled={!gameId}
        />
      </View>
    </View>
  );
}

function GameItem({ game, selected, onPress }: { game: Game; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        pressed && { opacity: 0.75 },
      ]}
    >
      <AppText style={styles.emoji}>{game.emoji}</AppText>
      <View style={styles.rowInfo}>
        <AppText size="md" weight="semibold">{game.name}</AppText>
      </View>
      <View style={[styles.badge, { borderColor: SCORE_TYPE_COLOR[game.scoreType] + '66', backgroundColor: SCORE_TYPE_COLOR[game.scoreType] + '22' }]}>
        <AppText size="xs" weight="semibold" color={SCORE_TYPE_COLOR[game.scoreType]}>
          {SCORE_TYPE_LABEL[game.scoreType]}
        </AppText>
      </View>
      {selected && (
        <View style={styles.checkmark}>
          <AppText style={{ fontSize: 16 }}>✓</AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  list: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 120,
  },
  sectionLabel: {
    letterSpacing: 0.8,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 60,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  rowSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '15',
  },
  emoji: { fontSize: 26, width: 38, textAlign: 'center' },
  rowInfo: { flex: 1, marginLeft: Spacing.sm, marginRight: Spacing.sm },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  checkmark: {
    marginLeft: Spacing.sm,
    width: 24,
    alignItems: 'center',
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

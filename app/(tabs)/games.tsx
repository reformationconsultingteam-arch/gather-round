import React, { useCallback, useMemo, useState } from 'react';
import {
  SectionList,
  View,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../src/context/DataContext';
import { AppText, ScreenHeader, ActionSheet } from '../../src/components';
import { Colors, Spacing, Radius } from '../../src/constants/theme';
import { Game, ScoreType } from '../../src/types';

const SCORE_TYPE_LABEL: Record<ScoreType, string> = {
  highest:   'Highest wins',
  lowest:    'Lowest wins',
  winner:    'Pick winner',
  placement: 'Placement',
};

const SCORE_TYPE_COLOR: Record<ScoreType, string> = {
  highest:   '#6BCB77',
  lowest:    '#FF922B',
  winner:    '#4D96FF',
  placement: '#C56BFF',
};

function ScoreBadge({ type }: { type: ScoreType }) {
  return (
    <View style={[styles.badge, { backgroundColor: SCORE_TYPE_COLOR[type] + '22', borderColor: SCORE_TYPE_COLOR[type] + '66' }]}>
      <AppText size="xs" weight="semibold" color={SCORE_TYPE_COLOR[type]}>
        {SCORE_TYPE_LABEL[type]}
      </AppText>
    </View>
  );
}

function GameRow({
  game,
  onOpenOptions,
}: {
  game: Game;
  onOpenOptions?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
      onLongPress={onOpenOptions}
      delayLongPress={300}
    >
      <AppText style={styles.emoji}>{game.emoji}</AppText>
      <View style={styles.rowInfo}>
        <AppText size="md" weight="semibold">{game.name}</AppText>
        {game.scorecardFields.length > 0 && (
          <AppText size="xs" color={Colors.textMuted} style={{ marginTop: 2 }}>
            {game.scorecardFields.join(' · ')}
          </AppText>
        )}
      </View>
      <ScoreBadge type={game.scoreType} />
      {onOpenOptions && (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onOpenOptions();
          }}
          hitSlop={12}
          style={({ pressed }) => [styles.moreBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textSecondary} />
        </Pressable>
      )}
    </Pressable>
  );
}

export default function GamesScreen() {
  const { games, deleteCustomGame } = useData();
  const router = useRouter();

  const [actionsFor, setActionsFor] = useState<Game | null>(null);

  const sections = useMemo(() => {
    const preset = games.filter(g => !g.custom);
    const custom = games.filter(g => g.custom);
    const result = [{ title: 'Preset Games', data: preset }];
    if (custom.length > 0) result.push({ title: 'My Games', data: custom });
    return result;
  }, [games]);

  const openOptions = useCallback((game: Game) => {
    if (!game.custom) return;
    setActionsFor(game);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Games"
        rightIcon={<Ionicons name="add" size={28} color={Colors.accent} />}
        onRightPress={() => router.push('/modals/add-game')}
      />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <AppText
            size="xs"
            weight="bold"
            color={Colors.textMuted}
            style={styles.sectionHeader}
          >
            {section.title.toUpperCase()}
          </AppText>
        )}
        renderSectionFooter={() => <View style={{ height: Spacing.lg }} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <GameRow
            game={item}
            onOpenOptions={item.custom ? () => openOptions(item) : undefined}
          />
        )}
      />

      <ActionSheet
        visible={!!actionsFor}
        title={actionsFor?.name}
        actions={actionsFor ? [
          {
            label: 'Delete',
            destructive: true,
            onPress: () => deleteCustomGame(actionsFor.id),
            confirmation: {
              title: `Delete "${actionsFor.name}"?`,
              message: 'Past sessions using this game will be unaffected.',
              confirmLabel: 'Delete',
            },
          },
        ] : []}
        onClose={() => setActionsFor(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  list: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  sectionHeader: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 60,
  },
  emoji: {
    fontSize: 28,
    width: 40,
    textAlign: 'center',
  },
  rowInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
    marginRight: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  moreBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  separator: {
    height: Spacing.xs,
  },
});

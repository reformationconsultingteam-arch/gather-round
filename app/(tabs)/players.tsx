import React, { useCallback } from 'react';
import {
  FlatList,
  View,
  Pressable,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../src/context/DataContext';
import { AppText, Avatar, ScreenHeader } from '../../src/components';
import { Colors, Spacing, Radius } from '../../src/constants/theme';
import { Player } from '../../src/types';

export default function PlayersScreen() {
  const { players, renamePlayer, deletePlayer } = useData();
  const router = useRouter();

  const handleLongPress = useCallback((player: Player) => {
    Alert.alert(player.name, undefined, [
      {
        text: 'Rename',
        onPress: () => {
          Alert.prompt(
            'Rename Player',
            undefined,
            (newName) => {
              if (newName && newName.trim()) {
                renamePlayer(player.id, newName.trim());
              }
            },
            'plain-text',
            player.name,
          );
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            `Delete ${player.name}?`,
            'Their game history will be preserved.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => deletePlayer(player.id),
              },
            ],
          );
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [renamePlayer, deletePlayer]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Players"
        rightIcon={<Ionicons name="add" size={28} color={Colors.accent} />}
        onRightPress={() => router.push('/modals/add-player')}
      />

      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
            onPress={() => router.push(`/player/${item.id}`)}
            onLongPress={() => handleLongPress(item)}
            delayLongPress={300}
          >
            <Avatar name={item.name} color={item.color} size="md" />
            <View style={styles.rowText}>
              <AppText size="lg" weight="semibold">{item.name}</AppText>
              <AppText size="xs" color={Colors.textMuted} style={{ marginTop: 2 }}>
                Long-press for options
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <AppText size="xxl" align="center" style={{ marginBottom: Spacing.sm }}>👥</AppText>
      <AppText size="lg" weight="semibold" align="center">No players yet</AppText>
      <AppText size="md" color={Colors.textSecondary} align="center" style={{ marginTop: Spacing.xs }}>
        Tap + to add your first player
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  list: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    minHeight: 64,
  },
  rowText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  separator: {
    height: Spacing.sm,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
});

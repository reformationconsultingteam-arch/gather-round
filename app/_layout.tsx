import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DataProvider } from '../src/context/DataContext';
import { Colors } from '../src/constants/theme';

const HEADER_OPTS = {
  headerStyle: { backgroundColor: Colors.surface },
  headerTintColor: Colors.textPrimary,
  headerTitleStyle: { fontWeight: '700' as const },
  contentStyle: { backgroundColor: Colors.bg },
};

export default function RootLayout() {
  return (
    <DataProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="session"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="modals/add-player"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="modals/add-game"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="modals/manage-groups"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="history" options={HEADER_OPTS} />
        <Stack.Screen name="player" options={HEADER_OPTS} />
        <Stack.Screen name="game" options={HEADER_OPTS} />
      </Stack>
    </DataProvider>
  );
}

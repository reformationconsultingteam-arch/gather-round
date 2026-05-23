import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useSegments, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DataProvider } from '../src/context/DataContext';
import { SyncProvider, useSync } from '../src/context/SyncContext';
import { Colors } from '../src/constants/theme';

const HEADER_OPTS = {
  headerStyle: { backgroundColor: Colors.surface },
  headerTintColor: Colors.textPrimary,
  headerTitleStyle: { fontWeight: '700' as const },
  contentStyle: { backgroundColor: Colors.bg },
};

function ConnectionGate({ children }: { children: React.ReactNode }) {
  const sync = useSync();
  const segments = useSegments();

  if (!sync.configLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  // Allow /setup unauthenticated; everything else requires a connection
  const firstSegment = segments[0] as string | undefined;
  const onSetup = firstSegment === 'setup';
  if (!sync.isConnected && !onSetup) {
    return <Redirect href="/setup" />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SyncProvider>
      <DataProvider>
        <StatusBar style="light" />
        <ConnectionGate>
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
            <Stack.Screen name="settings" options={HEADER_OPTS} />
            <Stack.Screen name="setup" />
          </Stack>
        </ConnectionGate>
      </DataProvider>
    </SyncProvider>
  );
}

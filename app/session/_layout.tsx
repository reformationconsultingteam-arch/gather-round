import { Stack } from 'expo-router';
import { SessionFlowProvider } from '../../src/context/SessionFlowContext';
import { Colors } from '../../src/constants/theme';

export default function SessionLayout() {
  return (
    <SessionFlowProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.textPrimary,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: Colors.bg },
        }}
      >
        <Stack.Screen name="pick-game"     options={{ title: 'Pick a Game' }} />
        <Stack.Screen name="pick-players"  options={{ title: "Who's Playing?" }} />
        <Stack.Screen name="enter-scores"  options={{ title: 'Enter Scores' }} />
        <Stack.Screen name="result"        options={{ headerShown: false }} />
      </Stack>
    </SessionFlowProvider>
  );
}

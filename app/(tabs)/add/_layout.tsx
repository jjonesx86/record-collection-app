import { Stack } from 'expo-router';

const HEADER_BG = '#1a1a2e';

export default function AddLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: HEADER_BG },
        headerTintColor: '#fff',
        headerTitleStyle: { color: '#fff', fontSize: 17, fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="manual" options={{ title: 'Add Manually', headerBackTitle: 'Add' }} />
      <Stack.Screen name="scan" options={{ title: 'Scan Barcode', headerBackTitle: 'Add' }} />
    </Stack>
  );
}

import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="collection/index" options={{ headerShown: false, title: 'Home' }} />
      <Stack.Screen name="collection/[id]" options={{ title: 'Record Details' }} />
      <Stack.Screen name="add/index" options={{ title: 'Add Record' }} />
      <Stack.Screen name="add/manual" options={{ title: 'Add Manually' }} />
      <Stack.Screen name="add/scan" options={{ title: 'Scan Barcode' }} />
      <Stack.Screen name="upload" options={{ title: 'Settings', headerBackTitle: 'Home' }} />
    </Stack>
  );
}

import { useEffect } from 'react';
import { Stack, router, Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChange } from '../src/services/supabase';
import { useCollectionStore } from '../src/store/collectionStore';

const HEADER_BG = '#1a1a2e';

export default function RootLayout() {
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange((event, _session) => {
      if (event === 'SIGNED_OUT') {
        useCollectionStore.getState().clearAll();
        router.replace('/auth/login' as Href);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: HEADER_BG },
          headerTintColor: '#fff',
          headerTitleStyle: { color: '#fff', fontSize: 17, fontWeight: '600' },
        }}
      >
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="collection/[id]" options={{ title: 'Record Details', headerBackTitle: 'Collection' }} />
      </Stack>
    </>
  );
}

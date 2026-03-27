import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Stack, router, Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChange, fetchUserProfile } from '../src/services/supabase';
import { useCollectionStore } from '../src/store/collectionStore';

const HEADER_BG = '#1a1a2e';

function webRedirect(path: string) {
  if (typeof window !== 'undefined') window.location.href = path;
}

export default function RootLayout() {
  const initialised = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION' && Platform.OS === 'web') {
        const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
        // Only reroute from the root or auth pages — if already in the app, do nothing
        if (session && (pathname === '/' || pathname.startsWith('/auth'))) {
          try {
            const profile = await fetchUserProfile();
            if (profile) {
              useCollectionStore.getState().setCollectionName(profile.collection_name);
              useCollectionStore.getState().setProfileImageUri(profile.profile_image_url);
            }
          } catch { /* proceed */ }
          router.replace('/home' as Href);
        } else if (!session && !pathname.startsWith('/auth')) {
          router.replace('/auth/login' as Href);
        }
        initialised.current = true;
        return;
      }

      if (event === 'SIGNED_IN' && Platform.OS === 'web') {
        const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
        if (pathname === '/' || pathname.startsWith('/auth')) {
          router.replace('/home' as Href);
        }
        return;
      }

      if (event === 'SIGNED_OUT') {
        useCollectionStore.getState().clearAll();
        if (Platform.OS === 'web') {
          webRedirect('/auth/login');
        } else {
          router.replace('/auth/login' as Href);
        }
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
        <Stack.Screen name="privacy" options={{ title: 'Privacy Policy', headerBackTitle: 'Settings' }} />
        <Stack.Screen name="terms" options={{ title: 'Terms of Service', headerBackTitle: 'Settings' }} />
      </Stack>
    </>
  );
}

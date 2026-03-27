import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View, Image } from 'react-native';
import { router, useRootNavigationState, Href } from 'expo-router';
import { useCollectionStore } from '../src/store/collectionStore';
import { getCurrentUser, fetchUserProfile } from '../src/services/supabase';

const isWeb = Platform.OS === 'web';

function webRedirect(path: string) {
  if (typeof window !== 'undefined') {
    window.location.href = path;
  }
}

async function navigate() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      if (isWeb) { webRedirect('/auth/login'); return; }
      router.replace('/auth/login' as Href);
      return;
    }
    try {
      const profile = await fetchUserProfile();
      const { setCollectionName, setProfileImageUri } = useCollectionStore.getState();
      if (profile) {
        setCollectionName(profile.collection_name);
        setProfileImageUri(profile.profile_image_url);
      }
    } catch {
      // proceed even if profile fetch fails
    }
    if (isWeb) { webRedirect('/home'); return; }
    router.replace('/home');
  } catch {
    if (isWeb) { webRedirect('/auth/login'); return; }
    router.replace('/auth/login' as Href);
  }
}

export default function SplashScreen() {
  const opacity = useRef(new Animated.Value(isWeb ? 1 : 0)).current;
  const logoScale = useRef(new Animated.Value(isWeb ? 1 : 0.88)).current;
  const navigationState = useRootNavigationState();
  const navigated = useRef(false);

  // Native only: fade in + subtle scale up on mount
  useEffect(() => {
    if (isWeb) return;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 55,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Native only: fade out before navigating
  useEffect(() => {
    if (isWeb) return;
    const fadeOut = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }).start();
    }, 2650);
    return () => clearTimeout(fadeOut);
  }, []);

  // Web navigation: wait for router to be ready then redirect
  useEffect(() => {
    if (!isWeb) return;
    if (navigated.current) return;
    // Small delay ensures Expo Router is initialised before we navigate
    const timer = setTimeout(() => {
      navigated.current = true;
      navigate();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Native navigation: wait for navigation state key
  useEffect(() => {
    if (isWeb) return;
    if (!navigationState?.key || navigated.current) return;
    const timer = setTimeout(() => {
      navigated.current = true;
      navigate();
    }, 3200);
    return () => clearTimeout(timer);
  }, [navigationState?.key]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity }]}>
        <Text style={styles.appName}>Vinyly</Text>
        {isWeb ? (
          <Image
            source={require('../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        ) : (
          <Animated.Image
            source={require('../assets/icon.png')}
            style={[styles.logo, { transform: [{ scale: logoScale }] }]}
            resizeMode="contain"
          />
        )}
        <Text style={styles.tagline}>Family Vinyl Collections</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 0,
  },
  appName: {
    fontSize: 44,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: 28,
  },
  logo: {
    width: 160,
    height: 160,
    borderRadius: 36,
  },
  tagline: {
    marginTop: 24,
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});

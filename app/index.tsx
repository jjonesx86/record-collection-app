import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { router, useRootNavigationState, Href } from 'expo-router';
import { useCollectionStore } from '../src/store/collectionStore';
import { getCurrentUser, fetchUserProfile } from '../src/services/supabase';

export default function SplashScreen() {
  const opacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.88)).current;
  const navigationState = useRootNavigationState();
  const navigated = useRef(false);
  const setCollectionName = useCollectionStore((s) => s.setCollectionName);
  const setProfileImageUri = useCollectionStore((s) => s.setProfileImageUri);

  // Fade in + subtle scale up on mount
  useEffect(() => {
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

  // Fade out before navigating
  useEffect(() => {
    const fadeOut = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }).start();
    }, 2650);
    return () => clearTimeout(fadeOut);
  }, []);

  // Navigate after 3.2 seconds total
  useEffect(() => {
    if (!navigationState?.key || navigated.current) return;
    const timer = setTimeout(async () => {
      navigated.current = true;
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.replace('/auth/login' as Href);
          return;
        }
        try {
          const profile = await fetchUserProfile();
          if (profile) {
            setCollectionName(profile.collection_name);
            setProfileImageUri(profile.profile_image_url);
          }
        } catch {
          // proceed even if profile fetch fails
        }
        router.replace('/home');
      } catch {
        // Auth error (e.g. invalid/expired token) — treat as signed out
        router.replace('/auth/login' as Href);
      }
    }, 3200);
    return () => clearTimeout(timer);
  }, [navigationState?.key]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity }]}>

        <Text style={styles.appName}>Vinyly</Text>

        <Animated.Image
          source={require('../assets/icon.png')}
          style={[styles.logo, { transform: [{ scale: logoScale }] }]}
          resizeMode="contain"
        />

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

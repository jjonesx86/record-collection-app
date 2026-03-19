import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { router, useRootNavigationState } from 'expo-router';
import { useCollectionStore } from '../src/store/collectionStore';

export default function SplashScreen() {
  const opacity = useRef(new Animated.Value(1)).current;
  const navigationState = useRootNavigationState();
  const navigated = useRef(false);
  const collectionName = useCollectionStore((s) => s.collectionName);
  const profileImageUri = useCollectionStore((s) => s.profileImageUri);

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }).start();
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!navigationState?.key || navigated.current) return;
    const timer = setTimeout(() => {
      navigated.current = true;
      router.replace('/collection');
    }, 2600);
    return () => clearTimeout(timer);
  }, [navigationState?.key]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity }]}>
        {profileImageUri ? (
          <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
        ) : (
          <View style={styles.profilePlaceholder}>
            <Text style={styles.vinyl}>🎵</Text>
          </View>
        )}
        <Text style={styles.welcome}>Welcome to the</Text>
        <Text style={styles.title}>{collectionName}</Text>
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
    gap: 12,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  profilePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  vinyl: {
    fontSize: 44,
  },
  welcome: {
    fontSize: 18,
    color: '#AAA',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 40,
  },
});

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signIn, fetchUserProfile } from '../../src/services/supabase';
import { useCollectionStore } from '../../src/store/collectionStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      if (Platform.OS !== 'web') {
        try {
          const profile = await fetchUserProfile();
          if (profile) {
            useCollectionStore.getState().setCollectionName(profile.collection_name);
            useCollectionStore.getState().setProfileImageUri(profile.profile_image_url);
          }
        } catch { /* proceed */ }
        router.replace('/home' as Href);
      }
      // Web: leave loading=true until _layout.tsx SIGNED_IN event navigates (and fetches profile)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.inner}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.appName}>Vinyly</Text>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>Family Vinyl Collections</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              textContentType="emailAddress"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => router.push('/auth/signup' as Href)}
          >
            <Text style={styles.linkText}>
              Don't have an account?{'  '}
              <Text style={styles.linkBold}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  flex: { flex: 1 },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 40,
  },

  header: { alignItems: 'center' },
  appName: {
    fontSize: 44,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 27,
  },
  tagline: {
    marginTop: 20,
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  form: { gap: 12 },
  input: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  errorText: { fontSize: 14, color: '#FF453A', textAlign: 'center' },

  primaryBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },

  linkBtn: { alignItems: 'center' },
  linkText: { fontSize: 15, color: 'rgba(255,255,255,0.45)' },
  linkBold: { color: '#007AFF', fontWeight: '600' },
});

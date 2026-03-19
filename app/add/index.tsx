import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function AddChoiceScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.heading}>Add a Record</Text>
        <Text style={styles.sub}>How would you like to add it?</Text>

        <TouchableOpacity
          style={styles.option}
          onPress={() => router.push('/add/scan')}
          activeOpacity={0.8}
        >
          <Ionicons name="barcode-outline" size={40} color="#007AFF" />
          <Text style={styles.optionTitle}>Scan Barcode</Text>
          <Text style={styles.optionSub}>Point at the UPC/EAN barcode on the sleeve</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => router.push('/add/manual')}
          activeOpacity={0.8}
        >
          <Ionicons name="search-outline" size={40} color="#007AFF" />
          <Text style={styles.optionTitle}>Search Manually</Text>
          <Text style={styles.optionSub}>Type artist and album to search Discogs</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
    padding: 24,
    gap: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  sub: {
    fontSize: 16,
    color: '#888',
    marginBottom: 16,
  },
  option: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111',
  },
  optionSub: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});

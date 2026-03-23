import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type Destination = 'collection' | 'wishlist';

const COLLECTION_COLOR = '#007AFF';
const WISHLIST_COLOR = '#F5A623';

export default function AddChoiceScreen() {
  const [destination, setDestination] = useState<Destination>('collection');

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.heading}>Add an Album</Text>
        <Text style={styles.sub}>Where would you like to add it?</Text>

        {/* Destination toggle */}
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.pill, destination === 'collection' && styles.pillActiveCollection]}
            onPress={() => setDestination('collection')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="disc-outline"
              size={16}
              color={destination === 'collection' ? '#fff' : '#888'}
            />
            <Text style={[styles.pillText, destination === 'collection' && styles.pillTextActive]}>
              My Collection
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pill, destination === 'wishlist' && styles.pillActiveWishlist]}
            onPress={() => setDestination('wishlist')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="gift-outline"
              size={16}
              color={destination === 'wishlist' ? '#fff' : '#888'}
            />
            <Text style={[styles.pillText, destination === 'wishlist' && styles.pillTextActive]}>
              Wish List
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.option}
          onPress={() => router.push({ pathname: '/add/scan', params: { destination } })}
          activeOpacity={0.8}
        >
          <Ionicons
            name="barcode-outline"
            size={40}
            color={destination === 'wishlist' ? WISHLIST_COLOR : COLLECTION_COLOR}
          />
          <Text style={styles.optionTitle}>Scan Barcode</Text>
          <Text style={styles.optionSub}>Point at the UPC/EAN barcode on the sleeve</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => router.push({ pathname: '/add/manual', params: { destination } })}
          activeOpacity={0.8}
        >
          <Ionicons
            name="search-outline"
            size={40}
            color={destination === 'wishlist' ? WISHLIST_COLOR : COLLECTION_COLOR}
          />
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
    marginBottom: 4,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginBottom: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  pillActiveCollection: {
    backgroundColor: '#007AFF',
  },
  pillActiveWishlist: {
    backgroundColor: '#F5A623',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  pillTextActive: {
    color: '#fff',
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

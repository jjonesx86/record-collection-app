import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  SectionList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCollection } from '../../src/hooks/useCollection';
import { useCollectionStore } from '../../src/store/collectionStore';
import { useSearch } from '../../src/hooks/useSearch';
import { SearchBar } from '../../src/components/SearchBar';
import { RecordCard } from '../../src/components/RecordCard';
import { VinylRecord } from '../../src/types';

export default function HomeScreen() {
  const { records, isLoading, error, refresh } = useCollection();
  const { query, setQuery, results } = useSearch(records);
  const collectionName = useCollectionStore((s) => s.collectionName);
  const profileImageUri = useCollectionStore((s) => s.profileImageUri);

  const handlePress = useCallback((record: VinylRecord) => {
    router.push(`/collection/${record.id}`);
  }, []);

  const collectionResults = results.filter((r) => !r.is_wishlist);
  const wishlistResults = results.filter((r) => r.is_wishlist === true);

  const sections = [
    { title: 'Wish List', data: wishlistResults, isWishlist: true },
    { title: 'My Collection', data: collectionResults, isWishlist: false },
  ].filter((s) => s.data.length > 0);

  const isEmpty = !isLoading && collectionResults.length === 0 && wishlistResults.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/account')} activeOpacity={0.8}>
          {profileImageUri ? (
            <Image source={{ uri: profileImageUri }} style={styles.profileBubble} />
          ) : (
            <View style={styles.profileBubblePlaceholder}>
              <Ionicons name="person" size={20} color="rgba(255,255,255,0.6)" />
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{collectionName}</Text>
      </View>

      <SearchBar value={query} onChangeText={setQuery} autoFocus={false} />

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error} — showing cached data</Text>
        </View>
      )}

      {isLoading && records.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#5BB8FF" />
        </View>
      ) : isEmpty ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            {query ? `No records matching "${query}"` : 'No records yet. Tap + to add one!'}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecordCard record={item} onPress={() => handlePress(item)} />
          )}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Ionicons
                name={section.isWishlist ? 'gift-outline' : 'disc-outline'}
                size={16}
                color={section.isWishlist ? '#F5A623' : '#ffffff'}
              />
              <Text style={[styles.sectionHeaderText, section.isWishlist && styles.sectionHeaderWishlist]}>
                {section.title}
              </Text>
              <Text style={styles.sectionCount}>{section.data.length}</Text>
            </View>
          )}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#5BB8FF" />
          }
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#1a1a2e',
  },
  profileBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  profileBubblePlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  errorBanner: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorText: {
    color: '#856404',
    fontSize: 13,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  sectionHeaderWishlist: {
    color: '#F5A623',
  },
  sectionCount: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },
  list: {
    paddingBottom: 24,
  },
});

import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
      ) : results.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            {query ? `No records matching "${query}"` : 'No records yet. Tap + to add one!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecordCard record={item} onPress={() => handlePress(item)} />
          )}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#5BB8FF" />
          }
          contentContainerStyle={styles.list}
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
  list: {
    paddingBottom: 24,
  },
});

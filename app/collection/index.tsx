import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
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

export default function CollectionScreen() {
  const { records, isLoading, error, refresh } = useCollection();
  const { query, setQuery, results } = useSearch(records);
  const collectionName = useCollectionStore((s) => s.collectionName);

  const handlePress = useCallback((record: VinylRecord) => {
    router.push(`/collection/${record.id}`);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{collectionName}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push('/upload')} style={styles.headerBtn}>
            <Ionicons name="settings-outline" size={22} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      <SearchBar value={query} onChangeText={setQuery} autoFocus={false} />

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error} — showing cached data</Text>
        </View>
      )}

      {isLoading && records.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
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
            <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#007AFF" />
          }
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/add')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    padding: 8,
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
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 36,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
});

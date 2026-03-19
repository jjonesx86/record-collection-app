import React from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlbumArtImage } from './AlbumArtImage';
import { DiscogsResult } from '../types';

interface Props {
  visible: boolean;
  results: DiscogsResult[];
  isLoading: boolean;
  error?: string | null;
  onSelect: (result: DiscogsResult) => void;
  onClose: () => void;
}

export function DiscogsResultsPicker({ visible, results, isLoading, error, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Album</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.statusText}>Searching Discogs…</Text>
          </View>
        )}

        {!isLoading && error && (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!isLoading && !error && results.length === 0 && (
          <View style={styles.centered}>
            <Text style={styles.statusText}>No results found</Text>
          </View>
        )}

        {!isLoading && results.length > 0 && (
          <FlatList
            data={results}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultRow} onPress={() => onSelect(item)} activeOpacity={0.7}>
                <AlbumArtImage uri={item.cover_image ?? item.thumb} size={52} />
                <View style={styles.resultInfo}>
                  <Text style={styles.resultAlbum} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.resultArtist} numberOfLines={1}>{item.artist}</Text>
                  {(item.year || item.label) && (
                    <Text style={styles.resultMeta} numberOfLines={1}>
                      {[item.year, item.label].filter(Boolean).join(' · ')}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 16,
    color: '#007AFF',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  statusText: {
    fontSize: 16,
    color: '#888',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
    gap: 12,
  },
  resultInfo: {
    flex: 1,
    gap: 2,
  },
  resultAlbum: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  resultArtist: {
    fontSize: 13,
    color: '#444',
  },
  resultMeta: {
    fontSize: 12,
    color: '#888',
  },
});

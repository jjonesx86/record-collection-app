import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlbumArtImage } from './AlbumArtImage';
import { VinylRecord } from '../types';

interface Props {
  record: VinylRecord;
  onPress: () => void;
}

export function RecordCard({ record, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <AlbumArtImage uri={record.album_art_url} size={56} />
      <View style={styles.info}>
        <Text style={styles.album} numberOfLines={1}>{record.album}</Text>
        <Text style={styles.artist} numberOfLines={1}>{record.artist}</Text>
        {record.genre ? (
          <Text style={styles.genre} numberOfLines={1}>{record.genre}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#fff',
    gap: 12,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  album: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  artist: {
    fontSize: 14,
    color: '#444',
  },
  genre: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

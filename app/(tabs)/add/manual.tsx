import React, { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlbumArtImage } from '../../../src/components/AlbumArtImage';
import { DiscogsResultsPicker } from '../../../src/components/DiscogsResultsPicker';
import { useDiscogs } from '../../../src/hooks/useDiscogs';
import { useCollectionStore } from '../../../src/store/collectionStore';
import { insertRecord } from '../../../src/services/supabase';
import { DiscogsResult } from '../../../src/types';

type Params = {
  barcode?: string;
  prefillArtist?: string;
  prefillAlbum?: string;
  prefillYear?: string;
  prefillLabel?: string;
  prefillArt?: string;
  prefillDiscogsId?: string;
  discogsResults?: string;
};

export default function ManualEntryScreen() {
  const params = useLocalSearchParams<Params>();

  const [artist, setArtist] = useState(params.prefillArtist ?? '');
  const [album, setAlbum] = useState(params.prefillAlbum ?? '');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState(params.prefillYear ?? '');
  const [label, setLabel] = useState(params.prefillLabel ?? '');
  const [artUrl, setArtUrl] = useState(params.prefillArt ?? '');
  const [discogsId, setDiscogsId] = useState(params.prefillDiscogsId ?? '');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const { results, isSearching, searchError, search, clearResults } = useDiscogs();

  const [preloadedResults] = useState<DiscogsResult[]>(() => {
    if (params.discogsResults) {
      try { return JSON.parse(params.discogsResults); } catch { return []; }
    }
    return [];
  });

  const displayResults = results.length > 0 ? results : preloadedResults;

  const addRecord = useCollectionStore((s) => s.addRecord);
  const hasDuplicate = useCollectionStore((s) => s.hasDuplicate);

  const handleSearch = () => {
    if (!artist.trim() && !album.trim()) {
      Alert.alert('Enter Details', 'Please enter at least an artist or album name.');
      return;
    }
    clearResults();
    search(artist, album);
    setPickerVisible(true);
  };

  const applyResult = (result: DiscogsResult) => {
    setArtist(result.artist);
    setAlbum(result.title);
    setYear(result.year ? String(result.year) : '');
    setLabel(result.label ?? '');
    setArtUrl(result.cover_image ?? result.thumb ?? '');
    setDiscogsId(result.discogs_id);
    setPickerVisible(false);
  };

  const handleSelectResult = (result: DiscogsResult) => {
    if (result.artist && result.title && hasDuplicate(result.artist, result.title)) {
      setPickerVisible(false);
      Alert.alert(
        'Already in Collection',
        `"${result.title}" by ${result.artist} is already in your collection.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Anyway', onPress: () => applyResult(result) },
        ]
      );
      return;
    }
    applyResult(result);
  };

  const handleSave = async () => {
    if (!artist.trim() || !album.trim()) {
      Alert.alert('Missing Info', 'Artist and album are required.');
      return;
    }

    if (hasDuplicate(artist, album)) {
      Alert.alert(
        'Duplicate Found',
        `"${album}" by ${artist} is already in your collection. Save anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save Anyway', onPress: () => doSave() },
        ]
      );
      return;
    }

    doSave();
  };

  const doSave = async () => {
    setSaving(true);
    try {
      const newRecord = await insertRecord({
        artist: artist.trim(),
        album: album.trim(),
        genre: genre.trim() || undefined,
        year: year ? parseInt(year, 10) : undefined,
        label: label.trim() || undefined,
        album_art_url: artUrl.trim() || undefined,
        discogs_id: discogsId || undefined,
      });
      addRecord(newRecord);
      Alert.alert('Saved!', `"${album}" added to your collection.`, [
        { text: 'OK', onPress: () => router.push('/home') },
      ]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          {artUrl ? (
            <View style={styles.artPreview}>
              <AlbumArtImage uri={artUrl} size={120} style={styles.art} />
            </View>
          ) : null}

          <Field label="Artist *" value={artist} onChangeText={setArtist} placeholder="e.g. The Beatles" />
          <Field label="Album *" value={album} onChangeText={setAlbum} placeholder="e.g. Abbey Road" />
          <Field label="Genre" value={genre} onChangeText={setGenre} placeholder="e.g. Rock" />
          <Field label="Year" value={year} onChangeText={setYear} placeholder="e.g. 1969" keyboardType="number-pad" />
          <Field label="Label" value={label} onChangeText={setLabel} placeholder="e.g. Apple Records" />

          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} activeOpacity={0.8}>
            <Text style={styles.searchBtnText}>Search Discogs</Text>
          </TouchableOpacity>

          {params.barcode ? (
            <Text style={styles.barcodeNote}>Barcode: {params.barcode}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Add to Collection</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <DiscogsResultsPicker
        visible={pickerVisible}
        results={displayResults}
        isLoading={isSearching}
        error={searchError}
        onSelect={handleSelectResult}
        onClose={() => setPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#AAA"
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize="words"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  artPreview: {
    alignItems: 'center',
    marginBottom: 8,
  },
  art: {
    borderRadius: 8,
  },
  field: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldInput: {
    fontSize: 17,
    color: '#111',
  },
  searchBtn: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1.5,
    borderColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  searchBtnText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  barcodeNote: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});

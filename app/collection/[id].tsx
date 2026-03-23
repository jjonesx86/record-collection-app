import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCollectionStore } from '../../src/store/collectionStore';
import { deleteRecord, moveToCollection, updateRecord } from '../../src/services/supabase';
import { findAlbumArt } from '../../src/services/discogs';
import { AlbumArtImage } from '../../src/components/AlbumArtImage';

export default function RecordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const record = useCollectionStore((s) => s.records.find((r) => r.id === id));
  const removeRecord = useCollectionStore((s) => s.removeRecord);
  const updateStoreRecord = useCollectionStore((s) => s.updateRecord);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshingArt, setRefreshingArt] = useState(false);
  const [movingToCollection, setMovingToCollection] = useState(false);

  // Edit form state — initialised from record when edit mode opens
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [label, setLabel] = useState('');

  const navigation = useNavigation();

  // Disable back button and swipe gesture while editing
  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: !editing,
      headerBackVisible: !editing,
    });
  }, [editing, navigation]);

  if (!record) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.notFound}>Record not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const openEdit = () => {
    setArtist(record.artist);
    setAlbum(record.album);
    setGenre(record.genre ?? '');
    setYear(record.year ? String(record.year) : '');
    setLabel(record.label ?? '');
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const handleSave = async () => {
    if (!artist.trim() || !album.trim()) {
      Alert.alert('Missing Info', 'Artist and album are required.');
      return;
    }
    setSaving(true);
    try {
      const updates = {
        artist: artist.trim(),
        album: album.trim(),
        genre: genre.trim() || undefined,
        year: year ? parseInt(year, 10) : undefined,
        label: label.trim() || undefined,
      };
      await updateRecord(record.id, updates);
      updateStoreRecord(record.id, updates);
      setEditing(false);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    const dest = record.is_wishlist ? 'wish list' : 'collection';
    Alert.alert(
      'Delete Record',
      `Remove "${record.album}" by ${record.artist} from your ${dest}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteRecord(record.id);
              removeRecord(record.id);
              router.back();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete record. Try again.');
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleMoveToCollection = () => {
    const hasDuplicate = useCollectionStore.getState().hasDuplicate;
    if (hasDuplicate(record.artist, record.album, record.id)) {
      Alert.alert(
        'Already in Collection',
        `"${record.album}" by ${record.artist} is already in your collection.`,
        [{ text: 'OK' }]
      );
      return;
    }
    Alert.alert(
      'I bought this!',
      `Move "${record.album}" to your collection?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Move',
          onPress: async () => {
            setMovingToCollection(true);
            try {
              await moveToCollection(record.id);
              updateStoreRecord(record.id, { is_wishlist: false });
              router.back();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Failed to move record.');
              setMovingToCollection(false);
            }
          },
        },
      ]
    );
  };

  const handleRefreshArt = async () => {
    setRefreshingArt(true);
    try {
      const artUrl = await findAlbumArt({ artist: record.artist, album: record.album });
      if (!artUrl) {
        Alert.alert('Not Found', 'No album art found on Discogs for this record.');
        return;
      }
      await updateRecord(record.id, { album_art_url: artUrl });
      updateStoreRecord(record.id, { album_art_url: artUrl });
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to fetch album art.');
    } finally {
      setRefreshingArt(false);
    }
  };

  if (editing) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.editContent} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
            <View style={styles.editHeader}>
              <TouchableOpacity onPress={cancelEdit} style={styles.editHeaderBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.editTitle}>Edit Record</Text>
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.editHeaderBtn, saving && styles.disabled]}
                disabled={saving}
              >
                <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>

            <EditField label="Artist *" value={artist} onChangeText={setArtist} placeholder="e.g. The Beatles" />
            <EditField label="Album *" value={album} onChangeText={setAlbum} placeholder="e.g. Abbey Road" />
            <EditField label="Genre" value={genre} onChangeText={setGenre} placeholder="e.g. Rock" />
            <EditField label="Year" value={year} onChangeText={setYear} placeholder="e.g. 1969" keyboardType="number-pad" />
            <EditField label="Label" value={label} onChangeText={setLabel} placeholder="e.g. Apple Records" />
          </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.artContainer}>
          <AlbumArtImage uri={record.album_art_url} size={240} style={styles.art} />
        </View>

        <TouchableOpacity
          style={[styles.artRefreshBtn, refreshingArt && styles.disabled]}
          onPress={handleRefreshArt}
          disabled={refreshingArt}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={15} color="#007AFF" />
          <Text style={styles.artRefreshText}>
            {refreshingArt ? 'Fetching…' : 'Refresh Art from Discogs'}
          </Text>
        </TouchableOpacity>

        <View style={styles.info}>
          <Text style={styles.album}>{record.album}</Text>
          <Text style={styles.artist}>{record.artist}</Text>

          <View style={styles.metaGrid}>
            {record.genre ? <MetaRow label="Genre" value={record.genre} /> : null}
            {record.year ? <MetaRow label="Year" value={String(record.year)} /> : null}
            {record.label ? <MetaRow label="Label" value={record.label} /> : null}
          </View>
        </View>

        {record.is_wishlist && (
          <TouchableOpacity
            style={[styles.buyButton, movingToCollection && styles.disabled]}
            onPress={handleMoveToCollection}
            disabled={movingToCollection}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={styles.buyButtonText}>
              {movingToCollection ? 'Moving…' : 'I bought this!'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.editButton} onPress={openEdit} activeOpacity={0.8}>
          <Ionicons name="pencil-outline" size={18} color="#007AFF" />
          <Text style={styles.editButtonText}>Edit Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, deleting && styles.disabled]}
          onPress={handleDelete}
          disabled={deleting}
        >
          <Ionicons name="trash-outline" size={18} color="#FF3B30" />
          <Text style={styles.deleteText}>
            {deleting ? 'Deleting…' : `Remove from ${record.is_wishlist ? 'Wish List' : 'Collection'}`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function EditField({
  label, value, onChangeText, placeholder, keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
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

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontSize: 18, color: '#888' },
  content: { padding: 20, alignItems: 'center', gap: 16 },

  artContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    borderRadius: 8,
  },
  art: { borderRadius: 8 },

  artRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F0F7FF',
  },
  artRefreshText: { fontSize: 13, color: '#007AFF' },

  info: { width: '100%', gap: 6, alignItems: 'center' },
  album: { fontSize: 24, fontWeight: '700', color: '#111', textAlign: 'center' },
  artist: { fontSize: 18, color: '#444', textAlign: 'center' },

  metaGrid: { marginTop: 12, width: '100%', gap: 8 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  metaLabel: { fontSize: 14, color: '#888', fontWeight: '500' },
  metaValue: { fontSize: 14, color: '#111', fontWeight: '500', textAlign: 'right', flex: 1, paddingLeft: 12 },

  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#34C759',
    width: '100%',
    justifyContent: 'center',
  },
  buyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#007AFF',
    width: '100%',
    justifyContent: 'center',
  },
  editButtonText: { color: '#007AFF', fontSize: 16, fontWeight: '500' },

  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FF3B30',
    width: '100%',
    justifyContent: 'center',
  },
  deleteText: { color: '#FF3B30', fontSize: 16, fontWeight: '500' },
  disabled: { opacity: 0.5 },

  // Edit mode
  editContent: { padding: 16, gap: 12, paddingBottom: 40 },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  editHeaderBtn: { padding: 4 },
  editTitle: { fontSize: 17, fontWeight: '600', color: '#111' },
  cancelText: { fontSize: 16, color: '#888' },
  saveText: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
  field: {
    backgroundColor: '#F2F2F7',
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
  fieldInput: { fontSize: 17, color: '#111' },
});

import React, { useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { parseCsv, ImportPreview } from '../src/services/csvImport';
import { upsertRecords, fetchAllRecords, updateRecord } from '../src/services/supabase';
import { findAlbumArt } from '../src/services/discogs';
import { useCollectionStore } from '../src/store/collectionStore';

type ImportState = 'idle' | 'preview' | 'importing' | 'done';
type ArtState = 'idle' | 'running' | 'done';

const RATE_LIMIT_MS = 1100;

export default function SettingsScreen() {
  const [importState, setImportState] = useState<ImportState>('idle');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const [artState, setArtState] = useState<ArtState>('idle');
  const [artProgress, setArtProgress] = useState({ done: 0, total: 0, found: 0 });

  const records = useCollectionStore((s) => s.records);
  const setRecords = useCollectionStore((s) => s.setRecords);
  const setLastFetched = useCollectionStore((s) => s.setLastFetched);
  const updateStoreRecord = useCollectionStore((s) => s.updateRecord);
  const collectionName = useCollectionStore((s) => s.collectionName);
  const setCollectionName = useCollectionStore((s) => s.setCollectionName);
  const profileImageUri = useCollectionStore((s) => s.profileImageUri);
  const setProfileImageUri = useCollectionStore((s) => s.setProfileImageUri);

  const [nameInput, setNameInput] = useState(collectionName);

  // ── Profile image ────────────────────────────────────────────────
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to set a profile image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    const picked = result.assets[0].uri;
    // Copy to a permanent location so the URI survives across app restarts
    const dest = FileSystem.documentDirectory + 'profile-image.jpg';
    await FileSystem.copyAsync({ from: picked, to: dest });
    setProfileImageUri(dest);
  };

  const handleRemoveImage = () => {
    Alert.alert('Remove Photo', 'Remove your profile photo from the splash screen?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setProfileImageUri(null) },
    ]);
  };

  // ── Collection name ──────────────────────────────────────────────
  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      Alert.alert('Invalid Name', 'Collection name cannot be empty.');
      return;
    }
    setCollectionName(trimmed);
    Alert.alert('Saved', 'Collection name updated.');
  };

  // ── CSV import ───────────────────────────────────────────────────
  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      const csvText = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const parsed = parseCsv(csvText);

      if (parsed.errors.length > 0) {
        Alert.alert('Parse Warnings', parsed.errors.slice(0, 3).join('\n'));
      }
      if (parsed.total === 0) {
        Alert.alert('No Records Found', 'Make sure the CSV has Artist and Album columns.');
        return;
      }

      setPreview(parsed);
      setImportState('preview');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to read file.');
    }
  };

  const runImport = async () => {
    if (!preview) return;
    setImportState('importing');
    try {
      const count = await upsertRecords(preview.records);
      setImportedCount(count);
      const freshRecords = await fetchAllRecords();
      setRecords(freshRecords);
      setLastFetched(Date.now());
      setImportState('done');
    } catch (e) {
      const msg = e instanceof Error ? e.message
        : (e && typeof e === 'object' && 'message' in e) ? String((e as any).message)
        : JSON.stringify(e);
      Alert.alert('Import Failed', msg);
      setImportState('preview');
    }
  };

  const resetImport = () => {
    setPreview(null);
    setImportState('idle');
    setImportedCount(0);
  };

  // ── Album art ────────────────────────────────────────────────────
  const runArtRefresh = async (replaceAll: boolean) => {
    const targets = replaceAll ? records : records.filter((r) => !r.album_art_url);
    if (targets.length === 0) {
      Alert.alert('All Good', 'No records to update.');
      return;
    }
    setArtState('running');
    setArtProgress({ done: 0, total: targets.length, found: 0 });
    let found = 0;

    for (let i = 0; i < targets.length; i++) {
      const record = targets[i];
      try {
        const artUrl = await findAlbumArt({ artist: record.artist, album: record.album });
        if (artUrl) {
          await updateRecord(record.id, { album_art_url: artUrl });
          updateStoreRecord(record.id, { album_art_url: artUrl });
          found++;
        }
      } catch {
        // skip on error, continue
      }
      setArtProgress({ done: i + 1, total: targets.length, found });
      if (i < targets.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS));
      }
    }
    setArtState('done');
  };

  const missingArtCount = records.filter((r) => !r.album_art_url).length;
  const isRefreshing = artState === 'running';

  // ── Preview / importing state ────────────────────────────────────
  if (importState === 'preview' || importState === 'importing') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Preview</Text>
            <Text style={styles.previewCount}>{preview?.total} records found</Text>
          </View>
          <FlatList
            data={preview?.records.slice(0, 10)}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <View style={styles.previewRow}>
                <Text style={styles.previewAlbum} numberOfLines={1}>{item.album}</Text>
                <Text style={styles.previewArtist} numberOfLines={1}>{item.artist}</Text>
              </View>
            )}
            ListFooterComponent={
              preview && preview.total > 10 ? (
                <Text style={styles.moreText}>…and {preview.total - 10} more</Text>
              ) : null
            }
          />
          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={resetImport} disabled={importState === 'importing'}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, styles.flex, importState === 'importing' && styles.btnDisabled]}
              onPress={runImport}
              disabled={importState === 'importing'}
              activeOpacity={0.8}
            >
              {importState === 'importing' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Import {preview?.total} Records</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (importState === 'done') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.doneContainer}>
          <Ionicons name="checkmark-circle-outline" size={72} color="#34C759" />
          <Text style={styles.doneHeading}>Import Complete</Text>
          <Text style={styles.doneSub}>{importedCount} records added to your collection.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={resetImport} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>Import Another File</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main settings view ───────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── Profile section ── */}
        <Text style={styles.sectionLabel}>PROFILE</Text>
        <View style={styles.section}>
          <View style={styles.profileRow}>
            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
              {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Ionicons name="person-outline" size={36} color="#888" />
                </View>
              )}
              <View style={styles.profileEditBadge}>
                <Ionicons name="camera" size={12} color="#fff" />
              </View>
            </TouchableOpacity>

            <View style={styles.profileInfo}>
              <Text style={styles.profileLabel}>Collection Photo</Text>
              <Text style={styles.profileSub}>Shown on the loading screen</Text>
              {profileImageUri ? (
                <TouchableOpacity onPress={handleRemoveImage}>
                  <Text style={styles.removeText}>Remove photo</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handlePickImage}>
                  <Text style={styles.chooseText}>Choose from library</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* ── Collection name section ── */}
        <Text style={styles.sectionLabel}>COLLECTION NAME</Text>
        <View style={styles.section}>
          <TextInput
            style={styles.nameInput}
            value={nameInput}
            onChangeText={setNameInput}
            placeholder="e.g. Jones Record Collection"
            placeholderTextColor="#AAA"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleSaveName}
          />
          <View style={styles.sectionDivider} />
          <TouchableOpacity style={styles.sectionRow} onPress={handleSaveName} activeOpacity={0.7}>
            <Text style={styles.sectionRowText}>Save Name</Text>
            <Ionicons name="checkmark" size={18} color="#007AFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionFooter}>Used on the home screen and loading screen.</Text>

        {/* ── Data section ── */}
        <Text style={styles.sectionLabel}>DATA</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionRow} onPress={pickFile} activeOpacity={0.7}>
            <Ionicons name="document-text-outline" size={20} color="#007AFF" style={styles.rowIcon} />
            <Text style={styles.sectionRowText}>Import from CSV</Text>
            <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionFooter}>
          Export from Google Sheets as CSV (File → Download → CSV).{'\n'}
          Expected columns: <Text style={styles.mono}>Artist, Album, Genre, Album Art</Text>
        </Text>

        {/* ── Album art section ── */}
        <Text style={styles.sectionLabel}>ALBUM ART</Text>
        <View style={styles.section}>
          {artState === 'running' && (
            <View style={styles.progressBox}>
              <ActivityIndicator color="#007AFF" size="small" />
              <Text style={styles.progressText}>
                {artProgress.done} / {artProgress.total} checked — {artProgress.found} found
              </Text>
            </View>
          )}
          {artState === 'done' && (
            <View style={styles.progressBox}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#34C759" />
              <Text style={styles.progressText}>
                Done — found art for {artProgress.found} of {artProgress.total} records
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.sectionRow, isRefreshing && styles.rowDisabled]}
            onPress={() => runArtRefresh(false)}
            disabled={isRefreshing}
            activeOpacity={0.7}
          >
            <Ionicons name="image-outline" size={20} color="#007AFF" style={styles.rowIcon} />
            <Text style={styles.sectionRowText}>
              {isRefreshing ? 'Fetching…' : `Fetch Missing Art (${missingArtCount})`}
            </Text>
          </TouchableOpacity>

          <View style={styles.sectionDivider} />

          <TouchableOpacity
            style={[styles.sectionRow, isRefreshing && styles.rowDisabled]}
            onPress={() => runArtRefresh(true)}
            disabled={isRefreshing}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={20} color="#007AFF" style={styles.rowIcon} />
            <Text style={styles.sectionRowText}>
              Refresh All Art ({records.length})
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionFooter}>
          Fetches artwork from Discogs for records missing art, or replaces all existing art.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scroll: { padding: 16, paddingBottom: 48 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6D6D72',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 6,
    marginLeft: 4,
  },
  sectionFooter: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 6,
    marginLeft: 4,
    lineHeight: 17,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionRowText: {
    flex: 1,
    fontSize: 16,
    color: '#111',
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginLeft: 16,
  },
  rowIcon: { marginRight: 12 },
  rowDisabled: { opacity: 0.4 },

  // Profile
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  profileImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  profilePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: { flex: 1, gap: 2 },
  profileLabel: { fontSize: 16, fontWeight: '500', color: '#111' },
  profileSub: { fontSize: 13, color: '#8E8E93' },
  chooseText: { fontSize: 13, color: '#007AFF', marginTop: 4 },
  removeText: { fontSize: 13, color: '#FF3B30', marginTop: 4 },

  // Collection name
  nameInput: {
    fontSize: 16,
    color: '#111',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  // Progress
  progressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  progressText: { fontSize: 14, color: '#444', flex: 1 },

  // Primary button
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  btnDisabled: { opacity: 0.4 },
  flex: { flex: 1 },

  // Cancel button
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#007AFF', fontSize: 16 },

  // Preview
  previewContainer: { flex: 1, padding: 16, gap: 12 },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  previewTitle: { fontSize: 20, fontWeight: '700', color: '#111' },
  previewCount: { fontSize: 14, color: '#888' },
  previewRow: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 6 },
  previewAlbum: { fontSize: 15, fontWeight: '600', color: '#111' },
  previewArtist: { fontSize: 13, color: '#666' },
  moreText: { textAlign: 'center', color: '#888', fontSize: 13, paddingVertical: 8 },
  previewActions: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },

  // Done
  doneContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  doneHeading: { fontSize: 24, fontWeight: '700', color: '#111' },
  doneSub: { fontSize: 15, color: '#666', textAlign: 'center' },

  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: '#333',
  },
});

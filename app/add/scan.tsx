import React, { useRef } from 'react';
import { Alert, ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView } from 'expo-camera';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCamera } from '../../src/hooks/useCamera';
import { lookupByBarcode } from '../../src/services/discogs';
import { useCollectionStore } from '../../src/store/collectionStore';
import { DiscogsResult } from '../../src/types';

export default function ScanScreen() {
  const { hasPermission, isLoading, requestPermission, scanned, setScanned } = useCamera();
  const isProcessing = useRef(false);
  const hasDuplicate = useCollectionStore((s) => s.hasDuplicate);

  const navigateToManual = (data: string, results: DiscogsResult[]) => {
    const first = results[0];
    router.push({
      pathname: '/add/manual',
      params: {
        barcode: data,
        prefillArtist: first?.artist ?? '',
        prefillAlbum: first?.title ?? '',
        prefillYear: first?.year ? String(first.year) : '',
        prefillLabel: first?.label ?? '',
        prefillArt: first?.cover_image ?? first?.thumb ?? '',
        prefillDiscogsId: first?.discogs_id ?? '',
        discogsResults: results.length > 0 ? JSON.stringify(results) : '',
      },
    });
  };

  const handleBarcodeScanned = async ({ data }: { type: string; data: string }) => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    setScanned(true);

    try {
      const results = await lookupByBarcode(data);
      const first: DiscogsResult | undefined = results[0];

      if (first?.artist && first?.title && hasDuplicate(first.artist, first.title)) {
        Alert.alert(
          'Already in Collection',
          `"${first.title}" by ${first.artist} is already in your collection.`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => { setScanned(false); isProcessing.current = false; },
            },
            {
              text: 'Add Anyway',
              onPress: () => navigateToManual(data, results),
            },
          ]
        );
        return;
      }

      navigateToManual(data, results);
    } catch {
      router.push({ pathname: '/add/manual', params: { barcode: data } });
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="camera-outline" size={64} color="#888" />
          <Text style={styles.permissionText}>Camera access is needed to scan barcodes</Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Allow Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.manualLink} onPress={() => router.push('/add/manual')}>
            <Text style={styles.manualLinkText}>Enter manually instead</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['upc_a', 'upc_e', 'ean13', 'ean8'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <View style={styles.viewfinder}>
          <View style={styles.scanBox} />
          <Text style={styles.scanHint}>Align barcode within the frame</Text>
        </View>

        <View style={styles.bottomActions}>
          {scanned && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => { setScanned(false); isProcessing.current = false; }}>
              <Text style={styles.actionBtnText}>Scan Again</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.manualBtn} onPress={() => router.push('/add/manual')}>
            <Text style={styles.manualBtnText}>Can't scan? Enter manually</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
    backgroundColor: '#F2F2F7',
  },
  permissionText: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
  },
  permissionBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  manualLink: {
    padding: 8,
  },
  manualLinkText: {
    color: '#007AFF',
    fontSize: 15,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  viewfinder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  scanBox: {
    width: 260,
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  scanHint: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  bottomActions: {
    padding: 24,
    gap: 12,
    alignItems: 'center',
  },
  actionBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  manualBtn: {
    padding: 8,
  },
  manualBtnText: {
    color: '#fff',
    fontSize: 15,
    opacity: 0.8,
  },
});

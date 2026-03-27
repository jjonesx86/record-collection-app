import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { lookupByBarcode } from '../../../src/services/discogs';
import { useCollectionStore } from '../../../src/store/collectionStore';
import { DiscogsResult } from '../../../src/types';

const CONTAINER_ID = 'barcode-scanner-container';

type Params = {
  destination?: 'collection' | 'wishlist';
};

export default function ScanScreen() {
  const { destination = 'collection' } = useLocalSearchParams<Params>();
  const [status, setStatus] = useState<'loading' | 'denied' | 'scanning'>('loading');
  const [scanned, setScanned] = useState(false);
  const [duplicate, setDuplicate] = useState<{ title: string; artist: string; data: string; results: DiscogsResult[] } | null>(null);
  const isProcessing = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const lastRead = useRef<{ value: string; count: number }>({ value: '', count: 0 });
  const hasDuplicate = useCollectionStore((s) => s.hasDuplicate);
  const hasWishlistDuplicate = useCollectionStore((s) => s.hasWishlistDuplicate);

  const checkDuplicate = destination === 'wishlist' ? hasWishlistDuplicate : hasDuplicate;

  const stopScanner = () => {
    cleanupRef.current?.();
    cleanupRef.current = null;
  };

  const navigateToManual = (data: string, results: DiscogsResult[]) => {
    const first = results[0];
    stopScanner();
    if (results.length > 0) {
      try { sessionStorage.setItem('pendingScanResults', JSON.stringify(results)); } catch { /* ignore */ }
    }
    router.replace({
      pathname: '/(tabs)/add/manual' as any,
      params: {
        destination,
        barcode: data,
        prefillArtist: first?.artist ?? '',
        prefillAlbum: first?.title ?? '',
        prefillYear: first?.year ? String(first.year) : '',
        prefillLabel: first?.label ?? '',
        prefillArt: first?.cover_image ?? first?.thumb ?? '',
        prefillDiscogsId: first?.discogs_id ?? '',
      },
    });
  };

  const handleBarcodeScanned = async (data: string) => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    setScanned(true);

    try {
      const results = await lookupByBarcode(data);
      const first: DiscogsResult | undefined = results[0];
      const isDupe = !!(first?.artist && first?.title && checkDuplicate(first.artist, first.title));

      if (isDupe) {
        setDuplicate({ title: first.title, artist: first.artist, data, results });
        return;
      }

      navigateToManual(data, results);
    } catch {
      isProcessing.current = false;
      stopScanner();
      router.replace({ pathname: '/(tabs)/add/manual' as any, params: { destination, barcode: data } });
    }
  };

  useEffect(() => {
    let cancelled = false;
    let animFrameId: number;
    let stream: MediaStream | null = null;

    async function start() {
      try {
        const {
          MultiFormatReader,
          BarcodeFormat,
          DecodeHintType,
          BinaryBitmap,
          HybridBinarizer,
        } = await import('@zxing/library');

        const { HTMLCanvasElementLuminanceSource } = await import('@zxing/browser');

        if (cancelled) return;

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.EAN_8,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const reader = new MultiFormatReader();
        reader.setHints(hints);

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        // Create and attach video element to container div
        const container = document.getElementById(CONTAINER_ID);
        if (!container) throw new Error('No container');

        const video = document.createElement('video');
        video.setAttribute('playsinline', 'true');
        video.setAttribute('muted', 'true');
        video.setAttribute('autoplay', 'true');
        video.style.cssText = 'width:100%;height:100%;object-fit:cover;';
        video.srcObject = stream;
        container.appendChild(video);

        await video.play();
        if (cancelled) return;

        setStatus('scanning');

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        function scanFrame() {
          if (cancelled) return;
          try {
            if (!isProcessing.current && video.readyState >= 2 && video.videoWidth > 0 && ctx) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              ctx.drawImage(video, 0, 0);
              try {
                const luminance = new HTMLCanvasElementLuminanceSource(canvas);
                const bitmap = new BinaryBitmap(new HybridBinarizer(luminance));
                const result = reader.decode(bitmap);
                const text = result.getText();
                if (text === lastRead.current.value) {
                  lastRead.current.count += 1;
                } else {
                  lastRead.current = { value: text, count: 1 };
                }
                if (lastRead.current.count >= 3) {
                  lastRead.current = { value: '', count: 0 };
                  handleBarcodeScanned(text);
                  return;
                }
              } catch { /* no barcode in frame */ }
            }
          } catch { /* loop error */ }
          animFrameId = requestAnimationFrame(scanFrame);
        }

        animFrameId = requestAnimationFrame(scanFrame);

        cleanupRef.current = () => {
          cancelled = true;
          cancelAnimationFrame(animFrameId);
          stream?.getTracks().forEach((t) => t.stop());
          if (container.contains(video)) container.removeChild(video);
        };

      } catch {
        if (!cancelled) setStatus('denied');
      }
    }

    start();

    return () => {
      cancelled = true;
      cleanupRef.current?.();
      if (stream) stream.getTracks().forEach((t) => t.stop());
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* @ts-ignore */}
      <div id={CONTAINER_ID} style={{ width: '100%', height: '100%' }} />

      {status === 'loading' && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Starting camera…</Text>
        </View>
      )}

      {status === 'denied' && (
        <View style={[styles.overlay, styles.deniedBg]}>
          <Ionicons name="camera-outline" size={64} color="#888" />
          <Text style={styles.permissionText}>Camera access is needed to scan barcodes</Text>
          <TouchableOpacity
            style={styles.manualLink}
            onPress={() => router.push({ pathname: '/add/manual', params: { destination } })}
          >
            <Text style={styles.manualLinkText}>Enter manually instead</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === 'scanning' && (
        <>
          <View style={styles.scanOverlay} pointerEvents="none">
            <View style={styles.scanWindow} />
            <Text style={styles.scanHint}>Point at a barcode</Text>
          </View>

          {duplicate && (
            <View style={styles.dupeOverlay}>
              <Text style={styles.dupeTitle}>Already in your {destination === 'wishlist' ? 'Wish List' : 'Collection'}</Text>
              <Text style={styles.dupeMsg}>"{duplicate.title}" by {duplicate.artist}</Text>
              <View style={styles.dupeActions}>
                <TouchableOpacity style={styles.dupeCancel} onPress={() => {
                  setDuplicate(null);
                  setScanned(false);
                  isProcessing.current = false;
                  lastRead.current = { value: '', count: 0 };
                }}>
                  <Text style={styles.dupeCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dupeAdd} onPress={() => {
                  const { data, results } = duplicate;
                  setDuplicate(null);
                  isProcessing.current = false;
                  navigateToManual(data, results);
                }}>
                  <Text style={styles.dupeAddText}>Add Anyway</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <SafeAreaView style={styles.actionsOverlay} edges={['bottom']}>
            <View style={styles.bottomActions}>
              {scanned && !duplicate && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => {
                    setScanned(false);
                    isProcessing.current = false;
                    lastRead.current = { value: '', count: 0 };
                  }}
                >
                  <Text style={styles.actionBtnText}>Scan Again</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.manualBtn}
                onPress={() => { stopScanner(); router.replace({ pathname: '/(tabs)/add/manual' as any, params: { destination } }); }}
              >
                <Text style={styles.manualBtnText}>Can't scan? Enter manually</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32,
  },
  deniedBg: { backgroundColor: '#F2F2F7' },
  loadingText: { color: '#fff', fontSize: 15, opacity: 0.8 },
  permissionText: { fontSize: 16, color: '#444', textAlign: 'center' },
  manualLink: { padding: 8 },
  manualLinkText: { color: '#007AFF', fontSize: 15 },
  scanOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  scanWindow: { width: 280, height: 120, borderWidth: 2, borderColor: '#fff', borderRadius: 8 },
  scanHint: { color: '#fff', fontSize: 14, opacity: 0.8 },
  actionsOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  bottomActions: { padding: 24, gap: 12, alignItems: 'center' },
  actionBtn: { backgroundColor: '#007AFF', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12 },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  manualBtn: { padding: 8 },
  manualBtnText: { color: '#fff', fontSize: 15, opacity: 0.8 },
  dupeOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center',
    padding: 32, gap: 12,
  },
  dupeTitle: { color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  dupeMsg: { color: 'rgba(255,255,255,0.8)', fontSize: 15, textAlign: 'center' },
  dupeActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  dupeCancel: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  dupeCancelText: { color: '#fff', fontSize: 16 },
  dupeAdd: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, backgroundColor: '#007AFF' },
  dupeAddText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

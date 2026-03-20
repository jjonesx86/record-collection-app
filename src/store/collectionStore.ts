import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VinylRecord } from '../types';

interface CollectionState {
  records: VinylRecord[];
  lastFetched: number | null;
  isLoading: boolean;
  error: string | null;
  collectionName: string;
  profileImageUri: string | null;

  setRecords: (records: VinylRecord[]) => void;
  addRecord: (record: VinylRecord) => void;
  updateRecord: (id: string, updates: Partial<VinylRecord>) => void;
  removeRecord: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastFetched: (timestamp: number) => void;
  setCollectionName: (name: string) => void;
  setProfileImageUri: (uri: string | null) => void;

  hasDuplicate: (artist: string, album: string, excludeId?: string) => boolean;
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      records: [],
      lastFetched: null,
      isLoading: false,
      error: null,
      collectionName: 'Jones Record Collection',
      profileImageUri: null,

      setRecords: (records) =>
        set({ records: [...records].sort((a, b) => a.artist.localeCompare(b.artist)) }),

      addRecord: (record) =>
        set((state) => ({
          records: [...state.records, record].sort((a, b) => a.artist.localeCompare(b.artist)),
        })),

      updateRecord: (id, updates) =>
        set((state) => ({
          records: state.records.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),

      removeRecord: (id) =>
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
        })),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setLastFetched: (lastFetched) => set({ lastFetched }),
      setCollectionName: (collectionName) => set({ collectionName }),
      setProfileImageUri: (profileImageUri) => set({ profileImageUri }),

      hasDuplicate: (artist, album, excludeId) => {
        const lArtist = artist.toLowerCase().trim();
        const lAlbum = album.toLowerCase().trim();
        return get().records.some(
          (r) =>
            r.id !== excludeId &&
            r.artist.toLowerCase().trim() === lArtist &&
            r.album.toLowerCase().trim() === lAlbum
        );
      },
    }),
    {
      name: 'record-collection-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

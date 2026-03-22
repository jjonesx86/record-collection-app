import { useCallback } from 'react';
import { InteractionManager } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useCollectionStore } from '../store/collectionStore';
import { fetchAllRecords, getCurrentUser } from '../services/supabase';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function useCollection() {
  // Targeted selectors — only re-renders when these specific values change
  const records = useCollectionStore((s) => s.records);
  const isLoading = useCollectionStore((s) => s.isLoading);
  const error = useCollectionStore((s) => s.error);

  const refresh = useCallback(async () => {
    const user = await getCurrentUser();
    if (!user) return;
    // Use getState() for writes so this callback never holds stale references
    useCollectionStore.getState().setLoading(true);
    useCollectionStore.getState().setError(null);
    try {
      const data = await fetchAllRecords();
      useCollectionStore.getState().setRecords(data);
      useCollectionStore.getState().setLastFetched(Date.now());
    } catch (e) {
      useCollectionStore.getState().setError(e instanceof Error ? e.message : 'Failed to load collection');
    } finally {
      useCollectionStore.getState().setLoading(false);
    }
  }, []);

  // useFocusEffect ensures this only runs when collection/index is the active screen,
  // preventing background store updates (and their JS re-renders) from firing while
  // the user is on social/settings — which was freezing navigation input.
  // InteractionManager defers the fetch until any in-progress navigation animation completes.
  useFocusEffect(
    useCallback(() => {
      const { lastFetched, isLoading: loading } = useCollectionStore.getState();
      const isStale = !lastFetched || Date.now() - lastFetched > CACHE_TTL_MS;
      if (isStale && !loading) {
        const task = InteractionManager.runAfterInteractions(() => {
          refresh();
        });
        return () => task.cancel();
      }
    }, [refresh])
  );

  return { records, isLoading, error, refresh };
}

import { useEffect, useCallback } from 'react';
import { useCollectionStore } from '../store/collectionStore';
import { fetchAllRecords } from '../services/supabase';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function useCollection() {
  const store = useCollectionStore();

  const refresh = useCallback(async () => {
    store.setLoading(true);
    store.setError(null);
    try {
      const records = await fetchAllRecords();
      store.setRecords(records);
      store.setLastFetched(Date.now());
    } catch (e) {
      store.setError(e instanceof Error ? e.message : 'Failed to load collection');
    } finally {
      store.setLoading(false);
    }
  }, []);

  useEffect(() => {
    const isStale =
      !store.lastFetched || Date.now() - store.lastFetched > CACHE_TTL_MS;

    if (isStale && !store.isLoading) {
      refresh();
    }
  }, []);

  return {
    records: store.records,
    isLoading: store.isLoading,
    error: store.error,
    refresh,
  };
}

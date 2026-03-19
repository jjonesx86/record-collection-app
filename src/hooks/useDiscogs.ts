import { useState, useCallback } from 'react';
import { searchDiscogs, lookupByBarcode } from '../services/discogs';
import { DiscogsResult } from '../types';

export function useDiscogs() {
  const [results, setResults] = useState<DiscogsResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const search = useCallback((artist: string, album: string) => {
    if (!artist.trim() && !album.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    searchDiscogs(
      { artist: artist || undefined, album: album || undefined },
      (res, err) => {
        setIsSearching(false);
        if (err) {
          setSearchError(err);
        } else {
          setResults(res);
        }
      }
    );
  }, []);

  const scanBarcode = useCallback(async (barcode: string): Promise<DiscogsResult[]> => {
    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await lookupByBarcode(barcode);
      setResults(res);
      return res;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Barcode lookup failed';
      setSearchError(msg);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setSearchError(null);
  }, []);

  return { results, isSearching, searchError, search, scanBarcode, clearResults };
}

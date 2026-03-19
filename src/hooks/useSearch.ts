import { useMemo, useState } from 'react';
import Fuse, { IFuseOptions } from 'fuse.js';
import { VinylRecord } from '../types';

const FUSE_OPTIONS: IFuseOptions<VinylRecord> = {
  keys: [
    { name: 'artist', weight: 0.5 },
    { name: 'album', weight: 0.4 },
    { name: 'genre', weight: 0.1 },
  ],
  threshold: 0.3,
  includeScore: true,
};

export function useSearch(records: VinylRecord[]) {
  const [query, setQuery] = useState('');

  const fuse = useMemo(() => new Fuse(records, FUSE_OPTIONS), [records]);

  const results = useMemo(() => {
    if (!query.trim()) return records;
    return fuse.search(query).map((r) => r.item);
  }, [query, fuse, records]);

  return { query, setQuery, results };
}

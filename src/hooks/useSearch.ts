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

interface ParsedQuery {
  artist?: string;
  album?: string;
  term?: string; // extracted term when intent is clear but role (artist vs album) is ambiguous
}

/**
 * Detects natural language patterns and extracts structured search intent.
 * Returns null if the input looks like a plain keyword search.
 */
function parseNaturalLanguage(raw: string): ParsedQuery | null {
  let text = raw.trim();

  // Strip leading filler phrases
  text = text.replace(
    /^(do (we|you|i) have|show me( all( of my)?| my)?|have (we|you|i) got|is there|any)\s+/i,
    ''
  );
  // Strip secondary filler words that may remain (e.g. "do we have any X" → "any X" → "X")
  text = text.replace(/^(any|some|all|our( of my| my)?)\s+/i, '');

  // Nothing useful left after stripping
  if (!text) return null;

  // "albums by [artist]" — e.g. "albums by the Beach Boys" → artist only
  const albumsByMatch = text.match(/^albums?\s+by\s+(.+)$/i);
  if (albumsByMatch) {
    return { artist: albumsByMatch[1].trim() };
  }

  // "[album] by [artist]"
  const byMatch = text.match(/^(.+?)\s+by\s+(.+)$/i);
  if (byMatch) {
    const leftSide = byMatch[1].replace(/\s+(albums?|records?|vinyls?|lps?)$/i, '').trim();
    // If nothing meaningful remains on the left, treat as artist-only
    if (!leftSide || /^(our|my|the|all|any|some)$/i.test(leftSide)) {
      return { artist: byMatch[2].trim() };
    }
    return { album: leftSide, artist: byMatch[2].trim() };
  }

  // "all [artist] albums/records/vinyls" / "[artist] albums" / "any [artist]"
  const artistAlbumMatch = text.match(/^(.+?)\s+(albums?|records?|vinyls?|lps?)$/i);
  if (artistAlbumMatch) {
    return { artist: artistAlbumMatch[1].trim() };
  }

  // If filler was stripped and something remains, treat it as an ambiguous term
  if (text.length < raw.trim().length) {
    return { term: text };
  }

  // Looks like a plain keyword — let Fuse handle it
  return null;
}

function contains(value: string, search: string): boolean {
  return value.toLowerCase().includes(search.toLowerCase());
}

export function useSearch(records: VinylRecord[]) {
  const [query, setQuery] = useState('');

  const fuse = useMemo(() => new Fuse(records, FUSE_OPTIONS), [records]);

  const results = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return records;

    const parsed = parseNaturalLanguage(trimmed);

    if (parsed) {
      const { artist, album, term } = parsed;

      if (artist && album) {
        return records.filter(
          (r) => contains(r.artist, artist) && contains(r.album, album)
        );
      }
      if (artist) {
        return records.filter((r) => contains(r.artist, artist));
      }
      if (album) {
        return records.filter((r) => contains(r.album, album));
      }
      if (term) {
        return fuse.search(term).map((r) => r.item);
      }
    }

    return fuse.search(trimmed).map((r) => r.item);
  }, [query, fuse, records]);

  return { query, setQuery, results };
}

import { DiscogsResult, DiscogsSearchResponse, DiscogsRawResult } from '../types';

const BASE_URL = 'https://api.discogs.com';
const TOKEN = process.env.EXPO_PUBLIC_DISCOGS_TOKEN ?? '';
const USER_AGENT = 'RecordCollectionApp/1.0';

const HEADERS = {
  'User-Agent': USER_AGENT,
  'Authorization': `Discogs token=${TOKEN}`,
};

function isValidArtUrl(url?: string): boolean {
  if (!url) return false;
  if (!url.startsWith('https://')) return false;
  if (url.includes('spacer')) return false;
  if (url.includes('no-image')) return false;
  return true;
}

function parseCoverImage(result: DiscogsRawResult): string | undefined {
  if (isValidArtUrl(result.cover_image)) return result.cover_image;
  if (isValidArtUrl(result.thumb)) return result.thumb;
  return undefined;
}

function normalizeSearchTerm(term: string): string {
  return term
    .toLowerCase()
    .trim()
    // Remove trailing ", The" / ", A" / ", An" that some databases append
    .replace(/,\s+(the|a|an)$/i, '')
    // Strip characters that confuse Discogs search
    .replace(/['"]/g, '')
    .trim();
}

function parseArtistFromTitle(title: string): { artist: string; album: string } {
  const separatorIndex = title.indexOf(' - ');
  if (separatorIndex !== -1) {
    return {
      artist: title.substring(0, separatorIndex).trim(),
      album: title.substring(separatorIndex + 3).trim(),
    };
  }
  return { artist: '', album: title.trim() };
}

function mapResult(raw: DiscogsRawResult): DiscogsResult {
  const { artist, album } = parseArtistFromTitle(raw.title);
  const cover = parseCoverImage(raw);

  return {
    id: raw.id,
    title: album || raw.title,
    artist,
    year: raw.year ? parseInt(raw.year, 10) : undefined,
    label: raw.label?.[0],
    thumb: raw.thumb,
    cover_image: cover,
    genre: raw.genre,
    style: raw.style,
    discogs_id: String(raw.id),
  };
}

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { headers: HEADERS, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchSearch(params: URLSearchParams): Promise<DiscogsResult[]> {
  const response = await fetchWithTimeout(`${BASE_URL}/database/search?${params}`);
  if (!response.ok) throw new Error(`Discogs error: ${response.status}`);
  const data: DiscogsSearchResponse = await response.json();
  return data.results.map(mapResult);
}

async function searchWithVinylFallback(query: { artist?: string; album?: string }): Promise<DiscogsResult[]> {
  const artist = query.artist ? normalizeSearchTerm(query.artist) : undefined;
  const album = query.album ? normalizeSearchTerm(query.album) : undefined;

  function buildParams(extra: Record<string, string>): URLSearchParams {
    const p = new URLSearchParams({ type: 'release', ...extra });
    if (artist) p.set('artist', artist);
    if (album) p.set('release_title', album);
    return p;
  }

  // 1. US vinyl pressings first
  const usVinyl = await fetchSearch(buildParams({ format: 'Vinyl', country: 'US' }));
  if (usVinyl.length > 0) return usVinyl;

  // 2. Any country vinyl
  const anyVinyl = await fetchSearch(buildParams({ format: 'Vinyl' }));
  if (anyVinyl.length > 0) return anyVinyl;

  // 3. Any format (some vinyl releases are miscategorised on Discogs)
  return fetchSearch(buildParams({}));
}

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export function searchDiscogs(
  query: { artist?: string; album?: string },
  callback: (results: DiscogsResult[], error?: string) => void,
  debounceMs = 600
): void {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);

  searchDebounceTimer = setTimeout(async () => {
    try {
      const results = await searchWithVinylFallback(query);
      callback(results);
    } catch (e) {
      callback([], e instanceof Error ? e.message : 'Search failed');
    }
  }, debounceMs);
}

export async function searchDiscogsImmediate(query: { artist?: string; album?: string }): Promise<DiscogsResult[]> {
  return searchWithVinylFallback(query);
}

export async function lookupByBarcode(barcode: string): Promise<DiscogsResult[]> {
  const params = new URLSearchParams({ barcode, type: 'release', format: 'Vinyl' });
  const results = await fetchSearch(params);
  if (results.length > 0) return results;

  // Retry without format filter
  const broad = new URLSearchParams({ barcode, type: 'release' });
  return fetchSearch(broad);
}

/**
 * Best-effort album art lookup: searches Discogs, and if the search result
 * has no usable image, fetches the full release to get the real artwork.
 */
export async function findAlbumArt(query: { artist: string; album: string }): Promise<string | undefined> {
  const results = await searchWithVinylFallback(query);
  if (results.length === 0) return undefined;

  // Check the first several results — the top result often has no cover but later ones do
  const candidates = results.slice(0, 5);
  const withCover = candidates.find((r) => r.cover_image);
  if (withCover?.cover_image) return withCover.cover_image;

  // None had a usable cover in search results — fetch full release details for the best match
  const best = candidates[0];
  if (best.discogs_id) {
    try {
      const details = await fetchReleaseDetails(best.discogs_id);
      if (details.cover_image) return details.cover_image;
    } catch {
      // ignore — fall through to thumb
    }
  }

  return best.thumb ?? undefined;
}

export async function fetchReleaseDetails(discogsId: string): Promise<{ artist: string; label?: string; year?: number; cover_image?: string }> {
  const response = await fetchWithTimeout(`${BASE_URL}/releases/${discogsId}`);

  if (!response.ok) throw new Error(`Discogs error: ${response.status}`);

  const data = await response.json();
  return {
    artist: data.artists?.[0]?.name ?? '',
    label: data.labels?.[0]?.name,
    year: data.year,
    cover_image: isValidArtUrl(data.images?.[0]?.uri) ? data.images[0].uri : undefined,
  };
}

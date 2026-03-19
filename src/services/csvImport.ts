import Papa from 'papaparse';
import { VinylRecord } from '../types';

interface CsvRow {
  Artist?: string;
  artist?: string;
  Album?: string;
  album?: string;
  Genre?: string;
  genre?: string;
  'Album Art'?: string;
  album_art?: string;
  album_art_url?: string;
}

export interface ImportPreview {
  records: Omit<VinylRecord, 'id' | 'created_at' | 'updated_at'>[];
  total: number;
  errors: string[];
}

export function parseCsv(csvText: string): ImportPreview {
  const errors: string[] = [];

  const result = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (result.errors.length > 0) {
    errors.push(...result.errors.map((e) => `Row ${e.row}: ${e.message}`));
  }

  const records: Omit<VinylRecord, 'id' | 'created_at' | 'updated_at'>[] = [];

  for (const row of result.data) {
    const artist = (row.Artist ?? row.artist ?? '').trim();
    const album = (row.Album ?? row.album ?? '').trim();

    if (!artist || !album) continue;

    const albumArtUrl = (
      row['Album Art'] ??
      row.album_art ??
      row.album_art_url ??
      ''
    ).trim();

    records.push({
      artist,
      album,
      genre: (row.Genre ?? row.genre ?? '').trim() || undefined,
      album_art_url: albumArtUrl || undefined,
    });
  }

  return { records, total: records.length, errors };
}

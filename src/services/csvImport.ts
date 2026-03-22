import Papa from 'papaparse';
import { VinylRecord } from '../types';

interface CsvRow {
  Artist?: string;
  artist?: string;
  Album?: string;
  album?: string;
  Genre?: string;
  genre?: string;
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

  let skippedRows = 0;
  for (const row of result.data) {
    const artist = (row.Artist ?? row.artist ?? '').trim();
    const album = (row.Album ?? row.album ?? '').trim();

    if (!artist || !album) { skippedRows++; continue; }

    records.push({
      artist,
      album,
      genre: (row.Genre ?? row.genre ?? '').trim() || undefined,
    });
  }

  if (skippedRows > 0) {
    errors.push(`${skippedRows} row${skippedRows !== 1 ? 's' : ''} skipped (missing Artist or Album).`);
  }

  return { records, total: records.length, errors };
}

import { createClient } from '@supabase/supabase-js';
import { VinylRecord } from '../types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

let _client: ReturnType<typeof createClient> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any {
  if (!_client) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase env vars. Check your .env file.');
    }
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _client;
}

export async function fetchAllRecords(): Promise<VinylRecord[]> {
  const { data, error } = await db()
    .from('records')
    .select('*')
    .order('artist', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function insertRecord(record: Omit<VinylRecord, 'id' | 'created_at' | 'updated_at'>): Promise<VinylRecord> {
  const { data, error } = await db()
    .from('records')
    .insert(record)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRecord(id: string, updates: Partial<VinylRecord>): Promise<VinylRecord> {
  const { data, error } = await db()
    .from('records')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRecord(id: string): Promise<void> {
  const { error } = await db()
    .from('records')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

function toErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === 'object' && 'message' in e) return String((e as any).message);
  return JSON.stringify(e);
}

export async function upsertRecords(records: Omit<VinylRecord, 'id' | 'created_at' | 'updated_at'>[]): Promise<number> {
  const CHUNK_SIZE = 50;
  let totalInserted = 0;

  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE);
    const { data, error } = await db()
      .from('records')
      .insert(chunk)
      .select('id');

    if (!error) {
      totalInserted += data?.length ?? 0;
      continue;
    }

    // 23505 = unique_violation — chunk had duplicates, retry one-by-one
    if (error.code?.includes('23505')) {
      for (const row of chunk) {
        const { data: single, error: singleError } = await db()
          .from('records')
          .insert(row)
          .select('id')
          .single();
        if (!singleError) totalInserted += 1;
        else if (!singleError.code?.includes('23505')) {
          throw new Error(toErrorMessage(singleError));
        }
      }
    } else {
      throw new Error(toErrorMessage(error));
    }
  }

  return totalInserted;
}

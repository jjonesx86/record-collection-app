import { createClient, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { readAsBase64 } from './fileSystem';
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
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: Platform.OS === 'web' ? undefined : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    });
  }
  return _client;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string) {
  const { data, error } = await db().auth.signUp({ email, password });
  if (error) throw error;
  const user = data.user;
  if (user) {
    // Create profile row (ignore conflict if it already exists)
    await db()
      .from('user_profiles')
      .insert({ user_id: user.id })
      .select()
      .maybeSingle();
  }
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await db().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await db().auth.signOut();
  if (error) throw error;
}

export async function updateEmail(email: string): Promise<void> {
  const { error } = await db().auth.updateUser({ email });
  if (error) throw error;
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await db().auth.updateUser({ password });
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await db().auth.getUser();
  return user;
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
) {
  return db().auth.onAuthStateChange(callback);
}

// ── User profile ──────────────────────────────────────────────────────────────

export interface UserProfile {
  collection_name: string;
  profile_image_url: string | null;
}

export interface PublicProfile {
  user_id: string;
  collection_name: string;
  profile_image_url: string | null;
}

export async function fetchAllProfiles(): Promise<PublicProfile[]> {
  const { data, error } = await db()
    .from('user_profiles')
    .select('user_id, collection_name, profile_image_url')
    .order('collection_name');
  if (error) throw error;
  return data ?? [];
}

export async function fetchRecordsByUser(userId: string): Promise<VinylRecord[]> {
  const { data, error } = await db()
    .from('records')
    .select('*')
    .eq('user_id', userId)
    .order('artist');
  if (error) throw error;
  return data ?? [];
}

export async function fetchUserProfile(): Promise<UserProfile | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data, error } = await db()
    .from('user_profiles')
    .select('collection_name, profile_image_url')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await db()
    .from('user_profiles')
    .upsert({ user_id: user.id, ...updates, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function uploadProfileImage(uri: string): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const base64 = await readAsBase64(uri);

  // Decode base64 to ArrayBuffer
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i);
  }

  const path = `${user.id}/profile.jpg`;
  const { error } = await db()
    .storage
    .from('profile-images')
    .upload(path, buffer, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;

  const { data } = db().storage.from('profile-images').getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

// ── Records ───────────────────────────────────────────────────────────────────

export async function fetchAllRecords(): Promise<VinylRecord[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const { data, error } = await db()
    .from('records')
    .select('*')
    .eq('user_id', user.id)
    .order('artist', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function insertRecord(record: Omit<VinylRecord, 'id' | 'created_at' | 'updated_at'>): Promise<VinylRecord> {
  const user = await getCurrentUser();
  const { data, error } = await db()
    .from('records')
    .insert({ ...record, user_id: user?.id })
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

export async function moveToCollection(id: string): Promise<VinylRecord> {
  return updateRecord(id, { is_wishlist: false });
}

export async function deleteRecord(id: string): Promise<void> {
  const { error } = await db()
    .from('records')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function deleteAllUserRecords(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await db()
    .from('records')
    .delete()
    .eq('user_id', user.id);
  if (error) throw error;
}

function toErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === 'object' && 'message' in e) return String((e as any).message);
  return JSON.stringify(e);
}

export async function upsertRecords(records: Omit<VinylRecord, 'id' | 'created_at' | 'updated_at'>[]): Promise<number> {
  const user = await getCurrentUser();
  const userId = user?.id;

  const CHUNK_SIZE = 50;
  let totalInserted = 0;

  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE).map((r) => ({ ...r, user_id: userId }));
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

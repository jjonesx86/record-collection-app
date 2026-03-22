-- Migration: add multi-user support
-- Run this once in Supabase SQL Editor against an existing database.

-- 1. Add user_id column to records (nullable for existing rows)
alter table records add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- 2. Drop the old global unique index, replace with per-user unique index
drop index if exists records_artist_album_unique;
create unique index if not exists records_user_artist_album_unique
  on records (user_id, lower(artist), lower(album));

-- 3. Drop the open "allow all" policy, add per-user policies
drop policy if exists "allow all" on records;
create policy "select own records" on records for select using (auth.uid() = user_id);
create policy "insert own records" on records for insert with check (auth.uid() = user_id);
create policy "update own records" on records for update using (auth.uid() = user_id);
create policy "delete own records" on records for delete using (auth.uid() = user_id);

-- 4. Create user_profiles table
create table if not exists user_profiles (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  collection_name    text not null default 'My Record Collection',
  profile_image_url  text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

alter table user_profiles enable row level security;
create policy "select own profile" on user_profiles for select using (auth.uid() = user_id);
create policy "insert own profile" on user_profiles for insert with check (auth.uid() = user_id);
create policy "update own profile" on user_profiles for update using (auth.uid() = user_id);

-- 5. Create profile-images storage bucket
-- Run this in the Supabase dashboard: Storage → New bucket → "profile-images" → Public
-- Or via SQL:
insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload their own images
create policy "upload own profile image" on storage.objects
  for insert with check (
    bucket_id = 'profile-images' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "update own profile image" on storage.objects
  for update using (
    bucket_id = 'profile-images' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public read for profile images
create policy "public read profile images" on storage.objects
  for select using (bucket_id = 'profile-images');

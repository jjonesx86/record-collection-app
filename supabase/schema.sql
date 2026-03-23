-- Enable trigram extension for fuzzy search
create extension if not exists pg_trgm;

create table if not exists records (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade,
  artist         text not null,
  album          text not null,
  genre          text,
  album_art_url  text,
  discogs_id     text,
  year           integer,
  label          text,
  is_wishlist    boolean not null default false,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- Trigram indexes for partial-match search
create index if not exists records_artist_trgm on records using gin (artist gin_trgm_ops);
create index if not exists records_album_trgm  on records using gin (album  gin_trgm_ops);
create index if not exists records_genre_trgm  on records using gin (genre  gin_trgm_ops);

-- Per-user unique constraint for duplicate detection (includes is_wishlist so same album can exist in both)
create unique index if not exists records_user_artist_album_wishlist_unique
  on records (user_id, lower(artist), lower(album), is_wishlist);

-- Auto-update updated_at on row changes
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger records_updated_at
  before update on records
  for each row execute function update_updated_at();

-- RLS: per-user policies
alter table records enable row level security;
create policy "select own records" on records for select using (auth.uid() = user_id);
create policy "insert own records" on records for insert with check (auth.uid() = user_id);
create policy "update own records" on records for update using (auth.uid() = user_id);
create policy "delete own records" on records for delete using (auth.uid() = user_id);

-- User profiles table
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

-- ── Migration: add wish list support (run in Supabase SQL Editor on existing DB) ──
-- ALTER TABLE records ADD COLUMN IF NOT EXISTS is_wishlist BOOLEAN NOT NULL DEFAULT false;
-- DROP INDEX IF EXISTS records_user_artist_album_unique;
-- CREATE UNIQUE INDEX IF NOT EXISTS records_user_artist_album_wishlist_unique
--   ON records (user_id, lower(artist), lower(album), is_wishlist);

-- Enable trigram extension for fuzzy search
create extension if not exists pg_trgm;

create table if not exists records (
  id             uuid primary key default gen_random_uuid(),
  artist         text not null,
  album          text not null,
  genre          text,
  album_art_url  text,
  discogs_id     text,
  year           integer,
  label          text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- Trigram indexes for partial-match search
create index if not exists records_artist_trgm on records using gin (artist gin_trgm_ops);
create index if not exists records_album_trgm  on records using gin (album  gin_trgm_ops);
create index if not exists records_genre_trgm  on records using gin (genre  gin_trgm_ops);

-- Unique constraint for duplicate detection and upsert
create unique index if not exists records_artist_album_unique
  on records (lower(artist), lower(album));

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

-- Allow full access via anon key (this is a personal app with no auth)
alter table records enable row level security;
create policy "allow all" on records for all using (true) with check (true);

export interface VinylRecord {
  id: string;
  artist: string;
  album: string;
  genre?: string;
  album_art_url?: string;
  discogs_id?: string;
  year?: number;
  label?: string;
  is_wishlist?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DiscogsResult {
  id: number;
  title: string;
  artist: string;
  year?: number;
  label?: string;
  thumb?: string;
  cover_image?: string;
  genre?: string[];
  style?: string[];
  discogs_id: string;
}

export interface DiscogsSearchResponse {
  results: DiscogsRawResult[];
  pagination: {
    page: number;
    pages: number;
    per_page: number;
    items: number;
  };
}

export interface DiscogsRawResult {
  id: number;
  title: string;
  year?: string;
  label?: string[];
  genre?: string[];
  style?: string[];
  thumb?: string;
  cover_image?: string;
  resource_url?: string;
  type: string;
}

import { CollectionState } from './collectionStore';

export const selectCollection = (s: CollectionState) =>
  s.records.filter((r) => !r.is_wishlist);

export const selectWishlist = (s: CollectionState) =>
  s.records.filter((r) => r.is_wishlist === true);

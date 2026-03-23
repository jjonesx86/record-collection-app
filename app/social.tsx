import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchAllProfiles, fetchRecordsByUser, getCurrentUser, PublicProfile } from '../src/services/supabase';
import { AlbumArtImage } from '../src/components/AlbumArtImage';
import { VinylRecord } from '../src/types';

export default function SocialScreen() {
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Which profiles are expanded
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // Tracks which user IDs have already been fetched (ref = synchronous, no re-render)
  const fetchedUsers = useRef<Set<string>>(new Set());
  // Per-user record cache
  const [recordsCache, setRecordsCache] = useState<Record<string, VinylRecord[]>>({});
  // Per-user loading state
  const [loadingUsers, setLoadingUsers] = useState<Set<string>>(new Set());
  // Per-user fetch errors
  const [userErrors, setUserErrors] = useState<Record<string, string>>({});
  // Per-user search queries
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});

  const [refreshing, setRefreshing] = useState(false);

  const loadProfiles = useCallback(async () => {
    const [allProfiles, user] = await Promise.all([fetchAllProfiles(), getCurrentUser()]);
    const sorted = [...allProfiles].sort((a, b) => {
      if (a.user_id === user?.id) return -1;
      if (b.user_id === user?.id) return 1;
      return (a.collection_name ?? '').localeCompare(b.collection_name ?? '');
    });
    setProfiles(sorted);
  }, []);

  useEffect(() => {
    loadProfiles()
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load collections'))
      .finally(() => setLoading(false));
  }, [loadProfiles]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Clear cache so expanded users are re-fetched
    fetchedUsers.current.clear();
    setRecordsCache({});
    setUserErrors({});
    try {
      await loadProfiles();
      // Re-fetch any currently expanded users
      const expandedIds = [...expanded];
      await Promise.all(
        expandedIds.map(async (userId) => {
          fetchedUsers.current.add(userId);
          try {
            const records = await fetchRecordsByUser(userId);
            setRecordsCache((prev) => ({ ...prev, [userId]: records }));
          } catch {
            fetchedUsers.current.delete(userId);
          }
        })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  }, [loadProfiles, expanded]);

  const handleToggle = useCallback(async (userId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) { next.delete(userId); } else { next.add(userId); }
      return next;
    });

    if (fetchedUsers.current.has(userId)) return;
    fetchedUsers.current.add(userId);

    setLoadingUsers((prev) => new Set(prev).add(userId));
    try {
      const records = await fetchRecordsByUser(userId);
      setRecordsCache((prev) => ({ ...prev, [userId]: records }));
    } catch (e) {
      fetchedUsers.current.delete(userId); // allow retry on next tap
      setUserErrors((prev) => ({ ...prev, [userId]: e instanceof Error ? e.message : 'Failed to load' }));
    } finally {
      setLoadingUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  }, []);

  const setSearch = (userId: string, query: string) => {
    setSearchQueries((prev) => ({ ...prev, [userId]: query }));
  };

  const getFilteredRecords = (userId: string): VinylRecord[] => {
    const records = recordsCache[userId] ?? [];
    const q = (searchQueries[userId] ?? '').trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (r) =>
        r.artist.toLowerCase().includes(q) ||
        r.album.toLowerCase().includes(q) ||
        (r.genre ?? '').toLowerCase().includes(q)
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        keyboardDismissMode="interactive"
      >
        {profiles.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No collections found.</Text>
          </View>
        ) : (
          profiles.map((profile) => {
            const isExpanded = expanded.has(profile.user_id);
            const isLoadingRecords = loadingUsers.has(profile.user_id);
            const filteredRecords = getFilteredRecords(profile.user_id);
            const allRecords = recordsCache[profile.user_id];
            const collectionCount = allRecords?.filter((r) => !r.is_wishlist).length;
            const wishlistCount = allRecords?.filter((r) => r.is_wishlist).length;

            const wishlistFiltered = filteredRecords.filter((r) => r.is_wishlist);
            const collectionFiltered = filteredRecords.filter((r) => !r.is_wishlist);

            return (
              <View key={profile.user_id} style={styles.profileCard}>
                {/* ── Profile header row ── */}
                <TouchableOpacity
                  style={styles.profileHeader}
                  onPress={() => handleToggle(profile.user_id)}
                  activeOpacity={0.7}
                >
                  {profile.profile_image_url ? (
                    <Image source={{ uri: profile.profile_image_url }} style={styles.profileImage} />
                  ) : (
                    <View style={styles.profilePlaceholder}>
                      <Ionicons name="person" size={18} color="#888" />
                    </View>
                  )}
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{profile.collection_name}</Text>
                    {allRecords !== undefined && (
                      <Text style={styles.profileCount}>
                        {collectionCount} record{collectionCount !== 1 ? 's' : ''}
                        {wishlistCount != null && wishlistCount > 0
                          ? ` · ${wishlistCount} wished`
                          : ''}
                      </Text>
                    )}
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#C7C7CC"
                  />
                </TouchableOpacity>

                {/* ── Expanded records ── */}
                {isExpanded && (
                  <View style={styles.recordsContainer}>
                    {isLoadingRecords ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color="#007AFF" />
                      </View>
                    ) : userErrors[profile.user_id] ? (
                      <Text style={[styles.emptyText, styles.fetchError]}>
                        Could not load collection.
                      </Text>
                    ) : (
                      <>
                        <View style={styles.searchRow}>
                          <Ionicons name="search" size={15} color="#AAA" style={styles.searchIcon} />
                          <TextInput
                            style={styles.searchInput}
                            value={searchQueries[profile.user_id] ?? ''}
                            onChangeText={(q) => setSearch(profile.user_id, q)}
                            placeholder="Search this collection…"
                            placeholderTextColor="#AAA"
                            autoCorrect={false}
                            clearButtonMode="while-editing"
                          />
                        </View>

                        {filteredRecords.length === 0 ? (
                          <Text style={styles.emptyText}>
                            {searchQueries[profile.user_id] ? 'No matches.' : 'No records yet.'}
                          </Text>
                        ) : (
                          <>
                            {/* Wish list section — shown first */}
                            {wishlistFiltered.length > 0 && (
                              <>
                                <View style={styles.subHeader}>
                                  <Ionicons name="gift-outline" size={13} color="#F5A623" />
                                  <Text style={styles.subHeaderWishlist}>Wish List</Text>
                                </View>
                                {wishlistFiltered.map((record) => (
                                  <View key={record.id} style={styles.recordRow}>
                                    <AlbumArtImage uri={record.album_art_url} size={44} />
                                    <View style={styles.recordInfo}>
                                      <Text style={styles.recordAlbum} numberOfLines={1}>{record.album}</Text>
                                      <Text style={styles.recordArtist} numberOfLines={1}>{record.artist}</Text>
                                      {record.genre ? (
                                        <Text style={styles.recordGenre} numberOfLines={1}>{record.genre}</Text>
                                      ) : null}
                                    </View>
                                  </View>
                                ))}
                              </>
                            )}

                            {/* Collection section */}
                            {collectionFiltered.length > 0 && (
                              <>
                                <View style={styles.subHeader}>
                                  <Ionicons name="disc-outline" size={13} color="#8E8E93" />
                                  <Text style={styles.subHeaderCollection}>Collection</Text>
                                </View>
                                {collectionFiltered.map((record) => (
                                  <View key={record.id} style={styles.recordRow}>
                                    <AlbumArtImage uri={record.album_art_url} size={44} />
                                    <View style={styles.recordInfo}>
                                      <Text style={styles.recordAlbum} numberOfLines={1}>{record.album}</Text>
                                      <Text style={styles.recordArtist} numberOfLines={1}>{record.artist}</Text>
                                      {record.genre ? (
                                        <Text style={styles.recordGenre} numberOfLines={1}>{record.genre}</Text>
                                      ) : null}
                                    </View>
                                  </View>
                                ))}
                              </>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scroll: { padding: 16, paddingBottom: 48, gap: 12 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },

  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '600', color: '#111' },
  profileCount: { fontSize: 13, color: '#8E8E93', marginTop: 1 },

  recordsContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  loadingRow: { padding: 20, alignItems: 'center' },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    marginHorizontal: 12,
    marginVertical: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchIcon: { marginRight: 6 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111',
    paddingVertical: 8,
  },

  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  subHeaderWishlist: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F5A623',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  subHeaderCollection: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F2F2F7',
  },
  recordInfo: { flex: 1 },
  recordAlbum: { fontSize: 15, fontWeight: '600', color: '#111' },
  recordArtist: { fontSize: 13, color: '#444', marginTop: 1 },
  recordGenre: { fontSize: 12, color: '#8E8E93', marginTop: 1 },

  emptyText: { fontSize: 15, color: '#8E8E93', textAlign: 'center', padding: 20 },
  fetchError: { color: '#FF3B30' },
  errorText: { fontSize: 15, color: '#FF3B30', textAlign: 'center' },
});

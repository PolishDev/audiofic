import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Keyboard,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '@/shared';
import { useDebounce } from '../hooks/use-debounce';
import {
  fetchTopListenedStories,
  searchStories,
  type SearchStory,
} from '../services/search-api';
import { TopListenedItem } from '../components/top-listened-item';
import { SearchResultItem } from '../components/search-result-item';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function SearchPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Search input state
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 350);

  // Data states
  const [topListened, setTopListened] = useState<SearchStory[]>([]);
  const [searchResults, setSearchResults] = useState<SearchStory[]>([]);

  // Loading states
  const [isLoadingTop, setIsLoadingTop] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Abort controller ref to cancel obsolete network requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load Top 10 Most Listened stories
  const loadTopListened = useCallback(async () => {
    try {
      const data = await fetchTopListenedStories(10);
      setTopListened(data);
    } catch (err) {
      console.warn('[SearchPage] Error loading top stories:', err);
    } finally {
      setIsLoadingTop(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTopListened();
  }, [loadTopListened]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadTopListened();
  };

  // Perform search when debouncedQuery changes
  useEffect(() => {
    const trimmed = debouncedQuery.trim();

    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      return;
    }

    // Cancel previous ongoing search request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSearching(true);

    searchStories(trimmed, 20, controller.signal)
      .then((results) => {
        setSearchResults(results);
      })
      .catch((err) => {
        if (err?.name !== 'CanceledError') {
          console.warn('[SearchPage] Search error:', err);
        }
      })
      .finally(() => {
        setIsSearching(false);
      });

    return () => {
      controller.abort();
    };
  }, [debouncedQuery]);

  // Navigate to story details
  const handleOpenStory = (story: SearchStory) => {
    Keyboard.dismiss();
    router.push({
      pathname: '/story/[id]',
      params: { id: story.id },
    });
  };

  const handleClearQuery = () => {
    setQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  const isSearchActive = query.trim().length > 0;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ======================================================== */}
      {/* 1. CAMPO DE BUSCA FIXO NO TOPO COM TRATAMENTO E DEBOUNCE */}
      {/* ======================================================== */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.screenTitle}>Buscar</Text>
        </View>

        <View style={styles.searchBar}>
          <Ionicons
            name="search-outline"
            size={18}
            color={isSearchActive ? '#E11D48' : '#71717A'}
            style={styles.searchIcon}
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por título, história, terror..."
            placeholderTextColor="#71717A"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            selectionColor="#E11D48"
          />

          {isSearching ? (
            <ActivityIndicator size="small" color="#E11D48" style={styles.rightAction} />
          ) : isSearchActive ? (
            <TouchableOpacity
              onPress={handleClearQuery}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.rightAction}
            >
              <Ionicons name="close-circle" size={19} color="#71717A" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* ======================================================== */}
      {/* 2. CONTEÚDO: RESULTADOS DA BUSCA OU OS 10 MAIS OUVIDOS    */}
      {/* ======================================================== */}
      {isSearchActive ? (
        /* --- RESULTADOS DE BUSCA --- */
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {isSearching
                ? 'Buscando...'
                : searchResults.length > 0
                ? `Resultados (${searchResults.length})`
                : 'Nenhum resultado'}
            </Text>
            {debouncedQuery.trim().length > 0 && (
              <Text style={styles.sectionSubtitle} numberOfLines={1}>
                para "{debouncedQuery.trim()}"
              </Text>
            )}
          </View>

          {isSearching && searchResults.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#E11D48" />
              <Text style={styles.loadingText}>Procurando histórias...</Text>
            </View>
          ) : searchResults.length > 0 ? (
            searchResults.map((item) => (
              <SearchResultItem
                key={item.id}
                story={item}
                onPress={handleOpenStory}
              />
            ))
          ) : !isSearching ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="search-outline" size={32} color="#71717A" />
              </View>
              <Text style={styles.emptyTitle}>História não encontrada</Text>
              <Text style={styles.emptyDescription}>
                Não encontramos nada com "{query}". Tente buscar por outras palavras-chave ou confira os títulos mais ouvidos.
              </Text>
              <TouchableOpacity
                style={styles.clearSearchButton}
                activeOpacity={0.8}
                onPress={handleClearQuery}
              >
                <Text style={styles.clearSearchButtonText}>Ver Mais Ouvidos</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>
      ) : (
        /* --- LISTAGEM DOS 10 MAIS OUVIDOS --- */
        <FlatList
          data={topListened}
          keyExtractor={(item) => item.id}
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#E11D48"
              colors={['#E11D48']}
            />
          }
          ListHeaderComponent={
            <View style={styles.topHeader}>
              <View style={styles.topBadgeRow}>
                <Ionicons name="flame" size={18} color="#E11D48" />
                <Text style={styles.topBadgeTitle}>Top 10 Mais Ouvidos</Text>
              </View>
              <Text style={styles.topSubtitle}>
                As histórias e séries mais reproduzidas no ShortStory
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <TopListenedItem
              story={item}
              rank={index + 1}
              onPress={handleOpenStory}
            />
          )}
          ListEmptyComponent={
            isLoadingTop ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E11D48" />
                <Text style={styles.loadingText}>Carregando os mais ouvidos...</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="headset-outline" size={36} color="#52525B" />
                <Text style={styles.emptyTitle}>Nenhuma história disponível</Text>
                <Text style={styles.emptyDescription}>
                  Puxe para baixo para recarregar o catálogo.
                </Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140, // Espaço confortável para não colidir com o dock flutuante ou mini-player
  },

  // HEADER & SEARCH BAR
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: '#09090B',
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FAFAFA',
    letterSpacing: -0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    height: 46,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#FAFAFA',
    height: '100%',
  },
  rightAction: {
    padding: 4,
  },

  // SECTION HEADER
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FAFAFA',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#71717A',
    flex: 1,
  },

  // TOP 10 HEADER
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 4,
  },
  topBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topBadgeTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FAFAFA',
    letterSpacing: 0.2,
  },
  topSubtitle: {
    fontSize: 12,
    color: '#71717A',
  },

  // LOADING & EMPTY STATES
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#71717A',
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FAFAFA',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 13,
    color: '#71717A',
    textAlign: 'center',
    lineHeight: 18,
  },
  clearSearchButton: {
    marginTop: 8,
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    borderWidth: 1,
    borderColor: '#E11D48',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  clearSearchButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FDA4AF',
  },
});

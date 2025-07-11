import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';

// Import reusable UI components
import {
  Header,
  SearchBar,
  SearchResultsHeader,
  ArticleList
} from '../../components/ui';

// Import existing components
import CategoryTabs, { Category } from '../../components/CategoryTabs';

// Import services
import { fetchArticles, searchArticles, clearCategoryCache, preloadMultiplePages } from '../../services/api';

const CATEGORIES: Category[] = [
  { id: 1, name: 'Tin mới' },
  { id: 2, name: 'Thế giới' },
  { id: 3, name: 'Kinh tế' },
  { id: 4, name: 'Đời sống' },
  { id: 5, name: 'Sức khỏe' },
  { id: 6, name: 'Văn hóa' },
  { id: 7, name: 'Giải trí' },
  { id: 8, name: 'Thể thao' },
  { id: 9, name: 'Công nghệ' },
];

export default function HomeScreen() {
  // Category states
  const [selectedCategory, setSelectedCategory] = useState(1);
  const [articles, setArticles] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Search states
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isInSearchMode, setIsInSearchMode] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Navigation
  const router = useRouter();
  const navigation = useNavigation();

  // Load bài viết đầu tiên khi thay đổi category
  useEffect(() => {
    if (!isInSearchMode) {
      loadArticles(selectedCategory, 1, true);
    }
  }, [selectedCategory, isInSearchMode]);

  useEffect(() => {
    // @ts-ignore: tabPress is a valid event for bottom tabs
    const unsubscribe = navigation.addListener('tabPress', (e) => {
      // Only trigger if already focused
      if (navigation.isFocused && navigation.isFocused()) {
        onRefresh();
      }
    });
    return unsubscribe;
  }, [navigation, selectedCategory]);

  // Search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setIsInSearchMode(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchArticles(query);
      setSearchResults(results);
      setIsInSearchMode(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search submit
  const handleSearchSubmit = useCallback(() => {
    performSearch(searchQuery);
  }, [searchQuery, performSearch]);

  // Handle search clear
  const handleSearchClear = useCallback(() => {
    setIsInSearchMode(false);
    setSearchResults([]);
  }, []);

  // Toggle search visibility
  const toggleSearch = useCallback(() => {
    if (isSearchVisible) {
      setIsSearchVisible(false);
      setSearchQuery('');
      setIsInSearchMode(false);
      setSearchResults([]);
    } else {
      setIsSearchVisible(true);
    }
  }, [isSearchVisible]);

  // Hàm load bài viết với cache
  const loadArticles = useCallback(async (category_id: number, page: number, resetList: boolean = false) => {
    if (resetList) {
      setLoading(true);
      setError(null);
      setCurrentPage(1);
      setHasMore(true);
    }

    try {
      const newArticles = await fetchArticles(category_id, page, 20);
      
      if (resetList) {
        setArticles(newArticles);
        setHasMore(newArticles.length === 20);
      } else {
        setArticles(prev => [...prev, ...newArticles]);
        setCurrentPage(page);
        setHasMore(newArticles.length === 20);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load thêm bài viết khi scroll
  const loadMoreArticles = useCallback(async () => {
    if (loadingMore || !hasMore || isInSearchMode) return;
    
    setLoadingMore(true);
    const nextPage = currentPage + 1;
    
    try {
      const newArticles = await fetchArticles(selectedCategory, nextPage, 20);
      
      if (newArticles.length > 0) {
        setArticles(prev => [...prev, ...newArticles]);
        setCurrentPage(nextPage);
        setHasMore(newArticles.length === 20);
        
        // Preload trang tiếp theo sau khi load thành công
        preloadMultiplePages(selectedCategory, nextPage, 2);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Lỗi khi load thêm bài viết:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, isInSearchMode, currentPage, selectedCategory]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Xóa cache cho category hiện tại để force refresh
    clearCategoryCache(selectedCategory);
    await loadArticles(selectedCategory, 1, true);
    setRefreshing(false);
  }, [selectedCategory, loadArticles]);

  // Xử lý scroll để trigger preload
  const onScroll = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollY = contentOffset.y;
    const contentHeight = contentSize.height;
    const screenHeight = layoutMeasurement.height;
    
    // Preload khi scroll đến 70% cuối danh sách
    const scrollPercentage = (scrollY + screenHeight) / contentHeight;
    if (scrollPercentage > 0.7 && hasMore && !loadingMore && !isInSearchMode) {
      // Trigger preload cho trang tiếp theo
      const nextPage = currentPage + 1;
      preloadMultiplePages(selectedCategory, nextPage, 2);
    }
  }, [hasMore, loadingMore, isInSearchMode, currentPage, selectedCategory]);

  // Handler for FlingGestureHandler
  const onFling = useCallback((direction: 'LEFT' | 'RIGHT') => {
    const currentIndex = CATEGORIES.findIndex(cat => cat.id === selectedCategory);
    if (direction === 'LEFT' && currentIndex < CATEGORIES.length - 1) {
      console.log('left');
      setSelectedCategory(CATEGORIES[currentIndex + 1].id);
    } else if (direction === 'RIGHT' && currentIndex > 0) {
      console.log('right');
      setSelectedCategory(CATEGORIES[currentIndex - 1].id);
    }
  }, [selectedCategory]);

  // Handle article press
  const handleArticlePress = useCallback((article: any) => {
    router.push({ 
      pathname: '/article/[id]', 
      params: { 
        url: article.url, 
        title: article.title, 
        source: article.source, 
        time: article.time, 
        sourceIcon: article.sourceIcon || '' 
      } 
    });
    console.log(article.url);
  }, [router]);

  // Get current data to display
  const getCurrentData = useCallback(() => {
    return isInSearchMode ? searchResults : articles;
  }, [isInSearchMode, searchResults, articles]);

  // Transform data for ArticleList
  const transformArticleData = useCallback((item: any) => ({
    url: item.url?.toString() ?? item.url ?? '',
        title: item.title,
        image: item.thumbnail_url,
        source: item.source || '',
        time: item.published_at || '',
        sourceIcon: item.source_icon || '',
  }), []);

  const currentArticles = getCurrentData().map(transformArticleData);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header 
        onSearchPress={toggleSearch}
        isSearchVisible={isSearchVisible}
      />

      {/* Search Bar */}
      <SearchBar
        isVisible={isSearchVisible}
            value={searchQuery}
            onChangeText={setSearchQuery}
        onSubmit={handleSearchSubmit}
        onClear={handleSearchClear}
      />

      {/* Category Tabs - Hide when searching */}
      {!isInSearchMode && (
        <View style={styles.categoryContainer}>
      <CategoryTabs
        categories={CATEGORIES}
        selectedId={selectedCategory}
        onSelect={setSelectedCategory}
      />
        </View>
      )}

      {/* Search Results Header */}
      {isInSearchMode && (
        <SearchResultsHeader
          isSearching={isSearching}
          resultsCount={searchResults.length}
          query={searchQuery}
        />
      )}

      {/* Article List */}
      <ArticleList
        articles={currentArticles}
        loading={loading}
        loadingMore={loadingMore}
                  refreshing={refreshing}
        error={error}
        hasMore={hasMore}
        isInSearchMode={isInSearchMode}
                  onRefresh={onRefresh}
        onLoadMore={loadMoreArticles}
        onArticlePress={handleArticlePress}
        onFlingLeft={() => onFling('LEFT')}
        onFlingRight={() => onFling('RIGHT')}
        onScroll={onScroll}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  categoryContainer: {
    marginTop: 8,
    marginRight: 0,
    backgroundColor: '#f7f8fa',
  },
}); 
import React, { useCallback, useRef } from 'react';
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Directions } from 'react-native-gesture-handler';
import ArticleCard from '../ArticleCard';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import ErrorDisplay from './ErrorDisplay';

type Article = {
  url: string;
  title: string;
  summary?: string;
  image?: string;
  source?: string;
  time?: string;
  sourceIcon?: string;
};

type ArticleListProps = {
  articles: Article[];
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
  hasMore: boolean;
  isInSearchMode: boolean;
  onRefresh: () => void;
  onLoadMore: () => void;
  onArticlePress: (article: Article) => void;
  onFlingLeft?: () => void;
  onFlingRight?: () => void;
  onScroll?: (event: any) => void;
};

export default function ArticleList({
  articles,
  loading,
  loadingMore,
  refreshing,
  error,
  hasMore,
  isInSearchMode,
  onRefresh,
  onLoadMore,
  onArticlePress,
  onFlingLeft,
  onFlingRight,
  onScroll
}: ArticleListProps) {
  const flatListRef = useRef<FlatList>(null);

  // Gesture handlers for fling
  const flingLeft = Gesture.Fling()
    .direction(Directions.LEFT).runOnJS(true)
    .onEnd(() => onFlingLeft?.());

  const flingRight = Gesture.Fling()
    .direction(Directions.RIGHT).runOnJS(true)
    .onEnd(() => onFlingRight?.());

  const composed = Gesture.Simultaneous(flingLeft, flingRight);

  // Render article item
  const renderArticleItem = useCallback(({ item }: { item: Article }) => (
    <ArticleCard
      article={item}
      onPress={() => onArticlePress(item)}
    />
  ), [onArticlePress]);

  // Render footer for loading more
  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <LoadingSpinner size="small" text="Đang tải thêm..." />
      </View>
    );
  }, [loadingMore]);

  // Render empty component
  const renderEmptyComponent = useCallback(() => (
    <EmptyState
      title={isInSearchMode ? "Không tìm thấy bài viết nào" : "Không có bài viết"}
      message={isInSearchMode ? "Thử tìm kiếm với từ khóa khác" : "Hãy thử chọn danh mục khác"}
      icon="search-outline"
    />
  ), [isInSearchMode]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner text="Đang tải bài viết..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <ErrorDisplay 
          message={error} 
          onRetry={onRefresh}
        />
      </View>
    );
  }

  return (
    <GestureDetector gesture={composed}>
      <View style={styles.container} collapsable={false}>
        <FlatList
          ref={flatListRef}
          data={articles}
          keyExtractor={(item, index) => {
            const baseKey = item.id?.toString() || item.url || '';
            const sourceKey = item.source || '';
            const timeKey = item.time || '';
            return `${baseKey}-${sourceKey}-${timeKey}-${index}`;
          }}
          numColumns={1}
          renderItem={renderArticleItem}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyComponent}
          ListFooterComponent={renderFooter}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.1}
          onScroll={onScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2196f3']}
              tintColor="#2196f3"
            />
          }
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    paddingBottom: 16,
    paddingHorizontal: 8,
  },
  footerLoader: {
    paddingVertical: 16,
  },
}); 
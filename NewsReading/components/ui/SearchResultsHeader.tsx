import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type SearchResultsHeaderProps = {
  isSearching: boolean;
  resultsCount: number;
  query?: string;
};

export default function SearchResultsHeader({ 
  isSearching, 
  resultsCount, 
  query 
}: SearchResultsHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {isSearching 
          ? 'Đang tìm kiếm...' 
          : `Kết quả tìm kiếm: ${resultsCount} bài viết`
        }
      </Text>
      {query && !isSearching && (
        <Text style={styles.queryText}>Từ khóa: "{query}"</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f7f8fa',
  },
  text: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  queryText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
}); 
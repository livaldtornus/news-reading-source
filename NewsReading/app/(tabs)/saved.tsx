import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

export default function SavedScreen() {
  const [savedArticles, setSavedArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchSaved = useCallback(async () => {
    setLoading(true);
    try {
      const json = await AsyncStorage.getItem('saved_articles');
      setSavedArticles(json ? JSON.parse(json) : []);
    } catch (e) {
      setSavedArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSaved();
    }, [fetchSaved])
  );

  const handlePress = (article: any) => {
    router.push({ pathname: '/article/[id]', params: { ...article } });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Bài viết đã lưu</Text>
      {loading ? (
        <Text style={styles.empty}>Đang tải...</Text>
      ) : savedArticles.length === 0 ? (
        <Text style={styles.empty}>Bạn chưa lưu bài viết nào.</Text>
      ) : (
        <FlatList
          data={savedArticles}
          keyExtractor={item => item.url || item.id?.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item} onPress={() => handlePress(item)}>
              <Ionicons name="bookmark" size={20} color="#335fd1" style={{ marginRight: 8 }} />
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#335fd1', marginBottom: 16, textAlign: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  title: { fontSize: 16, color: '#222', flex: 1 },
  empty: { color: '#888', textAlign: 'center', marginTop: 32, fontSize: 16 },
}); 
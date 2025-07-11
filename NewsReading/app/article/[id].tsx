import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Image, StyleSheet, TouchableOpacity, Keyboard, KeyboardEvent, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchArticleDetailClient } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { formatTimeAgo } from '../../utils/timeFormat';
import { Image as RNImage } from 'react-native';
import CommentSection from '../../components/CommentSection';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ArticleDetailScreen() {
  const { url, title, source, time, sourceIcon } = useLocalSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const router = useRouter();
  const { user, accessToken } = useAuth();

  // Kiểm tra bài viết đã lưu chưa
  useEffect(() => {
    const checkIfSaved = async () => {
      try {
        const savedArticles = await AsyncStorage.getItem('saved_articles');
        if (savedArticles) {
          const articles = JSON.parse(savedArticles);
          const isArticleSaved = articles.some((article: any) => article.url === url);
          setIsSaved(isArticleSaved);
        }
      } catch (e) {
        setIsSaved(false);
      }
    };
    checkIfSaved();
  }, [url]);

  // Toggle lưu/bỏ lưu bài viết
  const toggleSave = async () => {
    try {
      const savedArticles = await AsyncStorage.getItem('saved_articles');
      let articles = savedArticles ? JSON.parse(savedArticles) : [];
      
      if (isSaved) {
        // Bỏ lưu
        articles = articles.filter((article: any) => article.url !== url);
      } else {
        // Lưu bài viết
        const articleData = {
          url,
          title,
          source,
          time,
          sourceIcon,
        };
        articles.push(articleData);
      }
      
      await AsyncStorage.setItem('saved_articles', JSON.stringify(articles));
      setIsSaved(!isSaved);
    } catch (e) {
      console.error('Error saving article:', e);
    }
  };

  useEffect(() => {
    if (!url) {
      setError('Không có URL bài viết');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    fetchArticleDetailClient(url as string)
      .then((result) => {
        //console.log('Article detail loaded:', result);
        setData(result);
      })
      .catch((e) => {
        console.error('Error loading article:', e);
        setError(e.message || 'Không thể tải bài viết');
      })
      .finally(() => setLoading(false));
  }, [url]);

  const handleLoginPress = () => {
    // Navigate to account tab for login
    router.push('/(tabs)/account');
  };

  function renderFormattedText(html: string, keyPrefix = '') {
    if (!html) return null;
    // Normalize tags
    html = html.replace(/<strong>/g, '<b>').replace(/<\/strong>/g, '</b>');
    html = html.replace(/<em>/g, '<i>').replace(/<\/em>/g, '</i>');

    // Remove all tags except <b> and <i>, keep their content
    // Replace all tags except <b> and <i> with their inner text
    html = html.replace(/<(?!\/?(b|i)\b)[^>]+>/gi, '');

    // Split by <b>...</b> and <i>...</i>
    const parts = html.split(/(<b>.*?<\/b>|<i>.*?<\/i>)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('<b>') && part.endsWith('</b>')) {
        return <Text key={keyPrefix + idx} style={{ fontWeight: 'bold' }}>{part.slice(3, -4)}</Text>;
      }
      if (part.startsWith('<i>') && part.endsWith('</i>')) {
        return <Text key={keyPrefix + idx} style={{ fontStyle: 'italic' }}>{part.slice(3, -4)}</Text>;
      }
      return <Text key={keyPrefix + idx}>{part}</Text>;
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['bottom']}>
      {/* Header: back + source + bookmark */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <View style={styles.centerHeader}>
          {sourceIcon ? (
            <RNImage source={{ uri: sourceIcon as string }} style={styles.logo} />
          ) : null}
          <Text style={styles.source} numberOfLines={1}>{source || ''}</Text>
        </View>
        <TouchableOpacity style={styles.bookmarkBtn} onPress={toggleSave}>
          <Ionicons 
            name={isSaved ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={isSaved ? "#335fd1" : "#222"} 
          />
        </TouchableOpacity>
      </View>

      {/* Dùng KeyboardAwareScrollView thay vì KeyboardAvoidingView + ScrollView */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} size="large" color="#2196f3" />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              setLoading(true);
              setError(null);
              fetchArticleDetailClient(url as string)
                .then(setData)
                .catch(e => setError(e.message || 'Không thể tải bài viết'))
                .finally(() => setLoading(false));
            }}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardAwareScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          enableOnAndroid={true}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          extraScrollHeight={200} // có thể tùy chỉnh để đẩy content lên thêm
        >
          {/* Title */}
          <Text style={styles.title}>{title || (data && data.items[0]?.text) || ''}</Text>

          {/* Time */}
          {time ? <Text style={styles.time}>{formatTimeAgo(time as string)}</Text> : null}

          {/* Article content */}
          {data?.items?.map((item: any, idx: number) => {
            if (item.type === 'text') {
              if (item.html) {
                return (
                  <Text key={idx} style={styles.text}>
                    {renderFormattedText(item.html, `t${idx}-`)}
                  </Text>
                );
              }
              return <Text key={idx} style={styles.text}>{item.text}</Text>;
            }
            if (item.type === 'image') {
              return (
                <View key={idx} style={styles.imageBlock}>
                  <Image source={{ uri: item.url }} style={styles.image} resizeMode="contain" />
                  {item.caption ? <Text style={styles.caption}>{item.caption}</Text> : null}
                </View>
              );
            }
            return null;
          })}

          {/* Comment Section ở cuối */}
          <CommentSection
            articleUrl={url as string}
            user={user}
            accessToken={accessToken}
            onLoginPress={handleLoginPress}
          />
        </KeyboardAwareScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ddd',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    minHeight: 64,
    position: 'relative',
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f7f8fa',
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: [{ translateY: 32 }],
    zIndex: 2,
  },
  bookmarkBtn: {
    padding: 6,
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: '#f7f8fa',
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: 32 }],
    zIndex: 2,
  },
  centerHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 0,
    marginRight: 0,
    gap: 6,
  },
  logo: {
    width: 22,
    height: 22,
    borderRadius: 5,
    marginRight: 8,
    backgroundColor: '#eee',
  },
  source: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196f3',
    textAlign: 'center',
    maxWidth: 180,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
    marginTop: 12,
    lineHeight: 30,
  },
  time: {
    fontSize: 13,
    color: '#888',
    marginBottom: 16,
  },
  text: {
    fontSize: 17,
    color: '#343434',
    marginBottom: 12,
    lineHeight: 24,
  },
  imageBlock: {
    marginBottom: 16,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  caption: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
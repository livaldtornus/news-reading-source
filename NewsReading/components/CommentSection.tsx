import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert, Platform, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatTimeAgo } from '../utils/timeFormat';
import { API_BASE_URL } from '@env';

const API_URL = API_BASE_URL || 'http://192.168.44.109:3001/api';

interface Comment {
  id: number;
  content: string;
  created_at: string;
  parent_id?: number;
  root_id?: number;
  depth: number;
  path?: string;
  user_info?: {
    full_name: string;
    avatar_url?: string;
  };
  replies?: Comment[];
}

export default function CommentSection({ articleUrl, user, accessToken, onLoginPress }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const commentInputRef = useRef(null);
  const replyInputRef = useRef(null);

  // Fetch comments
  const fetchComments = async () => {
    if (!articleUrl) return;
    
    setCommentLoading(true);
    try {
      const res = await fetch(`${API_URL}/comments?article_url=${encodeURIComponent(articleUrl)}`);
      const data = await res.json();
      if (res.ok) {
        // Organize comments into hierarchical structure
        const organizedComments = organizeComments(data.comments || []);
        setComments(organizedComments);
      } else {
        console.error('Error fetching comments:', data.error);
        setComments([]);
      }
    } catch (err) {
      console.error('Network error fetching comments:', err);
      setComments([]);
    } finally {
      setCommentLoading(false);
    }
  };

  // Organize flat comments into hierarchical structure
  // Server already returns comments in correct order (by path)
  const organizeComments = (flatComments: Comment[]): Comment[] => {
    const commentMap = new Map();
    const rootComments: Comment[] = [];

    // First pass: create map of all comments
    flatComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: organize into hierarchy (no sort needed)
    flatComments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id);
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  };

  useEffect(() => {
    if (articleUrl) {
      fetchComments();
    }
  }, [articleUrl]);

  // Gửi comment mới
  const handleSendComment = async () => {
    if (!commentText.trim() || !articleUrl) return;
    
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: accessToken,
          article_url: articleUrl,
          content: commentText.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCommentText('');
        // Refresh comments after posting
        fetchComments();
      } else {
        Alert.alert('Lỗi', data.error || 'Gửi bình luận thất bại');
      }
    } catch (err) {
      console.error('Network error posting comment:', err);
      Alert.alert('Lỗi', 'Gửi bình luận thất bại');
    } finally {
      setSending(false);
    }
  };

  // Gửi reply
  const handleSendReply = async () => {
    if (!replyText.trim() || !articleUrl || !replyingTo) return;
    
    console.log('Sending reply with data:', {
      access_token: accessToken,
      article_url: articleUrl,
      content: replyText.trim(),
      parent_id: replyingTo.id,
      replyingTo: replyingTo
    });
    
    setSendingReply(true);
    try {
      const requestBody = {
        access_token: accessToken,
        article_url: articleUrl,
        content: replyText.trim(),
        parent_id: replyingTo.id,
      };
      
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      const res = await fetch(`${API_URL}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      const data = await res.json();
      console.log('Response:', data);
      
      if (res.ok) {
        setReplyText('');
        setReplyingTo(null);
        // Refresh comments after posting
        fetchComments();
      } else {
        console.error('Error response:', data);
        Alert.alert('Lỗi', data.error || 'Gửi phản hồi thất bại');
      }
    } catch (err) {
      console.error('Network error posting reply:', err);
      Alert.alert('Lỗi', 'Gửi phản hồi thất bại');
    } finally {
      setSendingReply(false);
    }
  };

  // Cancel reply
  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyText('');
  };

  // Render a single comment with its replies
  const renderComment = (comment: Comment, depth = 0) => {
    const marginLeft = depth == 0 ? 0 : 10;
    
    return (
      <View key={comment.id} style={[styles.commentItem, { marginLeft }]}>
        <Image 
          source={{ 
            uri: comment.user_info?.avatar_url || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user_info?.full_name || 'U')}` 
          }} 
          style={styles.avatar}
        />
        <View style={styles.commentContent}>
          <Text style={styles.userName}>
            {comment.user_info?.full_name || 'Người dùng'}
          </Text>
          <Text style={styles.commentText}>{comment.content}</Text>
          <View style={styles.commentActions}>
            <Text style={styles.commentTime}>
              {formatTimeAgo(comment.created_at)}
            </Text>
            {user && depth < 2 && (
              <TouchableOpacity 
                onPress={() => {
                  console.log('Reply button clicked for comment:', comment);
                  setReplyingTo(comment);
                  setReplyText('');
                  setTimeout(() => replyInputRef.current?.focus(), 100);
                }}
                style={styles.replyButton}
              >
                <Text style={styles.replyButtonText}>Phản hồi</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Render replies */}
          {comment.replies && comment.replies.length > 0 && (
            <View style={styles.repliesContainer}>
              {comment.replies.map(reply => renderComment(reply, depth + 1))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bình luận</Text>
      
      {commentLoading ? (
        <ActivityIndicator size="small" color="#2196f3" style={styles.loading} />
      ) : comments.length === 0 ? (
        <Text style={styles.emptyText}>Chưa có bình luận nào</Text>
      ) : (
        <View style={styles.commentsList}>
          {comments.map(comment => renderComment(comment))}
        </View>
      )}

      {/* Reply input */}
      {replyingTo && user && (
        <View style={styles.replyInputContainer}>
          <View style={styles.replyHeader}>
            <Text style={styles.replyingToText}>
              Đang trả lời {replyingTo.user_info?.full_name || 'Người dùng'}
            </Text>
            <TouchableOpacity onPress={handleCancelReply}>
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              ref={replyInputRef}
              style={styles.textInput}
              placeholder="Viết phản hồi..."
              value={replyText}
              onChangeText={setReplyText}
              editable={!sendingReply}
              returnKeyType="send"
              onSubmitEditing={handleSendReply}
              multiline={false}
            />
            <TouchableOpacity 
              onPress={handleSendReply} 
              disabled={sendingReply || !replyText.trim()} 
              style={[styles.sendButton, { opacity: sendingReply || !replyText.trim() ? 0.5 : 1 }]}
            >
              <Ionicons name="send" size={20} color="#2196f3" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main comment input */}
      {user && !replyingTo ? (
        <View style={styles.inputContainer}>
          <TextInput
            ref={commentInputRef}
            style={styles.textInput}
            placeholder="Viết bình luận..."
            value={commentText}
            onChangeText={setCommentText}
            editable={!sending}
            returnKeyType="send"
            onSubmitEditing={handleSendComment}
            multiline={false}
          />
          <TouchableOpacity 
            onPress={handleSendComment} 
            disabled={sending || !commentText.trim()} 
            style={[styles.sendButton, { opacity: sending || !commentText.trim() ? 0.5 : 1 }]}
          >
            <Ionicons name="send" size={24} color="#2196f3" />
          </TouchableOpacity>
        </View>
      ) : !user ? (
        <TouchableOpacity style={styles.loginPrompt} onPress={onLoginPress}>
          <Ionicons name="log-in-outline" size={20} color="#2196f3" />
          <Text style={styles.loginPromptText}>Đăng nhập để bình luận</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    backgroundColor: '#fff',
    marginBottom: 0,
  },
  title: {
    fontWeight: 'bold' as const,
    fontSize: 17,
    marginBottom: 16,
    color: '#222',
  },
  loading: {
    marginVertical: 20,
  },
  emptyText: {
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 16,
    textAlign: 'center',
  },
  commentsList: {
    marginBottom: 12,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  commentContent: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold' as const,
    fontSize: 15,
    color: '#222',
    marginBottom: 2,
  },
  commentText: {
    color: '#444',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 2,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentTime: {
    color: '#aaa',
    fontSize: 12,
  },
  replyButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  replyButtonText: {
    color: '#2196f3',
    fontSize: 12,
    fontWeight: '500',
  },
  repliesContainer: {
    marginTop: 10,
    paddingLeft: 0,
    borderLeftWidth: 2,
    borderLeftColor: '#f0f0f0',
  },
  replyInputContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    maxHeight: 100,
    paddingVertical: 0,
  },
  sendButton: {
    marginLeft: 8,
    padding: 4,
  },
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  loginPromptText: {
    color: '#2196f3',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});
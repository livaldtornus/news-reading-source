import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Alert, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '@env';
import { useNavigation } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

// Import reusable UI components
import { Button, Input, Card, LoadingSpinner } from '../../components/ui';

const API_URL = `${API_BASE_URL || 'http://192.168.44.109:3001/api'}/auth`;

export default function AccountScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatar, setAvatar] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  
  // Edit profile states
  const [editMode, setEditMode] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editAvatar, setEditAvatar] = useState<any>(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  
  const navigation = useNavigation();
  
  const { user, accessToken, login, logout } = useAuth();

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatar(result.assets[0]);
    }
  };

  const pickEditAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setEditAvatar(result.assets[0]);
    }
  };

  const handleAuth = async () => {
    setLoading(true);
    try {
      let res, data;
      if (mode === 'register') {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        formData.append('full_name', fullName);
        if (avatar) {
          let mime = avatar.type;
          if (mime === 'image') mime = 'image/jpeg';
          formData.append('avatar', {
            uri: avatar.uri,
            name: avatar.fileName || avatar.name || 'avatar.jpg',
            type: mime,
          } as any);
        }
        // Log FormData keys
        for (let pair of (formData as any)._parts || []) {
          console.log('FormData:', pair[0], pair[1]);
        }
        res = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
          },
          body: formData,
        });
      } else {
        res = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
      }
      data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi không xác định');
      await login(data.user, data.access_token || '');
      Alert.alert('Thành công', mode === 'login' ? 'Đăng nhập thành công!' : 'Đăng ký thành công!');
    } catch (err: any) {
      console.log('Đăng ký lỗi:', err);
      Alert.alert('Lỗi', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !accessToken) return;
    
    setUpdatingProfile(true);
    try {
      const formData = new FormData();
      formData.append('full_name', editFullName);
      if (editAvatar) {
        let mime = editAvatar.type;
        if (mime === 'image') mime = 'image/jpeg';
        formData.append('avatar', {
          uri: editAvatar.uri,
          name: editAvatar.fileName || editAvatar.name || 'avatar.jpg',
          type: mime,
        } as any);
      }
      
      const res = await fetch(`${API_URL}/update-profile`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi không xác định');
      
      // Update user info in context
      await login({ ...user, ...data.user }, accessToken);
      setEditMode(false);
      setEditAvatar(null);
      Alert.alert('Thành công', 'Cập nhật thông tin thành công!');
    } catch (err: any) {
      console.log('Cập nhật profile lỗi:', err);
      Alert.alert('Lỗi', err.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setEmail('');
    setPassword('');
    setFullName('');
    setAvatar(null);
  };

  const startEditMode = () => {
    setEditFullName(user?.full_name || '');
    setEditAvatar(null);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditFullName('');
    setEditAvatar(null);
  };

  useEffect(() => {
    if (!user || !accessToken) return;
    setLoadingComments(true);
    fetch(`${API_BASE_URL}/comments?user_id=${user.id}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
      .then(res => res.json())
      .then(data => setComments(data.comments || []))
      .catch(() => setComments([]))
      .finally(() => setLoadingComments(false));
  }, [user, accessToken]);

  if (user) {
    return (
      <View style={styles.container}>
        {/* Header with gradient */}
        <LinearGradient
          colors={["#4f8cff", "#335fd1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Tài khoản</Text>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutIcon}>
              <Ionicons name="log-out-outline" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
        
        {/* User Card with elevated style */}
        <View style={styles.userCardWrapper}>
          <View style={styles.userCard}>
            <View style={styles.avatarWrapper}>
              {editMode ? (
                <TouchableOpacity onPress={pickEditAvatar}>
                  {editAvatar ? (
                    <Image source={{ uri: editAvatar.uri }} style={styles.avatar} />
                  ) : user.avatar_url ? (
                    <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Ionicons name="person-circle-outline" size={70} color="#bbb" />
                    </View>
                  )}
                  <View style={styles.editAvatarOverlay}>
                    <Ionicons name="camera" size={20} color="#fff" />
                  </View>
                </TouchableOpacity>
              ) : (
                <>
                  {user.avatar_url ? (
                    <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Ionicons name="person-circle-outline" size={70} color="#bbb" />
                    </View>
                  )}
                </>
              )}
            </View>
            
            {editMode ? (
              <View style={styles.editForm}>
                <Input
                  value={editFullName}
                  onChangeText={setEditFullName}
                  placeholder="Họ tên"
                  icon="person-outline"
                  style={styles.editInput}
                />
                <View style={styles.editButtons}>
                  <Button
                    title="Hủy"
                    onPress={cancelEdit}
                    variant="ghost"
                    size="small"
                    style={styles.cancelButton}
                  />
                  <Button
                    title="Lưu"
                    onPress={handleUpdateProfile}
                    loading={updatingProfile}
                    disabled={updatingProfile}
                    style={styles.saveButton}
                  />
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.userName}>{user.full_name || 'Chưa cập nhật'}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <TouchableOpacity onPress={startEditMode} style={styles.editButton}>
                  <Ionicons name="create-outline" size={16} color="#335fd1" />
                  <Text style={styles.editButtonText}>Chỉnh sửa</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        
        {/* Comments Section */}
        <View style={styles.sectionHeader}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color="#4f8cff" style={{marginRight: 6}} />
          <Text style={styles.sectionTitle}>Bình luận của bạn</Text>
        </View>
        {loadingComments ? (
          <LoadingSpinner />
        ) : comments.length === 0 ? (
          <Text style={styles.emptyText}>Bạn chưa có bình luận nào.</Text>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.commentCard}>
                <Text style={styles.commentArticle} numberOfLines={2}>
                  <Ionicons name="newspaper-outline" size={16} color="#335fd1" /> {' '}
                  {item.article_title || 'Không rõ tiêu đề'}
                </Text>
                <Text style={styles.commentContent}>{item.content}</Text>
                <View style={styles.commentFooter}>
                  <Ionicons name="time-outline" size={14} color="#aaa" style={{marginRight: 2}} />
                  <Text style={styles.commentDate}>{new Date(item.created_at).toLocaleString()}</Text>
                </View>
              </View>
            )}
            style={{width: '100%', marginTop: 8}}
            contentContainerStyle={{paddingBottom: 32}}
            ItemSeparatorComponent={() => <View style={styles.commentDivider} />}
          />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.centeredContainer]}>
      <Card style={styles.authCard}>
      <Text style={styles.title}>{mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</Text>
        
        <Input
        value={email}
        onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          icon="mail-outline"
      />
        
        <Input
          value={password}
          onChangeText={setPassword}
        placeholder="Mật khẩu"
        secureTextEntry
          icon="lock-closed-outline"
      />
        
      {mode === 'register' && (
        <>
            <Input
            value={fullName}
            onChangeText={setFullName}
              placeholder="Họ tên"
              icon="person-outline"
          />
            <TouchableOpacity onPress={pickAvatar} style={{ alignItems: 'center', marginTop: 8, marginBottom: 8 }}>
              {avatar ? (
                <Image source={{ uri: avatar.uri }} style={{ width: 80, height: 80, borderRadius: 40 }} />
              ) : (
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="camera-outline" size={36} color="#bbb" />
                </View>
              )}
              <Text style={{ color: '#335fd1', marginTop: 4, fontSize: 14 }}>Chọn ảnh đại diện</Text>
            </TouchableOpacity>
        </>
      )}
        
        <Button 
          title={mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          onPress={handleAuth}
          loading={loading}
          disabled={loading}
          style={styles.authButton}
        />
        
        <Button 
          title={mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
          onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
          variant="ghost"
          size="small"
          style={styles.switchButton}
        />
      </Card>
    </View>
  );
}

const { width } = Dimensions.get('window');
const AVATAR_SIZE = 90;
const HEADER_HEIGHT = 120;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centeredContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    height: HEADER_HEIGHT,
    width: '100%',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    justifyContent: 'flex-end',
    paddingBottom: 24,
    paddingHorizontal: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  logoutIcon: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  userCardWrapper: {
    alignItems: 'center',
    marginTop: -AVATAR_SIZE / 2 + 50,
    marginBottom: 12,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingTop: AVATAR_SIZE / 2 + 10,
    paddingBottom: 10,
    paddingHorizontal: 28,
    alignItems: 'center',
    width: width - 48,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    position: 'relative',
  },
  avatarWrapper: {
    position: 'absolute',
    top: -AVATAR_SIZE / 2,
    left: (width - 48 - AVATAR_SIZE) / 2,
    zIndex: 2,
    backgroundColor: '#fff',
    borderRadius: AVATAR_SIZE / 2 + 4,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#eee',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#335fd1',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 8,
    marginBottom: 2,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 15,
    color: '#666',
    marginBottom: 2,
    textAlign: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f8ff',
  },
  editButtonText: {
    fontSize: 14,
    color: '#335fd1',
    marginLeft: 4,
    fontWeight: '500',
  },
  editForm: {
    width: '100%',
    marginTop: 8,
  },
  editInput: {
    marginBottom: 12,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 6,
    marginLeft: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#335fd1',
    letterSpacing: 0.2,
  },
  commentCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  commentArticle: {
    fontWeight: 'bold',
    color: '#335fd1',
    fontSize: 15,
    marginBottom: 2,
  },
  commentContent: {
    color: '#444',
    marginVertical: 4,
    fontSize: 15,
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  commentDate: {
    fontSize: 12,
    color: '#888',
    marginLeft: 2,
  },
  commentDivider: {
    height: 10,
    backgroundColor: 'transparent',
  },
  emptyText: {
    color: '#888',
    marginTop: 16,
    textAlign: 'center',
    fontSize: 15,
  },
  authCard: {
    minWidth: 300,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#222',
    textAlign: 'center',
  },
  authButton: {
    marginTop: 16,
    borderRadius: 8,
  },
  logoutButton: {
    marginTop: 24,
    borderRadius: 8,
  },
  switchButton: {
    marginTop: 16,
  },
});
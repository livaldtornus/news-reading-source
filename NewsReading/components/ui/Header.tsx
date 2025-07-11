import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UserStatus from '../UserStatus';

type HeaderProps = {
  onSearchPress: () => void;
  isSearchVisible?: boolean;
  title?: string;
};

export default function Header({ 
  onSearchPress, 
  isSearchVisible = false, 
  title = "VNews" 
}: HeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.logo}>{title}</Text>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.searchBtn} onPress={onSearchPress}>
          <Ionicons 
            name={isSearchVisible ? "close" : "search"} 
            size={25} 
            color="#222" 
          />
        </TouchableOpacity>
        <UserStatus />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 6,
    backgroundColor: '#f7f8fa',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196f3',
    letterSpacing: 1,
  },
  searchBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#fff',
    elevation: 2,
  },
}); 
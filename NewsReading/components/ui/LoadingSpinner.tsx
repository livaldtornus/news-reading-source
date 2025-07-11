import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

type LoadingSpinnerProps = {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  style?: any;
};

export default function LoadingSpinner({ 
  size = 'large', 
  color = '#2196f3', 
  text,
  style 
}: LoadingSpinnerProps) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  text: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
}); 
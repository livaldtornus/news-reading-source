import React from 'react';
import { View, StyleSheet } from 'react-native';

type CardProps = {
  children: React.ReactNode;
  style?: any;
  padding?: number;
  margin?: number;
  elevation?: number;
};

export default function Card({ 
  children, 
  style, 
  padding = 16, 
  margin = 8,
  elevation = 2 
}: CardProps) {
  return (
    <View style={[
      styles.card,
      { 
        padding, 
        margin,
        elevation,
        shadowRadius: elevation * 2,
      },
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
  },
}); 
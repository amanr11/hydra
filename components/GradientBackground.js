import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import WaveBottom from './WaveBottom';
import { COLOR } from './Theme';

export default function GradientBackground({ children, style }) {
  return (
    <View style={[styles.container, style]}>
      <StatusBar barStyle="light-content" />
      
      {/* LAYER 1: Deep Base Gradient */}
      <LinearGradient
        colors={['#0A192F', '#051622', '#020B11']} // Richer, darker navy tones
        style={StyleSheet.absoluteFill}
      />

      {/* LAYER 2: Decorative Wave (The remodel) */}
      <WaveBottom height={120} />

      {/* LAYER 3: Main App Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020B11',
  },
  content: {
    flex: 1,
    zIndex: 10, // Higher than WaveBottom
  },
});
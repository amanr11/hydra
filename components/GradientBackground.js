// components/GradientBackground.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import WaveBottom from './WaveBottom';
import { COLOR } from './Theme';

export default function GradientBackground({ children, style }) {
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={[COLOR.deepNavy, '#052036']} // deep background fade
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>{children}</View>

      {/* bottom decorative wave (skyBlue -> aquaMint) */}
      <WaveBottom />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, zIndex: 1 },
});

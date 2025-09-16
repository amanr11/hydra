// components/GradientBackground.js
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient'; 

export default function GradientBackground({ children, colors = ['#6DD5FA', '#2980B9'] }) {
  return (
    <LinearGradient
      colors={colors}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {children}
    </LinearGradient>
  );
}

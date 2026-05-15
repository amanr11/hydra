// components/DropProgress.js - Fixed version that won't crash
import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, Easing, StyleSheet, Text } from 'react-native';
import PropTypes from 'prop-types';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, ClipPath, Rect } from 'react-native-svg';
import { COLOR } from './Theme';

// Create animated component OUTSIDE the main component
const AnimatedRect = Animated.createAnimatedComponent(Rect);

export default function DropProgress({ progress = 0, size = 220, text, subtitle, color, theme }) {
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(1)).current;
  const [showSparkles, setShowSparkles] = useState(false);

  // Safely clamp progress between 0 and 1
  const safeProgress = Math.max(0, Math.min(1, progress || 0));

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: safeProgress,
      duration: 1200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start(() => {
      if (safeProgress >= 1) {
        triggerPop();
      }
    });
  }, [safeProgress, animatedHeight]);

  const triggerPop = () => {
    setShowSparkles(true);
    Animated.sequence([
      Animated.timing(bounce, {
        toValue: 1.15,
        duration: 300,
        easing: Easing.out(Easing.back(2)),
        useNativeDriver: true,
      }),
      Animated.timing(bounce, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.bounce),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => setShowSparkles(false), 2000);
    });
  };

  const fillY = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [200, 0],
  });

  const dropHeight = size * 0.91;
  const dropWidth = size * 0.64;

  // Dynamic text sizing
  const getTextSize = (textContent) => {
    if (!textContent) return 24;
    const length = String(textContent).length;
    if (length <= 6) return 24;
    if (length <= 8) return 20;
    if (length <= 10) return 18;
    return 16;
  };

  const mainTextSize = getTextSize(text);
  const subtitleTextSize = Math.max(12, mainTextSize - 6);

  // Use provided color or default
  const dropColor = color || COLOR.skyBlue;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ transform: [{ scale: bounce }], width: size, height: size }}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            <ClipPath id="clip">
              <Path d="M50 0C50 0 20 35 20 60C20 76.5685 33.4315 90 50 90C66.5685 90 80 76.5685 80 60C80 35 50 0 50 0Z" />
            </ClipPath>
            <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={COLOR.skyBlue} />
              <Stop offset="1" stopColor={COLOR.aquaMint} />
            </LinearGradient>
          </Defs>
          
          {/* Background Drop (The "Empty" part) */}
          <Path 
            d="M50 0C50 0 20 35 20 60C20 76.5685 33.4315 90 50 90C66.5685 90 80 76.5685 80 60C80 35 50 0 50 0Z" 
            fill="rgba(255,255,255,0.1)" 
          />

          {/* Filling Water */}
          <AnimatedRect
            x="0"
            y={animatedHeight.interpolate({ inputRange: [0, 1], outputRange: [90, 0] })}
            width="100"
            height="100"
            fill="url(#grad)"
            clipPath="url(#clip)"
          />
        </Svg>

        {/* Improved Text Overlay */}
        <View style={styles.textOverlay}>
          <Text style={styles.percentageText}>{Math.round(progress * 100)}%</Text>
          {subtitle && <Text style={styles.subText}>{subtitle}</Text>}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  textOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20 // Adjust for drop shape
  },
  percentageText: {
    fontSize: 38,
    fontWeight: '900',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subText: { color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: 12, textTransform: 'uppercase' }
});
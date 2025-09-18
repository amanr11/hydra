import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, Easing, Text } from 'react-native';
import PropTypes from 'prop-types';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, ClipPath, Rect as SvgRect } from 'react-native-svg';
import { COLOR } from './Theme';

const AnimatedRect = Animated.createAnimatedComponent(SvgRect);

export default function DropProgress({ progress = 0, size = 220, text, subtitle, theme }) {
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(1)).current;
  const [showSparkles, setShowSparkles] = useState(false);

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: progress,
      duration: 1200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start(() => {
      if (progress >= 1) triggerPop();
    });
  }, [progress]);

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

  // Dynamic text sizing based on content length
  const getTextSize = (textContent) => {
    if (!textContent) return 24;
    const length = textContent.toString().length;
    if (length <= 6) return 24;
    if (length <= 8) return 20;
    if (length <= 10) return 18;
    return 16;
  };

  const mainTextSize = getTextSize(text);
  const subtitleTextSize = Math.max(12, mainTextSize - 6);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', margin: 20 }}>
      <Animated.View style={{ transform: [{ scale: bounce }] }}>
        <Svg width={dropWidth} height={dropHeight} viewBox="0 0 140 200">
          <Defs>
            <ClipPath id="dropClip">
              {/* Proper water drop shape - pointed at top, rounded at bottom */}
              <Path d="M70 5 C85 25, 120 80, 120 130 C120 165, 105 190, 70 190 C35 190, 20 165, 20 130 C20 80, 55 25, 70 5 Z" />
            </ClipPath>
            <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={COLOR.skyBlue} stopOpacity="0.9" />
              <Stop offset="50%" stopColor={COLOR.aquaMint} stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#0080ff" stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Water drop outline */}
          <Path
            d="M70 5 C85 25, 120 80, 120 130 C120 165, 105 190, 70 190 C35 190, 20 165, 20 130 C20 80, 55 25, 70 5 Z"
            stroke={COLOR.skyBlue}
            strokeWidth={3}
            fill="rgba(58, 190, 255, 0.1)"
          />

          {/* Animated fill */}
          <AnimatedRect
            x={0}
            y={fillY}
            width={140}
            height={200}
            fill="url(#grad)"
            clipPath="url(#dropClip)"
          />

          {/* Surface ripple effect when full - REMOVED to fix grey circle bug */}
          
          {/* Sparkles when complete */}
          {showSparkles && (
            <>
              <Circle cx="40" cy="60" r="3" fill="#fff" opacity={0.9} />
              <Circle cx="100" cy="80" r="4" fill="#fff" opacity={0.8} />
              <Circle cx="60" cy="40" r="2" fill="#fff" opacity={0.9} />
              <Circle cx="85" cy="120" r="3" fill="#fff" opacity={0.7} />
              <Circle cx="55" cy="100" r="2" fill="#fff" opacity={0.8} />
            </>
          )}
        </Svg>

        {/* Text overlay - positioned in the wider part of the drop */}
        <View style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          alignItems: 'center',
          paddingHorizontal: 15, // Add padding to prevent overflow
        }}>
          <Text style={{
            fontSize: mainTextSize,
            fontWeight: '800',
            color: progress > 0.3 ? COLOR.white : COLOR.skyBlue,
            textShadowColor: 'rgba(0,0,0,0.4)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 3,
            textAlign: 'center',
            numberOfLines: 1,
            adjustsFontSizeToFit: true,
          }}>
            {text}
          </Text>
          {subtitle && (
            <Text style={{
              fontSize: subtitleTextSize,
              color: progress > 0.3 ? COLOR.white : COLOR.aquaMint,
              fontWeight: '600',
              marginTop: 4,
              opacity: 0.9,
              textAlign: 'center',
              numberOfLines: 1,
              adjustsFontSizeToFit: true,
            }}>
              {subtitle}
            </Text>
          )}
        </View>
      </Animated.View>

      <Text style={{
        marginTop: 10,
        fontSize: 16,
        fontWeight: '600',
        color: COLOR.white,
      }}>
        {Math.round(progress * 100)}% Complete
      </Text>
    </View>
  );
}

DropProgress.propTypes = {
  progress: PropTypes.number,
  size: PropTypes.number,
  text: PropTypes.string,
  subtitle: PropTypes.string,
  theme: PropTypes.object
};
import React, { useRef, useEffect } from 'react';
import { Animated, View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLOR } from './Theme';

const screenWidth = Dimensions.get('window').width;

export default function WaveBottom() {
  const bob = useRef(new Animated.Value(0)).current;
  const WAVE_HEIGHT = 40; // Hardcoded small height

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const translateY = bob.interpolate({
    inputRange: [0, 1],
    outputRange: [2, -2],
  });

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={{ transform: [{ translateY }] }}>
        <Svg width={screenWidth} height={WAVE_HEIGHT} viewBox={`0 0 ${screenWidth} ${WAVE_HEIGHT}`}>
          <Defs>
            <LinearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={COLOR.skyBlue} stopOpacity="0.2" />
              <Stop offset="1" stopColor={COLOR.aquaMint} stopOpacity="0.1" />
            </LinearGradient>
          </Defs>
          <Path
            d={`M0,10 C${screenWidth/4},0 ${screenWidth/2},20 ${screenWidth},10 L${screenWidth},${WAVE_HEIGHT} L0,${WAVE_HEIGHT} Z`}
            fill="url(#waveGrad)"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 0,
  },
});
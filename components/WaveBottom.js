import React, { useRef, useEffect } from 'react';
import { Animated, View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLOR } from './Theme';

const screenWidth = Dimensions.get('window').width;

export default function WaveBottom({ height = 60 }) {
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1 }
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const translateY = bob.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -6, 0],
  });

  return (
    <View style={[styles.container, { height: height + 30 }]}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        <Svg width={screenWidth} height={height + 30} viewBox={`0 0 ${screenWidth} ${height + 30}`}>
          <Defs>
            <LinearGradient id="g1" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={COLOR.aquaMint} stopOpacity="0.1" />
              <Stop offset="1" stopColor={COLOR.skyBlue} stopOpacity="0.1" />
            </LinearGradient>
            <LinearGradient id="g2" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={COLOR.aquaMint} stopOpacity="0.25" />
              <Stop offset="1" stopColor={COLOR.skyBlue} stopOpacity="0.25" />
            </LinearGradient>
          </Defs>
          <Path
            d={`M0,20 Q${screenWidth / 4},0 ${screenWidth / 2},20 T${screenWidth},20 L${screenWidth},${height + 30} L0,${height + 30} Z`}
            fill="url(#g1)"
          />
          <Path
            d={`M0,25 Q${screenWidth / 4},5 ${screenWidth / 2},25 T${screenWidth},25 L${screenWidth},${height + 30} L0,${height + 30} Z`}
            fill="url(#g2)"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -15, // to hide the hard edge
  },
});

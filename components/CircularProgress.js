import React, { useEffect, useRef } from 'react';
import * as Progress from 'react-native-progress';
import { View, Text, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';

export default function CircularProgress({
  progress = 0,
  size = 170,
  strokeWidth = 16,
  color = '#3ABEFF',
  text = '',
  subtitle = '',
  theme,
}) {
  const ref = useRef();

  useEffect(() => {
    if (progress >= 1 && ref.current) {
      ref.current.pulse(900);
    }
  }, [progress]);

  return (
    <Animatable.View ref={ref} style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      <Progress.Circle
        size={size}
        progress={progress}
        thickness={strokeWidth}
        color={color}
        unfilledColor="rgba(255,255,255,0.08)"
        borderWidth={0}
        showsText={false}
        strokeCap="round"
      />
      <View style={styles.textWrap}>
        <Text style={[styles.mainText, { color: theme?.text ?? '#fff' }]}>{text}</Text>
        {subtitle ? <Text style={[styles.subText, { color: theme?.text ?? '#fff', opacity: 0.8 }]}>{subtitle}</Text> : null}
      </View>
    </Animatable.View>
  );
}

const styles = StyleSheet.create({
  textWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainText: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
});

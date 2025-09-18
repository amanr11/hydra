import React from 'react';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/Ionicons';

export default function AnimatedIcon({ name, color, size }) {
  return (
    <Animatable.View animation="pulse" easing="ease-out" iterationCount="infinite" duration={1500} style={{ alignSelf: 'center' }}>
      <Icon name={name} color={color} size={size} />
    </Animatable.View>
  );
}

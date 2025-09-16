import React from 'react';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/Ionicons';

export default function AnimatedIcon({ name, color, size }) {
  return (
    <Animatable.View animation="bounceIn" duration={1500}>
      <Icon name={name} color={color} size={size} />
    </Animatable.View>
  );
}

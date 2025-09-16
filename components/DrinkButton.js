import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import * as Animatable from 'react-native-animatable';

export default function DrinkButton({ option, onPress, theme }) {
  return (
    <Animatable.View animation="bounceIn" duration={600}>
      <TouchableOpacity
        onPress={onPress}
        style={{
          backgroundColor: theme.primary,
          padding:16,
          borderRadius:12,
          margin:8,
          minWidth:100,
          alignItems:'center'
        }}
      >
        <Text style={{color:'#fff', fontWeight:'bold', fontSize:16}}>
          {option.emoji} {option.label}
        </Text>
      </TouchableOpacity>
    </Animatable.View>
  );
}

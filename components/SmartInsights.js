import React from 'react';
import { View, Text } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { COLOR } from './Theme';

export default function SmartInsights({ tip, weather, theme }) {
  return (
    <Animatable.View 
      animation="fadeIn" 
      delay={800}
      style={{
        width: '90%',
        marginTop: 20,
        backgroundColor: 'rgba(111, 231, 221, 0.15)',
        padding: 15,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: COLOR.aquaMint,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 20, marginRight: 8 }}>🧠</Text>
        <Text style={{ color: COLOR.aquaMint, fontWeight: '700', fontSize: 16 }}>
          Smart Insight
        </Text>
      </View>
      <Text style={{ color: COLOR.white, fontSize: 14, lineHeight: 20 }}>
        {tip}
      </Text>
      {weather && (
        <Text style={{ color: COLOR.white, opacity: 0.7, fontSize: 12, marginTop: 5 }}>
          Based on current weather: {weather.temp}°C, {weather.condition}
        </Text>
      )}
    </Animatable.View>
  );
}
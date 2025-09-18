import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';
import * as Animatable from 'react-native-animatable';
import { COLOR } from './Theme';

export default function QuickStats({ total, goal, streak, todayIntake, theme }) {
  const remaining = Math.max(goal - total, 0);
  const glassesLeft = Math.ceil(remaining / 250); // assuming 250ml per glass
  
  return (
    <Animatable.View 
      animation="fadeInUp" 
      delay={500}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '90%',
        marginTop: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
      }}
    >
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 24, color: COLOR.amber }}>🔥</Text>
        <Text style={{ color: COLOR.white, fontWeight: '700', fontSize: 18 }}>{streak}</Text>
        <Text style={{ color: COLOR.white, opacity: 0.8, fontSize: 12 }}>Day Streak</Text>
      </View>
      
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 24, color: COLOR.coral }}>🥤</Text>
        <Text style={{ color: COLOR.white, fontWeight: '700', fontSize: 18 }}>{glassesLeft}</Text>
        <Text style={{ color: COLOR.white, opacity: 0.8, fontSize: 12 }}>Glasses Left</Text>
      </View>
      
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 24, color: COLOR.aquaMint }}>💧</Text>
        <Text style={{ color: COLOR.white, fontWeight: '700', fontSize: 18 }}>{todayIntake.length}</Text>
        <Text style={{ color: COLOR.white, opacity: 0.8, fontSize: 12 }}>Times Today</Text>
      </View>
    </Animatable.View>
  );
}

QuickStats.propTypes = {
  total: PropTypes.number.isRequired,
  goal: PropTypes.number.isRequired,
  streak: PropTypes.number.isRequired,
  todayIntake: PropTypes.array.isRequired,
  theme: PropTypes.object.isRequired
};

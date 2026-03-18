import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';
import * as Animatable from 'react-native-animatable';
import { COLOR } from './Theme';

const ML_PER_OZ = 29.5735;
const OZ_GLASS = 8;
const ML_GLASS = 250;

export default function QuickStats({ total, goal, streak, todayIntake, theme, units = 'ml' }) {
  const remainingMl = Math.max(goal - total, 0);

  const mlPerGlass = units === 'oz' ? OZ_GLASS * ML_PER_OZ : ML_GLASS;
  const glassesLeft = Math.ceil(remainingMl / mlPerGlass);

  const glassesLabel = units === 'oz' ? 'Cups Left' : 'Glasses Left';

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
        <Text style={{ color: COLOR.white, opacity: 0.8, fontSize: 12 }}>{glassesLabel}</Text>
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
  total: PropTypes.number.isRequired, // ml
  goal: PropTypes.number.isRequired, // ml
  streak: PropTypes.number.isRequired,
  todayIntake: PropTypes.array.isRequired,
  theme: PropTypes.object.isRequired,
  units: PropTypes.oneOf(['ml', 'oz']),
};
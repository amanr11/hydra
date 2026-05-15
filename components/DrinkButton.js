import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import PropTypes from 'prop-types';
import * as Animatable from 'react-native-animatable';
import { COLOR } from './Theme';

const ML_PER_OZ = 29.5735;
const mlToOz = (ml) => Math.round(ml / ML_PER_OZ);

export default function DrinkButton({ option, onPress, color, enhanced = false, units = 'ml' }) {
  const amountText = units === 'oz' ? `${mlToOz(option.ml)}oz` : `${option.ml}ml`;

  return (
    <Animatable.View animation="bounceIn" duration={600} style={{ margin: 6 }}>
      <TouchableOpacity
        onPress={() => onPress(option)}
        style={[
          styles.button,
          { backgroundColor: color ?? COLOR.skyBlue },
          enhanced && styles.enhancedButton,
        ]}
      >
        <Text style={styles.emoji}>{option.emoji}</Text>
        <Text style={styles.label}>{option.label}</Text>
        <Text style={styles.amount}>{amountText}</Text>

        {enhanced && option.hydrationValue !== 1.0 && (
          <View style={styles.hydrationBadge}>
            <Text style={styles.hydrationText}>
              {option.hydrationValue > 1 ? '+' : ''}
              {Math.round((option.hydrationValue - 1) * 100)}%
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animatable.View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    minWidth: 110,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  enhancedButton: {
    minHeight: 80,
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: COLOR.skyBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  emoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  label: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  amount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  hydrationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLOR.amber,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  hydrationText: {
    color: COLOR.deepNavy,
    fontSize: 10,
    fontWeight: 'bold',
  },
});

DrinkButton.propTypes = {
  option: PropTypes.shape({
    label: PropTypes.string.isRequired,
    ml: PropTypes.number.isRequired,
    emoji: PropTypes.string.isRequired,
    hydrationValue: PropTypes.number,
    category: PropTypes.string,
  }).isRequired,
  onPress: PropTypes.func.isRequired,
  color: PropTypes.string,
  enhanced: PropTypes.bool,
  units: PropTypes.oneOf(['ml', 'oz']),
};

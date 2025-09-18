// components/VoiceLogging.js - Voice-to-text water intake logging
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Modal } from 'react-native';
import PropTypes from 'prop-types';
import * as Animatable from 'react-native-animatable';
import { COLOR } from './Theme';
import XPService from '../services/XPService';

// Mock voice recognition for demonstration (in real app, use expo-speech)
const VoiceLogging = ({ visible, onClose, onAddDrink, userProfile }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedDrink, setParsedDrink] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!visible) {
      resetState();
    }
  }, [visible]);

  const resetState = () => {
    setIsListening(false);
    setTranscript('');
    setParsedDrink(null);
    setError(null);
  };

  // Mock voice recognition - in real app, use expo-speech or similar
  const startListening = async () => {
    try {
      setIsListening(true);
      setError(null);
      
      // Simulate voice recognition delay
      setTimeout(() => {
        // Mock recognized phrases
        const mockPhrases = [
          "I drank 300 ml of water",
          "Had a large cup of tea",
          "Drank a bottle of water",
          "Consumed 250 ml coffee",
          "I had 500 ml water bottle",
          "Drank a small cup",
          "Had 400 ml sports drink"
        ];
        
        const randomPhrase = mockPhrases[Math.floor(Math.random() * mockPhrases.length)];
        setTranscript(randomPhrase);
        
        const parsed = parseVoiceInput(randomPhrase);
        setParsedDrink(parsed);
        setIsListening(false);
      }, 2000);
    } catch (err) {
      setError('Voice recognition failed. Please try again.');
      setIsListening(false);
    }
  };

  const parseVoiceInput = (text) => {
    const lowerText = text.toLowerCase();
    
    // Extract amount
    let amount = 250; // default
    const amountMatch = lowerText.match(/(\d+)\s*(ml|milliliters?|ounces?|oz|cups?)/);
    if (amountMatch) {
      let value = parseInt(amountMatch[1]);
      const unit = amountMatch[2];
      
      if (unit.includes('oz') || unit.includes('ounce')) {
        value = Math.round(value * 29.5735); // Convert oz to ml
      } else if (unit.includes('cup')) {
        value = Math.round(value * 240); // Convert cups to ml
      }
      
      amount = value;
    }
    
    // Detect drink type
    let drinkType = 'water';
    let emoji = '💧';
    let hydrationValue = 1.0;
    let category = 'water';
    
    if (lowerText.includes('coffee')) {
      drinkType = 'coffee';
      emoji = '☕';
      hydrationValue = 0.8;
      category = 'beverage';
    } else if (lowerText.includes('tea')) {
      drinkType = 'tea';
      emoji = '🍵';
      hydrationValue = 0.9;
      category = 'beverage';
    } else if (lowerText.includes('sports') || lowerText.includes('energy')) {
      drinkType = 'sports drink';
      emoji = '🥤';
      hydrationValue = 1.1;
      category = 'sports';
    } else if (lowerText.includes('juice')) {
      drinkType = 'juice';
      emoji = '🧃';
      hydrationValue = 0.7;
      category = 'beverage';
    } else if (lowerText.includes('bottle')) {
      amount = 500; // Default bottle size
      drinkType = 'water bottle';
      emoji = '🚰';
    } else if (lowerText.includes('large') || lowerText.includes('big')) {
      amount = Math.max(amount, 300);
      drinkType = 'large cup';
      emoji = '🧋';
    } else if (lowerText.includes('small')) {
      amount = Math.min(amount, 200);
      drinkType = 'small cup';
      emoji = '🥤';
    }
    
    return {
      label: drinkType,
      ml: amount,
      emoji,
      hydrationValue,
      category,
      confidence: 0.85
    };
  };

  const confirmAndAdd = async () => {
    if (parsedDrink) {
      try {
        await onAddDrink(parsedDrink);
        
        // Award XP for voice logging
        await XPService.addXP(XPService.XP_REWARDS.USE_VOICE_LOGGING, 'Voice logging');
        
        Alert.alert(
          'Added! 🎤',
          `${parsedDrink.ml}ml of ${parsedDrink.label} logged via voice! +${XPService.XP_REWARDS.USE_VOICE_LOGGING} XP`,
          [{ text: 'Great!', onPress: onClose }]
        );
      } catch (error) {
        Alert.alert('Error', 'Failed to add drink. Please try again.');
      }
    }
  };

  const editAmount = (adjustment) => {
    if (parsedDrink) {
      const newAmount = Math.max(50, parsedDrink.ml + adjustment);
      setParsedDrink({ ...parsedDrink, ml: newAmount });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animatable.View 
          animation="slideInUp"
          duration={300}
          style={styles.modal}
        >
          <View style={styles.header}>
            <Text style={styles.title}>🎤 Voice Logging</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {!isListening && !transcript && !error && (
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsTitle}>How to use Voice Logging:</Text>
                <Text style={styles.instructionItem}>
                  🗣️ Say something like "I drank 300ml of water"
                </Text>
                <Text style={styles.instructionItem}>
                  🥤 Mention the drink type: water, coffee, tea, juice
                </Text>
                <Text style={styles.instructionItem}>
                  📏 Include the amount: 250ml, 1 cup, 16 oz
                </Text>
                <Text style={styles.instructionItem}>
                  📦 Or say: small cup, large cup, bottle
                </Text>
              </View>
            )}

            {isListening && (
              <Animatable.View 
                animation="pulse" 
                iterationCount="infinite"
                style={styles.listeningContainer}
              >
                <Text style={styles.listeningEmoji}>🎙️</Text>
                <Text style={styles.listeningText}>Listening...</Text>
                <Text style={styles.listeningSubtext}>
                  Say what you drank (e.g., "I had 300ml of water")
                </Text>
              </Animatable.View>
            )}

            {transcript && !isListening && (
              <View style={styles.transcriptContainer}>
                <Text style={styles.transcriptTitle}>📝 I heard:</Text>
                <Text style={styles.transcriptText}>"{transcript}"</Text>
                
                {parsedDrink && (
                  <View style={styles.parsedContainer}>
                    <Text style={styles.parsedTitle}>🔍 Detected:</Text>
                    <View style={styles.drinkPreview}>
                      <Text style={styles.drinkEmoji}>{parsedDrink.emoji}</Text>
                      <View style={styles.drinkDetails}>
                        <Text style={styles.drinkName}>{parsedDrink.label}</Text>
                        <View style={styles.amountContainer}>
                          <TouchableOpacity 
                            onPress={() => editAmount(-50)}
                            style={styles.adjustButton}
                          >
                            <Text style={styles.adjustButtonText}>-</Text>
                          </TouchableOpacity>
                          <Text style={styles.drinkAmount}>{parsedDrink.ml}ml</Text>
                          <TouchableOpacity 
                            onPress={() => editAmount(50)}
                            style={styles.adjustButton}
                          >
                            <Text style={styles.adjustButtonText}>+</Text>
                          </TouchableOpacity>
                        </View>
                        {parsedDrink.hydrationValue !== 1.0 && (
                          <Text style={styles.hydrationNote}>
                            Hydration value: {Math.round(parsedDrink.hydrationValue * 100)}%
                          </Text>
                        )}
                      </View>
                    </View>
                    
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        onPress={resetState}
                        style={styles.retryButton}
                      >
                        <Text style={styles.retryButtonText}>🔄 Try Again</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={confirmAndAdd}
                        style={styles.confirmButton}
                      >
                        <Text style={styles.confirmButtonText}>✅ Add Drink</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={resetState} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {!isListening && !transcript && !error && (
              <TouchableOpacity 
                onPress={startListening}
                style={styles.startButton}
              >
                <Text style={styles.startButtonText}>🎤 Start Voice Logging</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.demoNote}>
            <Text style={styles.demoNoteText}>
              📝 Demo Mode: This simulates voice recognition. 
              In the full app, this would use your device's microphone.
            </Text>
          </View>
        </Animatable.View>
      </View>
    </Modal>
  );
};

const styles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLOR.deepNavy,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLOR.white,
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    fontSize: 24,
    color: COLOR.white,
    opacity: 0.7,
  },
  content: {
    minHeight: 300,
    justifyContent: 'center',
  },
  instructionsContainer: {
    backgroundColor: 'rgba(111, 231, 221, 0.1)',
    borderRadius: 15,
    padding: 20,
    borderLeftWidth: 3,
    borderLeftColor: COLOR.aquaMint,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLOR.aquaMint,
    marginBottom: 15,
  },
  instructionItem: {
    fontSize: 14,
    color: COLOR.white,
    marginBottom: 8,
    lineHeight: 20,
  },
  listeningContainer: {
    alignItems: 'center',
    padding: 40,
  },
  listeningEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  listeningText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLOR.aquaMint,
    marginBottom: 10,
  },
  listeningSubtext: {
    fontSize: 16,
    color: COLOR.white,
    opacity: 0.8,
    textAlign: 'center',
  },
  transcriptContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 20,
  },
  transcriptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLOR.skyBlue,
    marginBottom: 10,
  },
  transcriptText: {
    fontSize: 16,
    color: COLOR.white,
    fontStyle: 'italic',
    marginBottom: 20,
  },
  parsedContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 20,
  },
  parsedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLOR.amber,
    marginBottom: 15,
  },
  drinkPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  drinkEmoji: {
    fontSize: 40,
    marginRight: 15,
  },
  drinkDetails: {
    flex: 1,
  },
  drinkName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLOR.white,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  adjustButton: {
    backgroundColor: COLOR.skyBlue,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  adjustButtonText: {
    color: COLOR.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
  drinkAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLOR.aquaMint,
    minWidth: 80,
    textAlign: 'center',
  },
  hydrationNote: {
    fontSize: 12,
    color: COLOR.white,
    opacity: 0.7,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    marginRight: 10,
  },
  retryButtonText: {
    color: COLOR.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: COLOR.skyBlue,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    marginLeft: 10,
  },
  confirmButtonText: {
    color: COLOR.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLOR.coral,
    textAlign: 'center',
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: COLOR.skyBlue,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  startButtonText: {
    color: COLOR.white,
    fontSize: 18,
    fontWeight: '600',
  },
  demoNote: {
    backgroundColor: 'rgba(247, 184, 1, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginTop: 15,
    borderLeftWidth: 3,
    borderLeftColor: COLOR.amber,
  },
  demoNoteText: {
    fontSize: 12,
    color: COLOR.white,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 16,
  },
};

VoiceLogging.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAddDrink: PropTypes.func.isRequired,
  userProfile: PropTypes.object.isRequired,
};

export default VoiceLogging;
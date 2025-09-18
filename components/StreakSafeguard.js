// components/StreakSafeguard.js - Streak safeguard component
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Modal } from 'react-native';
import PropTypes from 'prop-types';
import * as Animatable from 'react-native-animatable';
import { COLOR } from './Theme';
import StreakService from '../services/StreakService';

const StreakSafeguard = ({ visible, onClose, onStreakRestored }) => {
  const [streakStats, setStreakStats] = useState(null);
  const [streakBreakers, setStreakBreakers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadStreakData();
    }
  }, [visible]);

  const loadStreakData = async () => {
    try {
      setLoading(true);
      const [stats, breakers] = await Promise.all([
        StreakService.getStreakStats(),
        StreakService.getStreakBreakers()
      ]);
      setStreakStats(stats);
      setStreakBreakers(breakers);
    } catch (error) {
      console.error('Error loading streak data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseSafeguard = (missedDate) => {
    Alert.alert(
      'Use Streak Safeguard? 🛡️',
      `This will restore your streak by marking ${missedDate} as completed. You can only use this once per month.\n\nAre you sure?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Use Safeguard',
          style: 'default',
          onPress: async () => {
            setLoading(true);
            const result = await StreakService.useStreakSafeguard(missedDate);
            setLoading(false);
            
            if (result.success) {
              Alert.alert('Streak Restored! 🎉', result.message, [
                { 
                  text: 'Awesome!', 
                  onPress: () => {
                    onStreakRestored(result.newStreak);
                    onClose();
                  }
                }
              ]);
            } else {
              Alert.alert('Unable to Restore', result.error);
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric' 
    });
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
            <Text style={styles.title}>🛡️ Streak Safeguard</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading streak data...</Text>
            </View>
          ) : (
            <>
              {streakStats && (
                <View style={styles.statsContainer}>
                  <Text style={styles.statsTitle}>📊 Your Streak Stats</Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{streakStats.currentStreak}</Text>
                      <Text style={styles.statLabel}>Current Streak</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{streakStats.longestStreak}</Text>
                      <Text style={styles.statLabel}>Longest Streak</Text>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.safeguardInfo}>
                <Text style={styles.infoTitle}>How it works:</Text>
                <Text style={styles.infoText}>
                  • Use once per month to restore a broken streak{'\n'}
                  • Select a day you missed your goal{'\n'}
                  • Your streak will be recalculated
                </Text>
                
                {streakStats?.canUseSafeguard ? (
                  <View style={styles.availableContainer}>
                    <Text style={styles.availableText}>✅ Safeguard Available</Text>
                  </View>
                ) : (
                  <View style={styles.usedContainer}>
                    <Text style={styles.usedText}>⏳ Already used this month</Text>
                    <Text style={styles.usedSubtext}>
                      Next available: {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>

              {streakBreakers.length > 0 && streakStats?.canUseSafeguard && (
                <View style={styles.breakersContainer}>
                  <Text style={styles.breakersTitle}>💔 Recent Missed Days</Text>
                  {streakBreakers.map((breaker, index) => (
                    <View key={index} style={styles.breakerItem}>
                      <View style={styles.breakerInfo}>
                        <Text style={styles.breakerDate}>
                          {formatDate(breaker.date)}
                        </Text>
                        <Text style={styles.breakerDetails}>
                          {breaker.total}ml ({breaker.shortfall}ml short)
                        </Text>
                        <Text style={styles.breakerTime}>
                          {breaker.daysAgo} days ago
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleUseSafeguard(breaker.date)}
                        style={styles.restoreButton}
                        disabled={loading}
                      >
                        <Text style={styles.restoreText}>🛡️ Restore</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {streakBreakers.length === 0 && (
                <View style={styles.noBreaksContainer}>
                  <Text style={styles.noBreaksText}>🎉 No recent missed days!</Text>
                  <Text style={styles.noBreaksSubtext}>
                    Keep up the great work with your hydration streak!
                  </Text>
                </View>
              )}

              <TouchableOpacity onPress={onClose} style={styles.doneButton}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </>
          )}
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
    maxHeight: '90%',
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: COLOR.white,
    fontSize: 16,
  },
  statsContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLOR.aquaMint,
    marginBottom: 15,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLOR.amber,
  },
  statLabel: {
    fontSize: 12,
    color: COLOR.white,
    opacity: 0.8,
    marginTop: 5,
  },
  safeguardInfo: {
    backgroundColor: 'rgba(58, 190, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: COLOR.skyBlue,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLOR.skyBlue,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLOR.white,
    lineHeight: 20,
    marginBottom: 10,
  },
  availableContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 8,
    padding: 8,
  },
  availableText: {
    color: '#22c55e',
    fontWeight: '600',
    textAlign: 'center',
  },
  usedContainer: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderRadius: 8,
    padding: 8,
  },
  usedText: {
    color: COLOR.amber,
    fontWeight: '600',
    textAlign: 'center',
  },
  usedSubtext: {
    color: COLOR.white,
    fontSize: 12,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 4,
  },
  breakersContainer: {
    marginBottom: 20,
  },
  breakersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLOR.coral,
    marginBottom: 15,
  },
  breakerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  breakerInfo: {
    flex: 1,
  },
  breakerDate: {
    fontSize: 16,
    fontWeight: '600',
    color: COLOR.white,
  },
  breakerDetails: {
    fontSize: 14,
    color: COLOR.coral,
    marginTop: 2,
  },
  breakerTime: {
    fontSize: 12,
    color: COLOR.white,
    opacity: 0.7,
    marginTop: 2,
  },
  restoreButton: {
    backgroundColor: COLOR.amber,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  restoreText: {
    color: COLOR.deepNavy,
    fontWeight: '600',
    fontSize: 14,
  },
  noBreaksContainer: {
    alignItems: 'center',
    padding: 30,
  },
  noBreaksText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLOR.aquaMint,
    marginBottom: 8,
  },
  noBreaksSubtext: {
    fontSize: 14,
    color: COLOR.white,
    opacity: 0.8,
    textAlign: 'center',
  },
  doneButton: {
    backgroundColor: COLOR.skyBlue,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  doneText: {
    color: COLOR.white,
    fontWeight: '600',
    fontSize: 16,
  },
};

StreakSafeguard.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onStreakRestored: PropTypes.func.isRequired,
};

export default StreakSafeguard;
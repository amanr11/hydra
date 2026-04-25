// screens/HomeScreen.js
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import PropTypes from 'prop-types';
import ConfettiCannon from 'react-native-confetti-cannon';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';

import GradientBackground from '../components/GradientBackground';
import DropProgress from '../components/DropProgress';
import DrinkButton from '../components/DrinkButton';
import QuickStats from '../components/QuickStats';
import XPProgress from '../components/XPProgress';
import ErrorBoundary from '../components/ErrorBoundary';
import { LoadingOverlay } from '../components/LoadingIndicator';
import { COLOR } from '../components/Theme';
import XPService from '../services/XPService';
import SoundService from '../services/SoundService';

import { useHydration } from '../hooks/useHydration';
import StorageService from '../services/StorageService';

const ML_PER_OZ = 29.5735;
const mlToOz = (ml) => Math.round(ml / ML_PER_OZ);

const enhancedDrinkOptions = [
  { label: 'Small cup', ml: 150, emoji: '🥤', hydrationValue: 1.0, category: 'water' },
  { label: 'Large cup', ml: 300, emoji: '🥛', hydrationValue: 1.0, category: 'water' },
  { label: 'Bottle', ml: 500, emoji: '🍶', hydrationValue: 1.0, category: 'water' },
  { label: 'Tea', ml: 250, emoji: '🍵', hydrationValue: 0.9, category: 'beverage' },
  { label: 'Coffee', ml: 200, emoji: '☕', hydrationValue: 0.8, category: 'beverage' },
  { label: 'Sports drink', ml: 350, emoji: '⚡', hydrationValue: 1.1, category: 'sports' },
];

const getOptionColor = (category) => {
  if (category === 'water') return COLOR.skyBlue;
  if (category === 'sports') return COLOR.amber;
  return COLOR.coral;
};

export default function HomeScreen({
  dailyGoal,
  theme,
  userProfile,
}) {
  const navigation = useNavigation();
  const { total, todayIntake, streak, userXP, loading, error, addDrink, resetDay } = useHydration(userProfile);

  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef(null);

  const [units, setUnits] = useState('ml');

  // Track thresholds already triggered this session to avoid repeated sounds
  const triggeredThresholds = useRef({ halfway: false, complete: false });

  // Compute level data from XP
  const xpData = useMemo(() => XPService.getXPSummary(userXP || 0), [userXP]);
  const prevXPData = useRef(xpData);

  useEffect(() => {
    SoundService.init();
  }, []);

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const settings = await StorageService.getSettings();
        setUnits(settings?.units === 'oz' ? 'oz' : 'ml');
      } catch (e) {
        console.error('Error loading units:', e);
        setUnits('ml');
      }
    };
    loadUnits();
  }, []);

  const showAchievementAlert = useCallback(() => {
    const goalText = units === 'oz' ? `${mlToOz(dailyGoal)}oz` : `${dailyGoal}ml`;
    Alert.alert('Goal Achieved! 🎉', `Congratulations! You've reached your daily goal of ${goalText}!`, [{ text: 'Awesome!' }]);
  }, [dailyGoal, units]);

  useEffect(() => {
    if (total >= dailyGoal && confettiRef.current && !showConfetti) {
      setShowConfetti(true);
      confettiRef.current.start();
      showAchievementAlert();
    }
  }, [total, dailyGoal, showConfetti, showAchievementAlert]);

  // Play level-up sound when XP level increases
  useEffect(() => {
    if (prevXPData.current.level < xpData.level) {
      SoundService.play('levelup');
      SoundService.haptic('success');
    }
    prevXPData.current = xpData;
  }, [xpData]);

  const percent = useMemo(() => Math.min(total / dailyGoal, 1), [total, dailyGoal]);

  // Reset threshold flags whenever the day resets (total goes back to 0)
  useEffect(() => {
    if (total === 0) {
      triggeredThresholds.current = { halfway: false, complete: false };
    }
  }, [total]);

  const handleAddDrink = useCallback(
    async (option) => {
      try {
        const result = await addDrink(option);

        if (!result?.success) {
          Alert.alert('Error', 'Failed to add drink. Please try again.');
          return;
        }

        // Always play drink sound + light haptic on any drink added
        SoundService.play('drink');
        SoundService.haptic('light');

        const prevPercent = (total / dailyGoal) * 100;
        const percentage = (result.newTotal / dailyGoal) * 100;

        // Halfway milestone (crossing 50%)
        if (percentage >= 50 && prevPercent < 50 && !triggeredThresholds.current.halfway) {
          triggeredThresholds.current.halfway = true;
          SoundService.play('halfway');
          SoundService.haptic('medium');
          Alert.alert('Great Progress!', "🎉 You're halfway to your goal!");
        }

        // Goal reached (crossing 100%)
        if (percentage >= 100 && !triggeredThresholds.current.complete) {
          triggeredThresholds.current.complete = true;
          SoundService.play('complete');
          SoundService.haptic('success');
        } else if (result.xpGained >= 25) {
          Alert.alert('XP Gained!', `🌟 +${result.xpGained} experience points!`);
        }
      } catch (e) {
        console.error('Error adding drink:', e);
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    },
    [addDrink, dailyGoal, total]
  );

  const handleResetDay = useCallback(() => {
    Alert.alert("Reset Today", "Reset today's progress and lose XP earned today? This cannot be undone.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          try {
            const success = await resetDay();
            if (success) {
              Alert.alert('Reset Complete', "Today's progress has been reset.");
              setShowConfetti(false);
            } else {
              Alert.alert('Error', 'Failed to reset. Please try again.');
            }
          } catch (e) {
            console.error('Error resetting day:', e);
            Alert.alert('Error', 'Failed to reset. Please try again.');
          }
        },
      },
    ]);
  }, [resetDay]);

  if (error) {
    return (
      <ErrorBoundary fallbackMessage={error}>
        <></>
      </ErrorBoundary>
    );
  }

  const totalText = units === 'oz' ? `${mlToOz(total || 0)} oz` : `${total || 0} ml`;
  const goalSubtitle = units === 'oz' ? `${mlToOz(dailyGoal)} goal` : `${dailyGoal} goal`;

  return (
    <LoadingOverlay visible={loading} message="Loading hydration data...">
      <GradientBackground>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
            <ConfettiCannon ref={confettiRef} count={200} origin={{ x: -10, y: 0 }} autoStart={false} fadeOut />

            {/* Header row with title and level badge */}
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginTop: 20, paddingHorizontal: 20 }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: 50,
                    fontWeight: '900',
                    color: COLOR.white,
                    textShadowColor: 'rgba(0, 0, 0, 0.8)',
                    textShadowOffset: { width: -3, height: 3 },
                    textShadowRadius: 6,
                  }}
                >
                  hydra
                </Text>
              </View>

              {/* Level Badge - top right */}
              <TouchableOpacity
                onPress={() => navigation.navigate('Settings')}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 4,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: 14,
                  padding: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(255,215,0,0.4)',
                  alignItems: 'center',
                  minWidth: 64,
                }}
                accessibilityRole="button"
                accessibilityLabel={`Level ${xpData.level}, tap to view profile`}
              >
                <Text style={{ fontSize: 10, color: COLOR.amber, fontWeight: '700', letterSpacing: 0.5 }}>
                  LV {xpData.level}
                </Text>
                <View style={{ width: 48, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                  <View style={{ width: `${xpData.progress}%`, height: '100%', backgroundColor: COLOR.amber, borderRadius: 2 }} />
                </View>
                <Text style={{ fontSize: 9, color: COLOR.white, opacity: 0.75, marginTop: 2 }}>
                  {xpData.currentXP} XP
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 18, color: COLOR.white, opacity: 0.8, marginBottom: 20, fontWeight: '500' }}>
              Hello, {userProfile.name}! 👋
            </Text>

            {/* Progress */}
            <Animatable.View animation="fadeIn" delay={250}>
              <DropProgress
                progress={percent}
                size={260}
                color={COLOR.skyBlue}
                text={totalText}
                subtitle={goalSubtitle}
                theme={theme}
              />
            </Animatable.View>

            {/* Add drink */}
            <Text style={{ marginTop: 20, marginBottom: 15, color: COLOR.aquaMint, fontWeight: '600', fontSize: 18 }}>
              💧 Add Your Drink
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 20 }}>
              {enhancedDrinkOptions.map((option) => (
                <DrinkButton
                  key={`${option.label}-${option.ml}`}
                  option={option}
                  onPress={handleAddDrink}
                  color={getOptionColor(option.category)}
                  enhanced
                  units={units}
                />
              ))}
            </View>

            {/* Quick Stats */}
            <QuickStats
              total={total}
              goal={dailyGoal}
              streak={streak}
              todayIntake={todayIntake}
              theme={theme}
              units={units}
            />

            {/* XP */}
            <XPProgress userXP={userXP} style={{ width: '90%' }} />

            {/* Reset Button */}
            <TouchableOpacity
              onPress={handleResetDay}
              style={{
                marginTop: 25,
                backgroundColor: 'rgba(255,107,107,0.2)',
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: COLOR.coral,
              }}
              accessibilityRole="button"
              accessibilityLabel="Reset today's progress"
            >
              <Text style={{ color: COLOR.coral, fontWeight: '600' }}>Reset Today</Text>
            </TouchableOpacity>

            {/* Recent intake history */}
            {todayIntake.length > 0 && (
              <View style={{ width: '90%', marginTop: 30 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: COLOR.aquaMint, marginBottom: 15 }}>
                  📊 Today's Intake
                </Text>

                <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 15, padding: 15, maxHeight: 200 }}>
                  <ScrollView nestedScrollEnabled>
                    {todayIntake
                      .slice(-5)
                      .reverse()
                      .map((drink, index) => {
                        const amount = drink.amount ?? 0;
                        const amountDisplay = units === 'oz' ? `${mlToOz(amount)}oz` : `${amount}ml`;

                        return (
                          <View
                            key={`${drink.time ?? index}-${index}`}
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              paddingVertical: 8,
                              borderBottomWidth: index < 4 ? 1 : 0,
                              borderBottomColor: 'rgba(255,255,255,0.1)',
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={{ fontSize: 20, marginRight: 10 }}>{drink.emoji}</Text>
                              <View>
                                <Text style={{ color: COLOR.white, fontWeight: '600' }}>{drink.drink}</Text>
                                <Text style={{ color: COLOR.white, opacity: 0.7, fontSize: 12 }}>
                                  {new Date(drink.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                              </View>
                            </View>
                            <Text style={{ color: COLOR.aquaMint, fontWeight: '600', fontSize: 16 }}>{amountDisplay}</Text>
                          </View>
                        );
                      })}
                  </ScrollView>
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </GradientBackground>
    </LoadingOverlay>
  );
}

HomeScreen.propTypes = {
  dailyGoal: PropTypes.number.isRequired,
  theme: PropTypes.object.isRequired,
  userProfile: PropTypes.object.isRequired,
};
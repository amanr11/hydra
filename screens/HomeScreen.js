// screens/HomeScreen.js
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import PropTypes from 'prop-types';
import ConfettiCannon from 'react-native-confetti-cannon';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';

import GradientBackground from '../components/GradientBackground';
import DropProgress from '../components/DropProgress';
import DrinkButton from '../components/DrinkButton';
import QuickStats from '../components/QuickStats';
import ErrorBoundary from '../components/ErrorBoundary';
import { LoadingOverlay } from '../components/LoadingIndicator';
import { COLOR } from '../components/Theme';
import XPService from '../services/XPService';
import SoundService from '../services/SoundService';
import RoadmapScreen from './RoadmapScreen';

import { useHydration } from '../hooks/useHydration';
import StorageService from '../services/StorageService';

const BASE_DRINK_OPTIONS = [
  { label: 'Glass', ml: 250, emoji: '🥛', hydrationValue: 1.0, category: 'water' },
  { label: 'Bottle', ml: 500, emoji: '🧴', hydrationValue: 1.0, category: 'water' },
];
const MAX_CUSTOM_BOTTLES = 3;
const MIN_CUSTOM_BOTTLE_ML = 50;
const MAX_CUSTOM_BOTTLE_ML = 2000;

export default function HomeScreen({
  dailyGoal,
  theme,
  userProfile,
}) {
  const { total, todayIntake, streak, userXP, loading, error, addDrink, resetDay } = useHydration(userProfile);

  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef(null);
  const [customBottles, setCustomBottles] = useState([]);
  const [showCustomBottleModal, setShowCustomBottleModal] = useState(false);
  const [customBottleName, setCustomBottleName] = useState('');
  const [customBottleMl, setCustomBottleMl] = useState('');
  const [customBottleEmoji, setCustomBottleEmoji] = useState('🧴');
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);

  // Compute level data from XP
  const xpData = useMemo(() => XPService.getXPSummary(userXP || 0), [userXP]);

  useEffect(() => {
    const loadCustomBottles = async () => {
      try {
        const saved = await StorageService.getCustomBottles();
        setCustomBottles(Array.isArray(saved) ? saved : []);
      } catch (e) {
        console.error('Error loading custom bottles:', e);
        setCustomBottles([]);
      }
    };
    loadCustomBottles();
  }, []);

  const showAchievementAlert = useCallback(() => {
    const goalText = `${dailyGoal}ml`;
    Alert.alert('Goal Achieved! 🎉', `Congratulations! You've reached your daily goal of ${goalText}!`, [{ text: 'Awesome!' }]);
  }, [dailyGoal]);

  useEffect(() => {
    if (total >= dailyGoal && confettiRef.current && !showConfetti) {
      setShowConfetti(true);
      confettiRef.current.start();
      showAchievementAlert();
    }
  }, [total, dailyGoal, showConfetti, showAchievementAlert]);

  // Add safety check so it defaults to 0 instead of NaN
  const percent = useMemo(() => {
    if (!dailyGoal || isNaN(total) || isNaN(dailyGoal)) return 0;
    return Math.min(total / dailyGoal, 1);
  }, [total, dailyGoal]);

  const handleAddDrink = useCallback(
    async (option) => {
      try {
        // Map 'ml' to 'amount' and 'label' to 'drink' for the hook
        const drinkPayload = {
          ...option,
          amount: option.ml,
          drink: option.label,
        };

        const result = await addDrink(drinkPayload);

        if (!result?.success) {
          Alert.alert('Error', 'Failed to add drink. Please try again.');
          return;
        }

        SoundService.play('drink');
        SoundService.haptic('light');

        const percentage = (result.newTotal / dailyGoal) * 100;

        // Keep alerts minimal (avoid spamming every tap)
        if (percentage >= 50 && percentage < 75 && total < dailyGoal * 0.5) {
          Alert.alert('Great Progress!', "🎉 You're halfway to your goal!");
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

  const drinkOptions = useMemo(
    () => [
      ...BASE_DRINK_OPTIONS,
      ...customBottles.map((bottle) => ({ ...bottle, hydrationValue: 1.0, category: 'water' })),
    ],
    [customBottles]
  );

  const saveCustomBottle = useCallback(async () => {
    const trimmedName = customBottleName.trim();
    const parsedMl = parseInt(customBottleMl, 10);
    const emoji = (customBottleEmoji || '').trim() || '🧴';

    if (!trimmedName) {
      Alert.alert('Missing Name', 'Please give your custom bottle a name.');
      return;
    }
    if (!Number.isFinite(parsedMl) || parsedMl < MIN_CUSTOM_BOTTLE_ML || parsedMl > MAX_CUSTOM_BOTTLE_ML) {
      Alert.alert('Invalid Size', `Please enter a size between ${MIN_CUSTOM_BOTTLE_ML}ml and ${MAX_CUSTOM_BOTTLE_ML}ml.`);
      return;
    }
    if (customBottles.length >= MAX_CUSTOM_BOTTLES) {
      Alert.alert('Limit Reached', `You can only create up to ${MAX_CUSTOM_BOTTLES} custom bottles.`);
      return;
    }

    const newBottle = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label: trimmedName,
      ml: parsedMl,
      emoji,
      hydrationValue: 1.0,
      category: 'water',
    };

    const updated = [...customBottles, newBottle].slice(0, MAX_CUSTOM_BOTTLES);
    const saved = await StorageService.setCustomBottles(updated);
    if (!saved) {
      Alert.alert('Error', 'Could not save custom bottle.');
      return;
    }

    setCustomBottles(updated);
    setShowCustomBottleModal(false);
    setCustomBottleName('');
    setCustomBottleMl('');
    setCustomBottleEmoji('🧴');
  }, [customBottleName, customBottleMl, customBottleEmoji, customBottles]);

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

  const totalText = `${total || 0} ml`;
  const remainingMl = Math.max(0, (dailyGoal || 0) - (total || 0));
  const goalSubtitle = remainingMl > 0 ? `${remainingMl} ml remaining` : 'Goal reached 🎉';

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
                onPress={() => setShowRoadmapModal(true)}
                style={{
                  position: 'absolute',
                  right: 10,
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
                accessibilityLabel={`Level ${xpData.level}, tap to view roadmap`}
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

            <Text style={{ fontSize: 25, color: COLOR.white, opacity: 0.8, marginBottom: 20, fontWeight: '500' }}>
              hello, {userProfile.name}! 👋
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
              {drinkOptions.map((option) => (
                <DrinkButton
                  key={option.id || `${option.label}-${option.ml}`}
                  option={option}
                  onPress={handleAddDrink}
                  color={COLOR.skyBlue}
                  enhanced
                />
              ))}

              <TouchableOpacity
                onPress={() => {
                  if (customBottles.length >= MAX_CUSTOM_BOTTLES) {
                    Alert.alert('Limit Reached', `You can create up to ${MAX_CUSTOM_BOTTLES} custom bottles.`);
                    return;
                  }
                  setShowCustomBottleModal(true);
                }}
                style={{
                  margin: 6,
                  minWidth: 110,
                  minHeight: 80,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: COLOR.aquaMint,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(111,231,221,0.12)',
                  paddingHorizontal: 10,
                  shadowColor: COLOR.aquaMint,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.28,
                  shadowRadius: 10,
                  elevation: 7,
                }}
                accessibilityRole="button"
                accessibilityLabel="Create a new custom bottle"
              >
                <Text style={{ color: COLOR.aquaMint, fontSize: 24, lineHeight: 24 }}>＋</Text>
                <Text style={{ color: COLOR.white, marginTop: 3, fontWeight: '600', textAlign: 'center', fontSize: 12 }}>
                  Create Custom Bottle
                </Text>
                <Text style={{ color: COLOR.white, opacity: 0.7, marginTop: 2, fontSize: 10 }}>
                  {customBottles.length}/{MAX_CUSTOM_BOTTLES}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Stats */}
            <QuickStats
              total={total}
              goal={dailyGoal}
              streak={streak}
              todayIntake={todayIntake}
              theme={theme}
            />

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
                        const amountDisplay = `${amount}ml`;

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

          <Modal visible={showCustomBottleModal} transparent animationType="fade" onRequestClose={() => setShowCustomBottleModal(false)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
              <View
                style={{
                  width: '100%',
                  backgroundColor: COLOR.deepNavy,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.2)',
                  padding: 16,
                }}
              >
                <Text style={{ color: COLOR.white, fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Create Custom Bottle</Text>

                <Text style={{ color: COLOR.white, opacity: 0.8, marginBottom: 6 }}>Name</Text>
                <TextInput
                  value={customBottleName}
                  onChangeText={setCustomBottleName}
                  placeholder="e.g., My Flask"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  style={{ color: COLOR.white, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 }}
                />

                <Text style={{ color: COLOR.white, opacity: 0.8, marginBottom: 6 }}>Size (ml)</Text>
                <TextInput
                  value={customBottleMl}
                  onChangeText={(t) => setCustomBottleMl(t.replace(/[^\d]/g, ''))}
                  keyboardType="numeric"
                  placeholder="e.g., 700"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  style={{ color: COLOR.white, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 }}
                />

                <Text style={{ color: COLOR.white, opacity: 0.8, marginBottom: 6 }}>Emoji</Text>
                <TextInput
                  value={customBottleEmoji}
                  onChangeText={setCustomBottleEmoji}
                  maxLength={16}
                  placeholder="🧴"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  style={{ color: COLOR.white, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 }}
                />

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
                  <TouchableOpacity onPress={() => setShowCustomBottleModal(false)} style={{ paddingHorizontal: 14, paddingVertical: 10, marginRight: 8 }}>
                    <Text style={{ color: COLOR.white, opacity: 0.8 }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={saveCustomBottle} style={{ backgroundColor: COLOR.skyBlue, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 }}>
                    <Text style={{ color: COLOR.white, fontWeight: '700' }}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal visible={showRoadmapModal} animationType="slide" onRequestClose={() => setShowRoadmapModal(false)}>
            <RoadmapScreen onClose={() => setShowRoadmapModal(false)} />
          </Modal>
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

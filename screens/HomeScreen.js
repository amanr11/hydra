// screens/HomeScreen.js - Enhanced with smart features
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import PropTypes from 'prop-types';
import ConfettiCannon from 'react-native-confetti-cannon';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientBackground from '../components/GradientBackground';
import DropProgress from '../components/DropProgress';
import DrinkButton from '../components/DrinkButton';
import WaveBottom from '../components/WaveBottom';
import QuickStats from '../components/QuickStats';
import SmartInsights from '../components/SmartInsights';
import WeatherInsights from '../components/WeatherInsights';
import XPProgress from '../components/XPProgress';
import VoiceLogging from '../components/VoiceLogging';
import ErrorBoundary from '../components/ErrorBoundary';
import { LoadingOverlay } from '../components/LoadingIndicator';
import { COLOR } from '../components/Theme';
import { useHydration } from '../hooks/useHydration';
import NotificationService from '../services/NotificationService';
import * as Animatable from 'react-native-animatable';

const enhancedDrinkOptions = [
  { label: 'Small cup', ml: 150, emoji: '🥤', hydrationValue: 1.0, category: 'water' },
  { label: 'Large cup', ml: 300, emoji: '🧋', hydrationValue: 1.0, category: 'water' },
  { label: 'Bottle', ml: 500, emoji: '🚰', hydrationValue: 1.0, category: 'water' },
  { label: 'Tea', ml: 250, emoji: '🍵', hydrationValue: 0.9, category: 'beverage' },
  { label: 'Coffee', ml: 200, emoji: '☕', hydrationValue: 0.8, category: 'beverage' },
  { label: 'Sports drink', ml: 350, emoji: '🥤', hydrationValue: 1.1, category: 'sports' },
];

export default function HomeScreen({
  dailyGoal,
  total: parentTotal,
  setTotal: setParentTotal,
  streak: parentStreak,
  setStreak: setParentStreak,
  theme,
  userProfile,
  setUserProfile
}) {
  const {
    total,
    history,
    todayIntake,
    streak,
    userXP,
    loading,
    error,
    addDrink,
    resetDay
  } = useHydration(userProfile);

  const [showConfetti, setShowConfetti] = useState(false);
  const [smartTip, setSmartTip] = useState('💡 Start your day with a glass of water!');
  const [showVoiceLogging, setShowVoiceLogging] = useState(false);
  const confettiRef = useRef();

  // Sync with parent state
  useEffect(() => {
    setParentTotal(total);
  }, [total, setParentTotal]);

  useEffect(() => {
    setParentStreak(streak);
  }, [streak, setParentStreak]);

  useEffect(() => {
    if (total >= dailyGoal && confettiRef.current && !showConfetti) {
      setShowConfetti(true);
      confettiRef.current.start();
      showAchievementAlert();
    }
  }, [total, dailyGoal, showConfetti]);

  useEffect(() => {
    setupSmartReminders();
  }, [userProfile]);

  const setupSmartReminders = async () => {
    try {
      await NotificationService.scheduleSmartReminders(userProfile);
    } catch (error) {
      console.error('Error setting up reminders:', error);
    }
  };

  const handleAddDrink = async (option) => {
    try {
      const result = await addDrink(option);
      
      if (result.success) {
        // Show encouraging messages based on progress
        const percentage = (result.newTotal / dailyGoal) * 100;
        
        if (percentage >= 100 && total < dailyGoal) {
          // Goal just completed
        } else if (percentage >= 50 && percentage < 75 && total < dailyGoal * 0.5) {
          Alert.alert('Great Progress!', '🎉 You\'re halfway to your goal!');
        } else if (result.xpGained > 0) {
          // Show XP gain for significant amounts
          if (result.xpGained >= 25) {
            Alert.alert('XP Gained!', `🌟 +${result.xpGained} experience points!`);
          }
        }
      } else {
        Alert.alert('Error', 'Failed to add drink. Please try again.');
      }
    } catch (error) {
      console.error('Error adding drink:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleResetDay = async () => {
    Alert.alert(
      'Reset Today',
      'Are you sure you want to reset today\'s progress? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const success = await resetDay();
            if (success) {
              Alert.alert('Reset Complete', 'Today\'s progress has been reset.');
              setShowConfetti(false);
            } else {
              Alert.alert('Error', 'Failed to reset. Please try again.');
            }
          }
        }
      ]
    );
  };

  const showAchievementAlert = () => {
    Alert.alert(
      'Goal Achieved! 🎉',
      `Congratulations! You've reached your daily goal of ${dailyGoal}ml!`,
      [{ text: 'Awesome!' }]
    );
  };

  const percent = Math.min(total / dailyGoal, 1);

  if (error) {
    return (
      <ErrorBoundary fallbackMessage={error}>
        <></>
      </ErrorBoundary>
    );
  }
  return (
    <LoadingOverlay visible={loading} message="Loading hydration data...">
      <GradientBackground>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView 
            contentContainerStyle={{ alignItems: 'center', paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Confetti for goal achievement */}
            <ConfettiCannon
              ref={confettiRef}
              count={200}
              origin={{ x: -10, y: 0 }}
              autoStart={false}
              fadeOut={true}
            />

            {/* Header */}
            <Text style={{
              fontSize: 50,
              fontWeight: '900',
              color: COLOR.white,
              marginTop: 20,
              textShadowColor: 'rgba(0, 0, 0, 0.8)',
              textShadowOffset: { width: -3, height: 3 },
              textShadowRadius: 6,
            }}>
              hydra
            </Text>

            <Text style={{
              fontSize: 18,
              color: COLOR.white,
              opacity: 0.8,
              marginBottom: 20,
              fontWeight: '500',
            }}>
              Hello, {userProfile.name}! 👋
            </Text>

            {/* Main Progress Drop */}
            <Animatable.View animation="fadeIn" delay={250}>
              <DropProgress
                progress={percent}
                size={260}
                color={COLOR.skyBlue}
                text={`${total || 0} ml`}
                subtitle={`${dailyGoal} goal`}
                theme={theme}
              />
            </Animatable.View>

            {/* Quick Stats */}
            <QuickStats 
              total={total}
              goal={dailyGoal}
              streak={streak}
              todayIntake={todayIntake}
              theme={theme}
            />

            {/* XP Progress */}
            <XPProgress 
              userXP={userXP}
              style={{ width: '90%' }}
            />

            {/* Weather Insights */}
            <WeatherInsights
              userProfile={userProfile}
              theme={theme}
              style={{ width: '90%' }}
            />

            {/* Drink Options */}
            <Text style={{
              marginTop: 20,
              marginBottom: 15,
              color: COLOR.aquaMint,
              fontWeight: '600',
              fontSize: 18,
            }}>
              💧 Add Your Drink
            </Text>

            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              paddingHorizontal: 20,
            }}>
              {enhancedDrinkOptions.map((option, i) => (
                <DrinkButton
                  key={i}
                  option={option}
                  onPress={handleAddDrink}
                  color={option.category === 'water' ? COLOR.skyBlue : 
                         option.category === 'sports' ? COLOR.amber : COLOR.coral}
                  enhanced={true}
                />
              ))}
            </View>

            {/* Voice Logging Button */}
            <TouchableOpacity
              onPress={() => setShowVoiceLogging(true)}
              style={{
                marginTop: 15,
                backgroundColor: 'rgba(111, 231, 221, 0.2)',
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: COLOR.aquaMint,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              accessibilityRole="button"
              accessibilityLabel="Voice logging for water intake"
            >
              <Text style={{ color: COLOR.aquaMint, fontWeight: '600', marginRight: 8 }}>
                🎤 Voice Logging
              </Text>
              <Text style={{ color: COLOR.white, opacity: 0.8, fontSize: 12 }}>
                +5 XP
              </Text>
            </TouchableOpacity>

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
              <Text style={{ color: COLOR.coral, fontWeight: '600' }}>
                Reset Today
              </Text>
            </TouchableOpacity>
            
            {/* Smart Insights */}
            {smartTip && (
              <SmartInsights tip={smartTip} theme={theme} />
            )}

            {/* Recent intake history */}
            {todayIntake.length > 0 && (
              <View style={{ width: '90%', marginTop: 30 }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: COLOR.aquaMint,
                  marginBottom: 15,
                }}>
                  📊 Today's Intake
                </Text>
                
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 15,
                  padding: 15,
                  maxHeight: 200,
                }}>
                  <ScrollView nestedScrollEnabled={true}>
                    {todayIntake.slice(-5).reverse().map((drink, index) => (
                      <View key={index} style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 8,
                        borderBottomWidth: index < 4 ? 1 : 0,
                        borderBottomColor: 'rgba(255,255,255,0.1)',
                      }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ fontSize: 20, marginRight: 10 }}>{drink.emoji}</Text>
                          <View>
                            <Text style={{ color: COLOR.white, fontWeight: '600' }}>
                              {drink.drink}
                            </Text>
                            <Text style={{ color: COLOR.white, opacity: 0.7, fontSize: 12 }}>
                              {new Date(drink.time).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </Text>
                          </View>
                        </View>
                        <Text style={{ 
                          color: COLOR.aquaMint, 
                          fontWeight: '600',
                          fontSize: 16 
                        }}>
                          {drink.amount}ml
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}
          </ScrollView>
          <WaveBottom />

          {/* Voice Logging Modal */}
          <VoiceLogging
            visible={showVoiceLogging}
            onClose={() => setShowVoiceLogging(false)}
            onAddDrink={handleAddDrink}
            userProfile={userProfile}
          />
        </SafeAreaView>
      </GradientBackground>
    </LoadingOverlay>
  );
}

// PropTypes
HomeScreen.propTypes = {
  dailyGoal: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  setTotal: PropTypes.func.isRequired,
  streak: PropTypes.number.isRequired,
  setStreak: PropTypes.func.isRequired,
  theme: PropTypes.object.isRequired,
  userProfile: PropTypes.object.isRequired,
  setUserProfile: PropTypes.func.isRequired,
};

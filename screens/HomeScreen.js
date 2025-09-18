// screens/HomeScreen.js - Enhanced with smart features
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Notifications from 'expo-notifications';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTodayKey } from '../utils';
import GradientBackground from '../components/GradientBackground';
import DropProgress from '../components/DropProgress';
import DrinkButton from '../components/DrinkButton';
import WaveBottom from '../components/WaveBottom';
import QuickStats from '../components/QuickStats';
import SmartInsights from '../components/SmartInsights';
import { COLOR } from '../components/Theme';
import * as Animatable from 'react-native-animatable';
import { useFonts } from 'expo-font'; // Add this import at the top of your file


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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
  total,
  setTotal,
  streak,
  setStreak,
  theme,
  userProfile,
  setUserProfile
}) {
  const [history, setHistory] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [smartTip, setSmartTip] = useState('💡 Start your day with a glass of water!');
  const [todayIntake, setTodayIntake] = useState([]);
  const confettiRef = useRef();

  useEffect(() => {
    loadData();
    getLocationAndWeather();
    setupSmartReminders();
  }, []);

  useEffect(() => {
    if (total >= dailyGoal && confettiRef.current && !showConfetti) {
      setShowConfetti(true);
      confettiRef.current.start();
      showAchievementAlert();
    }
  }, [total]);

  const loadData = async () => {
    try {
      const todayKey = getTodayKey();
      const savedTotal = await AsyncStorage.getItem(todayKey);
      const savedHistory = await AsyncStorage.getItem('history');
      const savedIntake = await AsyncStorage.getItem(`intake_${todayKey}`);
      
      setTotal(savedTotal ? parseInt(savedTotal) : 0);
      setHistory(savedHistory ? JSON.parse(savedHistory) : {});
      setTodayIntake(savedIntake ? JSON.parse(savedIntake) : []);
      
      await updateStreakFromHistory(savedHistory ? JSON.parse(savedHistory) : {});
    } catch (error) {
      console.log('Error loading data:', error);
    }
  };

  const getLocationAndWeather = async () => {
    // Simplified weather simulation for demo
    const mockWeather = { temp: 25, humidity: 60, condition: 'sunny' };
    
    const tips = [
      '🌅 Start your day with a glass of water!',
      '🏃‍♂️ Active lifestyle? Drink extra water today!',
      '☀️ Sunny day ahead! Perfect weather to stay hydrated.',
      '💡 Small sips throughout the day work better than chugging!',
      '🧠 Proper hydration improves focus and mental clarity.',
    ];
    
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    setSmartTip(randomTip);
  };

  const setupSmartReminders = async () => {
    // Cancel existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Schedule smart reminders based on user's schedule
    const wakeHour = parseInt(userProfile.wakeTime.split(':')[0]);
    const sleepHour = parseInt(userProfile.sleepTime.split(':')[0]);
    
    const reminders = [
      { hour: wakeHour, message: '🌅 Good morning! Start your day with a glass of water!' },
      { hour: wakeHour + 2, message: '☕ Time for your morning hydration boost!' },
      { hour: 12, message: '🍽️ Lunch time reminder: drink before you eat!' },
      { hour: 15, message: '⚡ Afternoon slump? Try water instead of coffee!' },
      { hour: 18, message: '🌆 Evening hydration check - how are you doing?' },
      { hour: sleepHour - 1, message: '🌙 Last call for hydration before bed!' },
    ];

    for (const reminder of reminders) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Hydra Reminder',
          body: reminder.message,
          data: { type: 'hydration_reminder' },
        },
        trigger: {
          hour: reminder.hour,
          minute: 0,
          repeats: true,
        },
      });
    }
  };

  const updateStreakFromHistory = async (historyData) => {
    try {
      const today = getTodayKey();
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      
      let currentStreak = 0;
      let checkDate = new Date();
      
      // Count consecutive days backwards from today
      while (true) {
        const dateKey = checkDate.toISOString().slice(0, 10);
        const dayTotal = historyData[dateKey] || 0;
        
        if (dayTotal >= dailyGoal) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      
      setStreak(currentStreak);
      await AsyncStorage.setItem('currentStreak', currentStreak.toString());
    } catch (error) {
      console.log('Error updating streak:', error);
    }
  };

  const saveData = async (newTotal) => {
    try {
      const todayKey = getTodayKey();
      await AsyncStorage.setItem(todayKey, newTotal.toString());
      
      const newHistory = { ...history, [todayKey]: newTotal };
      setHistory(newHistory);
      await AsyncStorage.setItem('history', JSON.stringify(newHistory));
      
      if (newTotal >= dailyGoal) {
        await updateStreakFromHistory(newHistory);
      }
    } catch (error) {
      console.log('Error saving data:', error);
    }
  };

  const addDrink = async (option) => {
    try {
      const effectiveML = Math.round(option.ml * option.hydrationValue);
      const newTotal = (total || 0) + effectiveML;
      const timestamp = new Date().toISOString();
      
      const newIntakeEntry = {
        time: timestamp,
        amount: effectiveML,
        drink: option.label,
        emoji: option.emoji,
        category: option.category
      };
      
      const updatedIntake = [...todayIntake, newIntakeEntry];
      setTodayIntake(updatedIntake);
      setTotal(newTotal);
      
      await saveData(newTotal);
      await AsyncStorage.setItem(`intake_${getTodayKey()}`, JSON.stringify(updatedIntake));
      
      // Show encouraging message
      if (newTotal >= dailyGoal * 0.5 && newTotal < dailyGoal * 0.75) {
        Alert.alert('Great Progress!', '🎉 You\'re halfway to your goal!');
      }
    } catch (error) {
      console.log('Error adding drink:', error);
    }
  };

  const showAchievementAlert = () => {
    Alert.alert(
      'Goal Achieved! 🎉',
      `Congratulations! You've reached your daily goal of ${dailyGoal}ml. Keep up the great work!`,
      [{ text: 'Awesome!', style: 'default' }]
    );
  };

  const resetDay = async () => {
    Alert.alert(
      'Reset Today\'s Progress?',
      'This will clear all your water intake for today. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: async () => {
            try {
              const todayKey = getTodayKey();
              setTotal(0);
              setTodayIntake([]);
              await AsyncStorage.setItem(todayKey, '0');
              await AsyncStorage.removeItem(`intake_${todayKey}`);
            } catch (error) {
              console.log('Error resetting day:', error);
            }
          }
        }
      ]
    );
  };

  const percent = Math.min((total || 0) / dailyGoal, 1);

// Inside your HomeScreen component
const [fontsLoaded] = useFonts({
    'Poppins': require('../assets/fonts/Poppins-SemiBold.ttf'), // Adjust the path as necessary
});

// Ensure fonts are loaded before rendering
if (!fontsLoaded) {
    return null; // Or a loading indicator
}

return (
    <GradientBackground>
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView
                contentContainerStyle={{
                    alignItems: 'center',
                    paddingTop: Platform.OS === 'ios' ? 24 : 16,
                    paddingBottom: 160,
                }}
                showsVerticalScrollIndicator={false}
            >
                <Text style={{
                    fontSize: 40,
                    color: COLOR.skyBlue,
                    marginBottom: 8,
                    fontFamily: 'Poppins',
                    fontWeight: '800' ,
                    textShadowColor: 'rgba(0, 0, 0, 0.8)',
                    textShadowOffset: { width: -3, height: 3 },
                    textShadowRadius: 6,
               
                }}>
                    hydra
                </Text>

                <Text style={{
                    fontSize: 18, // Increased from 16
                    color: COLOR.white,
                    opacity: 0.8,
                    marginBottom: 20,
                    fontWeight: '500', // Added weight for better visibility
                }}>
                    Hello, {userProfile.name}! 👋
                </Text>

                <Animatable.View animation="fadeIn" delay={250}>
                    <DropProgress
                        progress={percent}
                        size={260} // Increased from 220
                        color={COLOR.skyBlue}
                        text={`${total || 0} ml`}
                        subtitle={`${dailyGoal} goal`}
                        theme={theme}
                    />
                </Animatable.View>

                <QuickStats 
                    total={total}
                    goal={dailyGoal}
                    streak={streak}
                    todayIntake={todayIntake}
                    theme={theme}
                />
                
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
                            onPress={addDrink}
                            color={option.category === 'water' ? COLOR.skyBlue : 
                                         option.category === 'sports' ? COLOR.amber : COLOR.coral}
                            enhanced={true}
                        />
                    ))}
                </View>

                <TouchableOpacity
                    onPress={resetDay}
                    style={{
                        marginTop: 25,
                        backgroundColor: 'rgba(255,107,107,0.2)',
                        padding: 12,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: COLOR.coral,
                    }}
                >
                    <Text style={{ color: COLOR.coral, fontWeight: '600' }}>
                        Reset Today
                    </Text>
                </TouchableOpacity>
                
                {smartTip && (
                    <SmartInsights tip={smartTip} theme={theme} />
                )}

                {/* Recent intake history */}
                {todayIntake.length > 0 && (
                    <View style={{ width: '90%', marginTop: 30 }}>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '600',
                            color: COLOR.white,
                            marginBottom: 15,
                        }}>
                            Today's Intake 📊
                        </Text>
                        {todayIntake.slice(-5).reverse().map((entry, idx) => (
                            <Animatable.View
                                key={idx}
                                animation="fadeInUp"
                                delay={idx * 100}
                                style={{
                                    marginBottom: 8,
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    padding: 12,
                                    borderRadius: 10,
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 20, marginRight: 8 }}>{entry.emoji}</Text>
                                    <Text style={{ color: COLOR.white, fontWeight: '600' }}>
                                        {entry.drink}
                                    </Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ color: COLOR.aquaMint, fontWeight: '700' }}>
                                        {entry.amount} ml
                                    </Text>
                                    <Text style={{ color: COLOR.white, opacity: 0.7, fontSize: 12 }}>
                                        {new Date(entry.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </Text>
                                </View>
                            </Animatable.View>
                        ))}
                    </View>
                )}

                {showConfetti && (
                    <ConfettiCannon
                        ref={confettiRef}
                        count={200}
                        origin={{ x: 200, y: 0 }}
                        fadeOut={true}
                        colors={[COLOR.skyBlue, COLOR.aquaMint, COLOR.amber, COLOR.coral]}
                    />
                )}
            </ScrollView>

            <WaveBottom />
        </SafeAreaView>
    </GradientBackground>
);
}
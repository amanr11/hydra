import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './screens/HomeScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import TipsScreen from './screens/TipsScreen';
import ChallengesScreen from './screens/ChallengesScreen';
import { useColorScheme } from 'react-native';
import { COLOR } from './components/Theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Tab = createBottomTabNavigator();

export default function App() {
  const colorScheme = useColorScheme();
  const [darkMode, setDarkMode] = useState(colorScheme === 'dark');
  const [streak, setStreak] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [total, setTotal] = useState(0);
  const [userProfile, setUserProfile] = useState({
    name: 'Hydration Hero',
    weight: 70,
    activityLevel: 'moderate',
    wakeTime: '07:00',
    sleepTime: '23:00'
  });

  const theme = darkMode
    ? { background: COLOR.charcoal, text: COLOR.white, secondary: '#0f1720', accent: COLOR.skyBlue }
    : { background: COLOR.deepNavy, text: COLOR.white, secondary: COLOR.softGray, accent: COLOR.skyBlue };

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem('userProfile');
      const savedStreak = await AsyncStorage.getItem('currentStreak');
      const savedGoal = await AsyncStorage.getItem('dailyGoal');
      
      if (savedProfile) setUserProfile(JSON.parse(savedProfile));
      if (savedStreak) setStreak(parseInt(savedStreak));
      if (savedGoal) setDailyGoal(parseInt(savedGoal));
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{ 
          headerShown: false, 
          tabBarActiveTintColor: COLOR.skyBlue,
          tabBarInactiveTintColor: COLOR.textMuted,
          tabBarStyle: {
            backgroundColor: theme.background,
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
            height: 70,
            paddingBottom: 10,
            paddingTop: 10,
          }
        }}
      >
        <Tab.Screen
          name="Home"
          options={{ tabBarIcon: ({color,size})=><Ionicons name="water-outline" color={color} size={size}/> }}
        >
          {() => (
            <HomeScreen
              dailyGoal={dailyGoal}
              total={total}
              setTotal={setTotal}
              streak={streak}
              setStreak={setStreak}
              theme={theme}
              userProfile={userProfile}
              setUserProfile={setUserProfile}
            />
          )}
        </Tab.Screen>

        <Tab.Screen
          name="History"
          options={{ tabBarIcon: ({color,size})=><Ionicons name="book-outline" color={color} size={size}/> }}
        >
          {() => <HistoryScreen dailyGoal={dailyGoal} theme={theme} />}
        </Tab.Screen>

        <Tab.Screen
          name="Challenges"
          options={{ tabBarIcon: ({color,size})=><Ionicons name="trophy-outline" color={color} size={size}/> }}
        >
          {() => <ChallengesScreen streak={streak} theme={theme} userProfile={userProfile} />}
        </Tab.Screen>

        <Tab.Screen
          name="Settings"
          options={{ tabBarIcon: ({color,size})=><Ionicons name="settings-outline" color={color} size={size}/> }}
        >
          {() => (
            <SettingsScreen 
              dailyGoal={dailyGoal} 
              setDailyGoal={setDailyGoal} 
              darkMode={darkMode} 
              setDarkMode={setDarkMode}
              theme={theme}
              userProfile={userProfile}
              setUserProfile={setUserProfile}
            />
          )}
        </Tab.Screen>

        <Tab.Screen
          name="Tips"
          options={{ tabBarIcon: ({color,size})=><Ionicons name="bulb-outline" color={color} size={size}/> }}
        >
          {() => <TipsScreen theme={theme} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
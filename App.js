import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './screens/HomeScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import AchievementsScreen from './screens/AchievementsScreen';
import TipsScreen from './screens/TipsScreen';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function App() {
  const colorScheme = useColorScheme(); 
  const [darkMode, setDarkMode] = useState(colorScheme === 'dark');
  const [streak, setStreak] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [total, setTotal] = useState(0); // <-- add this
  

  const theme = darkMode
    ? { background:'#121212', text:'#fff', secondary:'#1f1f1f', primary:'#28a745', accent:'#f1c40f' }
    : { background:'#fff', text:'#222', secondary:'#f5f5f5', primary:'#28a745', accent:'#f1c40f' };

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown:false }}>
        <Tab.Screen name="Home" options={{ tabBarIcon: ({color,size})=><Ionicons name="water-outline" color={color} size={size}/> }}>
        {() => (
          <HomeScreen
            dailyGoal={dailyGoal}
            total={total}            // <-- add this
            setTotal={setTotal}      // <-- and this
            streak={streak}
            setStreak={setStreak}
            theme={theme}
          />
        )}
        </Tab.Screen>
        <Tab.Screen name="History" options={{ tabBarIcon: ({color,size})=><Ionicons name="book-outline" color={color} size={size}/> }}>
          {() => <HistoryScreen dailyGoal={dailyGoal} theme={theme} />}
        </Tab.Screen>
        <Tab.Screen name="Settings" options={{ tabBarIcon: ({color,size})=><Ionicons name="settings-outline" color={color} size={size}/> }}>
          {() => <SettingsScreen dailyGoal={dailyGoal} setDailyGoal={setDailyGoal} darkMode={darkMode} setDarkMode={setDarkMode} />}
        </Tab.Screen>
        <Tab.Screen name="Achievements" options={{ tabBarIcon: ({color,size})=><Ionicons name="trophy-outline" color={color} size={size}/> }}>
          {() => <AchievementsScreen streak={streak} theme={theme} />}
        </Tab.Screen>
        <Tab.Screen name="Tips" options={{ tabBarIcon: ({color,size})=><Ionicons name="bulb-outline" color={color} size={size}/> }}>
          {() => <TipsScreen theme={theme} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

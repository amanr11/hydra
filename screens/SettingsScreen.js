import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, Alert, Platform, ScrollView, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import WaveBottom from '../components/WaveBottom';
import GradientBackground from '../components/GradientBackground';
import { COLOR } from '../components/Theme';

export default function SettingsScreen({ 
  dailyGoal, 
  setDailyGoal, 
  darkMode, 
  setDarkMode, 
  theme,
  userProfile,
  setUserProfile 
}) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [testTime, setTestTime] = useState(new Date());
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const updateProfile = async (updates) => {
    const newProfile = { ...userProfile, ...updates };
    setUserProfile(newProfile);
    await AsyncStorage.setItem('userProfile', JSON.stringify(newProfile));
  };

  const scheduleTestNotification = async (minutes = 0) => {
    const trigger = minutes > 0 ? { seconds: minutes * 60, repeats: false } : null;
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Hydra Test', body: '💧 Stay hydrated!' },
      trigger,
    });
    Alert.alert('Test Notification Scheduled', minutes > 0 ? `In ${minutes} mins` : 'Instantly');
  };

  const onTimeChange = (event, selectedTime) => {
    const current = selectedTime || testTime;
    setPickerVisible(Platform.OS === 'ios');
    setTestTime(current);
    scheduleTestNotification(Math.ceil((current.getTime() - Date.now()) / 60000));
  };

  const requestNotificationPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setNotificationsEnabled(status === 'granted');
    if (status !== 'granted') {
      Alert.alert('Notifications Disabled', 'Please enable notifications in your device settings to receive hydration reminders.');
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1, padding: 20 }} showsVerticalScrollIndicator={false}>
          <Animatable.Text 
            animation="fadeInDown" 
            style={{ fontSize: 28, fontWeight: 'bold', color: COLOR.white, marginBottom: 25 }}
          >
            ⚙️ Settings
          </Animatable.Text>

          {/* Profile Section */}
          <View style={{ marginBottom: 30 }}>
            <Text style={{ fontSize: 20, fontWeight: '600', color: COLOR.aquaMint, marginBottom: 15 }}>
              👤 Profile
            </Text>
            
            <View style={settingCardStyle}>
              <Text style={settingLabelStyle}>Name</Text>
              <TextInput
                style={textInputStyle}
                value={userProfile.name}
                onChangeText={(text) => updateProfile({ name: text })}
                placeholder="Enter your name"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            </View>

            <View style={settingCardStyle}>
              <Text style={settingLabelStyle}>Weight (kg)</Text>
              <TextInput
                style={textInputStyle}
                value={userProfile.weight?.toString() || ''}
                onChangeText={(text) => updateProfile({ weight: parseInt(text) || 70 })}
                placeholder="70"
                placeholderTextColor="rgba(255,255,255,0.5)"
                keyboardType="numeric"
              />
            </View>

            <View style={settingCardStyle}>
              <Text style={settingLabelStyle}>Activity Level</Text>
              <View style={{ flexDirection: 'row', marginTop: 10 }}>
                {['low', 'moderate', 'high'].map(level => (
                  <TouchableOpacity
                    key={level}
                    onPress={() => updateProfile({ activityLevel: level })}
                    style={[
                      activityButtonStyle,
                      { backgroundColor: userProfile.activityLevel === level ? COLOR.skyBlue : 'rgba(255,255,255,0.2)' }
                    ]}
                  >
                    <Text style={{ 
                      color: COLOR.white, 
                      fontWeight: userProfile.activityLevel === level ? '700' : '500',
                      fontSize: 12,
                      textTransform: 'capitalize'
                    }}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Daily Goal Section */}
          <View style={{ marginBottom: 30 }}>
            <Text style={{ fontSize: 20, fontWeight: '600', color: COLOR.aquaMint, marginBottom: 15 }}>
              🎯 Daily Goal
            </Text>
            <View style={settingCardStyle}>
              <Text style={settingLabelStyle}>Target: {dailyGoal} ml</Text>
              <View style={{ flexDirection: 'row', marginTop: 12, flexWrap: 'wrap' }}>
                {[1500, 2000, 2500, 3000, 3500].map(val => (
                  <TouchableOpacity
                    key={val}
                    onPress={() => setDailyGoal(val)}
                    style={[
                      goalButtonStyle,
                      { backgroundColor: dailyGoal === val ? COLOR.amber : COLOR.skyBlue }
                    ]}
                  >
                    <Text style={{ color: COLOR.white, fontWeight: 'bold', fontSize: 12 }}>
                      {val} ml
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* App Preferences */}
          <View style={{ marginBottom: 30 }}>
            <Text style={{ fontSize: 20, fontWeight: '600', color: COLOR.aquaMint, marginBottom: 15 }}>
              🎨 Preferences
            </Text>
            
            <View style={[settingCardStyle, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
              <Text style={settingLabelStyle}>Dark Mode</Text>
              <Switch 
                value={darkMode} 
                onValueChange={toggleDarkMode}
                trackColor={{ false: 'rgba(255,255,255,0.3)', true: COLOR.skyBlue }}
                thumbColor={darkMode ? COLOR.aquaMint : COLOR.white}
              />
            </View>

            <View style={[settingCardStyle, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
              <Text style={settingLabelStyle}>Notifications</Text>
              <Switch 
                value={notificationsEnabled} 
                onValueChange={requestNotificationPermission}
                trackColor={{ false: 'rgba(255,255,255,0.3)', true: COLOR.skyBlue }}
                thumbColor={notificationsEnabled ? COLOR.aquaMint : COLOR.white}
              />
            </View>
          </View>

          {/* Test Notifications */}
          <View style={{ marginBottom: 30 }}>
            <Text style={{ fontSize: 20, fontWeight: '600', color: COLOR.aquaMint, marginBottom: 15 }}>
              🔔 Test Notifications
            </Text>
            
            <TouchableOpacity
              onPress={() => scheduleTestNotification(0)}
              style={[actionButtonStyle, { backgroundColor: COLOR.amber }]}
            >
              <Text style={actionButtonTextStyle}>Send Test Notification</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setPickerVisible(true)}
              style={[actionButtonStyle, { backgroundColor: COLOR.skyBlue }]}
            >
              <Text style={actionButtonTextStyle}>Schedule in 1 Minute</Text>
            </TouchableOpacity>
            
            {pickerVisible && (
              <DateTimePicker
                value={testTime}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={onTimeChange}
              />
            )}
          </View>

          {/* Data Management */}
          <View style={{ marginBottom: 50 }}>
            <Text style={{ fontSize: 20, fontWeight: '600', color: COLOR.aquaMint, marginBottom: 15 }}>
              📊 Data
            </Text>
            
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Reset All Data?',
                  'This will permanently delete all your hydration history. This action cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Reset', 
                      style: 'destructive',
                      onPress: async () => {
                        await AsyncStorage.multiRemove(['history', 'currentStreak', 'completedAchievements']);
                        Alert.alert('Data Reset', 'All data has been cleared successfully.');
                      }
                    }
                  ]
                );
              }}
              style={[actionButtonStyle, { backgroundColor: COLOR.coral }]}
            >
              <Text style={actionButtonTextStyle}>Reset All Data</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <WaveBottom />
      </SafeAreaView>
    </GradientBackground>
  );
}

const settingCardStyle = {
  backgroundColor: 'rgba(255,255,255,0.1)',
  borderRadius: 12,
  padding: 15,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.2)',
};

const settingLabelStyle = {
  fontSize: 16,
  color: COLOR.white,
  fontWeight: '600',
  marginBottom: 8,
};

const textInputStyle = {
  backgroundColor: 'rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: 12,
  color: COLOR.white,
  fontSize: 16,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.2)',
};

const activityButtonStyle = {
  margin: 4,
  padding: 8,
  borderRadius: 8,
  minWidth: 60,
  alignItems: 'center',
};

const goalButtonStyle = {
  margin: 4,
  padding: 10,
  borderRadius: 8,
  minWidth: 70,
  alignItems: 'center',
};

const actionButtonStyle = {
  padding: 15,
  borderRadius: 12,
  alignItems: 'center',
  marginBottom: 10,
};

const actionButtonTextStyle = {
  color: COLOR.white,
  fontWeight: 'bold',
  fontSize: 16,
};
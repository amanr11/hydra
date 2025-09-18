import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, Alert, ScrollView, TextInput } from 'react-native';
import PropTypes from 'prop-types';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import WaveBottom from '../components/WaveBottom';
import GradientBackground from '../components/GradientBackground';
import StreakSafeguard from '../components/StreakSafeguard';
import CustomReminders from '../components/CustomReminders';
import { LoadingOverlay } from '../components/LoadingIndicator';
import { COLOR } from '../components/Theme';
import StorageService from '../services/StorageService';
import NotificationService from '../services/NotificationService';
import StreakService from '../services/StreakService';

export default function SettingsScreen({ 
  dailyGoal, 
  setDailyGoal, 
  darkMode, 
  setDarkMode, 
  theme,
  userProfile,
  setUserProfile 
}) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showStreakSafeguard, setShowStreakSafeguard] = useState(false);
  const [showCustomReminders, setShowCustomReminders] = useState(false);
  const [streakStats, setStreakStats] = useState(null);
  const [tempGoal, setTempGoal] = useState(dailyGoal.toString());

  useEffect(() => {
    loadSettings();
    loadStreakStats();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const savedSettings = await StorageService.getSettings();
      setSettings(savedSettings);
      setNotificationsEnabled(savedSettings.notificationsEnabled);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStreakStats = async () => {
    try {
      const stats = await StreakService.getStreakStats();
      setStreakStats(stats);
    } catch (error) {
      console.error('Error loading streak stats:', error);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await StorageService.setSettings(newSettings);
      
      // Update state
      if (key === 'notificationsEnabled') {
        setNotificationsEnabled(value);
        if (value) {
          await NotificationService.scheduleSmartReminders(userProfile);
        } else {
          await NotificationService.cancelAllReminders();
        }
      }
    } catch (error) {
      console.error(`Error updating setting ${key}:`, error);
    }
  };

  const updateProfile = async (updates) => {
    try {
      const newProfile = { ...userProfile, ...updates };
      setUserProfile(newProfile);
      await StorageService.setUserProfile(newProfile);
      
      // Reschedule smart reminders if notifications are enabled
      if (notificationsEnabled) {
        await NotificationService.scheduleSmartReminders(newProfile);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const updateDailyGoal = async () => {
    try {
      const newGoal = parseInt(tempGoal);
      if (isNaN(newGoal) || newGoal < 500 || newGoal > 5000) {
        Alert.alert('Invalid Goal', 'Please enter a goal between 500ml and 5000ml.');
        setTempGoal(dailyGoal.toString());
        return;
      }
      
      setDailyGoal(newGoal);
      await StorageService.setDailyGoal(newGoal);
      Alert.alert('Goal Updated', `Your daily goal is now ${newGoal}ml!`);
    } catch (error) {
      console.error('Error updating daily goal:', error);
      Alert.alert('Error', 'Failed to update daily goal.');
    }
  };

  const testNotification = async () => {
    try {
      const success = await NotificationService.testNotification();
      if (success) {
        Alert.alert('Test Sent!', 'Check your notifications to see if it worked.');
      } else {
        Alert.alert('Permission Needed', 'Please enable notifications in your device settings.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification.');
    }
  };

  const resetAllData = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all your hydration history, streaks, XP, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset Everything', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await StorageService.clearAllData();
              await NotificationService.cancelAllReminders();
              Alert.alert('Data Reset', 'All data has been cleared successfully. Please restart the app.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset data.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleStreakRestored = (newStreak) => {
    loadStreakStats(); // Refresh streak stats
  };

  if (!settings) {
    return (
      <LoadingOverlay visible={true} message="Loading settings...">
        <GradientBackground>
          <SafeAreaView style={{ flex: 1 }} />
        </GradientBackground>
      </LoadingOverlay>
    );
  }
  return (
    <LoadingOverlay visible={loading} message="Updating settings...">
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
              <Text style={sectionTitleStyle}>👤 Profile</Text>
              
              <View style={settingCardStyle}>
                <Text style={settingLabelStyle}>Name</Text>
                <TextInput
                  style={textInputStyle}
                  value={userProfile.name}
                  onChangeText={(text) => updateProfile({ name: text })}
                  placeholder="Enter your name"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  maxLength={30}
                />
              </View>

              <View style={settingCardStyle}>
                <Text style={settingLabelStyle}>Weight (kg)</Text>
                <TextInput
                  style={textInputStyle}
                  value={userProfile.weight?.toString() || ''}
                  onChangeText={(text) => {
                    const weight = parseInt(text) || 70;
                    if (weight >= 30 && weight <= 200) {
                      updateProfile({ weight });
                    }
                  }}
                  placeholder="70"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>

              <View style={settingCardStyle}>
                <Text style={settingLabelStyle}>Activity Level</Text>
                <View style={{ flexDirection: 'row', marginTop: 10, justifyContent: 'space-between' }}>
                  {[
                    { key: 'low', label: 'Light', emoji: '🚶‍♂️' },
                    { key: 'moderate', label: 'Moderate', emoji: '🏃‍♂️' },
                    { key: 'high', label: 'Active', emoji: '💪' }
                  ].map(level => (
                    <TouchableOpacity
                      key={level.key}
                      onPress={() => updateProfile({ activityLevel: level.key })}
                      style={[
                        activityButtonStyle,
                        { backgroundColor: userProfile.activityLevel === level.key ? COLOR.skyBlue : 'rgba(255,255,255,0.1)' }
                      ]}
                    >
                      <Text style={{ fontSize: 20, marginBottom: 4 }}>{level.emoji}</Text>
                      <Text style={{ 
                        color: COLOR.white, 
                        fontWeight: userProfile.activityLevel === level.key ? '700' : '500',
                        fontSize: 12
                      }}>
                        {level.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Daily Goal Section */}
            <View style={{ marginBottom: 30 }}>
              <Text style={sectionTitleStyle}>🎯 Daily Goal</Text>
              <View style={settingCardStyle}>
                <Text style={settingLabelStyle}>Current Goal: {dailyGoal} ml</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                  <TextInput
                    style={[textInputStyle, { flex: 1, marginRight: 10 }]}
                    value={tempGoal}
                    onChangeText={setTempGoal}
                    placeholder="2000"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    keyboardType="numeric"
                    maxLength={4}
                  />
                  <TouchableOpacity onPress={updateDailyGoal} style={miniButtonStyle}>
                    <Text style={{ color: COLOR.white, fontWeight: '600' }}>Update</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={{ color: COLOR.white, opacity: 0.7, fontSize: 12, marginTop: 8 }}>
                  Quick presets:
                </Text>
                <View style={{ flexDirection: 'row', marginTop: 8, flexWrap: 'wrap' }}>
                  {[1500, 2000, 2500, 3000, 3500].map(val => (
                    <TouchableOpacity
                      key={val}
                      onPress={() => {
                        setTempGoal(val.toString());
                        setDailyGoal(val);
                        StorageService.setDailyGoal(val);
                      }}
                      style={[
                        goalButtonStyle,
                        { backgroundColor: dailyGoal === val ? COLOR.amber : COLOR.skyBlue }
                      ]}
                    >
                      <Text style={{ color: COLOR.white, fontWeight: '600', fontSize: 12 }}>
                        {val}ml
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Notifications Section */}
            <View style={{ marginBottom: 30 }}>
              <Text style={sectionTitleStyle}>🔔 Notifications</Text>
              
              <View style={[settingCardStyle, switchRowStyle]}>
                <Text style={settingLabelStyle}>Enable Notifications</Text>
                <Switch 
                  value={notificationsEnabled} 
                  onValueChange={(value) => updateSetting('notificationsEnabled', value)}
                  trackColor={{ false: 'rgba(255,255,255,0.3)', true: COLOR.skyBlue }}
                  thumbColor={notificationsEnabled ? COLOR.white : COLOR.white}
                />
              </View>

              <TouchableOpacity 
                onPress={() => setShowCustomReminders(true)}
                style={settingCardStyle}
              >
                <Text style={settingLabelStyle}>🔧 Custom Reminders</Text>
                <Text style={settingDescStyle}>Set up your own reminder schedule</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={testNotification} style={miniButtonContainerStyle}>
                <Text style={miniButtonTextStyle}>🧪 Send Test Notification</Text>
              </TouchableOpacity>
            </View>

            {/* Streak Management */}
            <View style={{ marginBottom: 30 }}>
              <Text style={sectionTitleStyle}>🔥 Streak Management</Text>
              
              {streakStats && (
                <View style={settingCardStyle}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLOR.amber }}>
                        {streakStats.currentStreak}
                      </Text>
                      <Text style={{ color: COLOR.white, opacity: 0.8, fontSize: 12 }}>
                        Current
                      </Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLOR.aquaMint }}>
                        {streakStats.longestStreak}
                      </Text>
                      <Text style={{ color: COLOR.white, opacity: 0.8, fontSize: 12 }}>
                        Longest
                      </Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLOR.skyBlue }}>
                        {streakStats.successfulDays}
                      </Text>
                      <Text style={{ color: COLOR.white, opacity: 0.8, fontSize: 12 }}>
                        Total Days
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={{ color: COLOR.white, opacity: 0.9, textAlign: 'center' }}>
                    {StreakService.getStreakMotivation(streakStats.currentStreak)}
                  </Text>
                </View>
              )}

              <TouchableOpacity 
                onPress={() => setShowStreakSafeguard(true)}
                style={settingCardStyle}
              >
                <Text style={settingLabelStyle}>🛡️ Streak Safeguard</Text>
                <Text style={settingDescStyle}>
                  {streakStats?.canUseSafeguard ? 
                    'Available - Restore a broken streak (once per month)' : 
                    'Used this month - Next available next month'
                  }
                </Text>
              </TouchableOpacity>
            </View>

            {/* Accessibility Section */}
            <View style={{ marginBottom: 30 }}>
              <Text style={sectionTitleStyle}>♿ Accessibility</Text>
              
              <View style={[settingCardStyle, switchRowStyle]}>
                <Text style={settingLabelStyle}>Large Font Mode</Text>
                <Switch 
                  value={settings.largeFontMode} 
                  onValueChange={(value) => updateSetting('largeFontMode', value)}
                  trackColor={{ false: 'rgba(255,255,255,0.3)', true: COLOR.skyBlue }}
                  thumbColor={settings.largeFontMode ? COLOR.white : COLOR.white}
                />
              </View>

              <View style={[settingCardStyle, switchRowStyle]}>
                <Text style={settingLabelStyle}>High Contrast Mode</Text>
                <Switch 
                  value={settings.highContrastMode} 
                  onValueChange={(value) => updateSetting('highContrastMode', value)}
                  trackColor={{ false: 'rgba(255,255,255,0.3)', true: COLOR.skyBlue }}
                  thumbColor={settings.highContrastMode ? COLOR.white : COLOR.white}
                />
              </View>

              <View style={[settingCardStyle, switchRowStyle]}>
                <Text style={settingLabelStyle}>Voice Logging</Text>
                <Switch 
                  value={settings.voiceLoggingEnabled} 
                  onValueChange={(value) => updateSetting('voiceLoggingEnabled', value)}
                  trackColor={{ false: 'rgba(255,255,255,0.3)', true: COLOR.skyBlue }}
                  thumbColor={settings.voiceLoggingEnabled ? COLOR.white : COLOR.white}
                />
              </View>
            </View>

            {/* App Preferences */}
            <View style={{ marginBottom: 30 }}>
              <Text style={sectionTitleStyle}>🎨 App Preferences</Text>
              
              <View style={[settingCardStyle, switchRowStyle]}>
                <Text style={settingLabelStyle}>Dark Mode</Text>
                <Switch 
                  value={darkMode} 
                  onValueChange={setDarkMode}
                  trackColor={{ false: 'rgba(255,255,255,0.3)', true: COLOR.skyBlue }}
                  thumbColor={darkMode ? COLOR.white : COLOR.white}
                />
              </View>
            </View>

            {/* Data Management */}
            <View style={{ marginBottom: 50 }}>
              <Text style={sectionTitleStyle}>📊 Data Management</Text>
              
              <TouchableOpacity onPress={resetAllData} style={dangerButtonStyle}>
                <Text style={dangerButtonTextStyle}>🗑️ Reset All Data</Text>
                <Text style={{ color: COLOR.white, opacity: 0.8, fontSize: 12, marginTop: 4 }}>
                  This will delete everything permanently
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          <WaveBottom />

          {/* Modals */}
          <StreakSafeguard 
            visible={showStreakSafeguard}
            onClose={() => setShowStreakSafeguard(false)}
            onStreakRestored={handleStreakRestored}
          />

          <CustomReminders
            visible={showCustomReminders}
            onClose={() => setShowCustomReminders(false)}
          />
        </SafeAreaView>
      </GradientBackground>
    </LoadingOverlay>
  );
}

// Styles
const sectionTitleStyle = {
  fontSize: 20,
  fontWeight: '600',
  color: COLOR.aquaMint,
  marginBottom: 15,
};

const settingCardStyle = {
  backgroundColor: 'rgba(255,255,255,0.1)',
  borderRadius: 12,
  padding: 15,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.2)',
};

const switchRowStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const settingLabelStyle = {
  fontSize: 16,
  color: COLOR.white,
  fontWeight: '600',
};

const settingDescStyle = {
  fontSize: 14,
  color: COLOR.white,
  opacity: 0.8,
  marginTop: 5,
};

const textInputStyle = {
  backgroundColor: 'rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: 12,
  color: COLOR.white,
  fontSize: 16,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.2)',
  marginTop: 8,
};

const activityButtonStyle = {
  flex: 1,
  padding: 12,
  borderRadius: 10,
  alignItems: 'center',
  marginHorizontal: 4,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.2)',
};

const goalButtonStyle = {
  margin: 4,
  padding: 8,
  borderRadius: 8,
  minWidth: 60,
  alignItems: 'center',
};

const miniButtonStyle = {
  backgroundColor: COLOR.skyBlue,
  borderRadius: 8,
  paddingHorizontal: 15,
  paddingVertical: 8,
};

const miniButtonContainerStyle = {
  backgroundColor: COLOR.amber,
  borderRadius: 10,
  padding: 12,
  alignItems: 'center',
  marginTop: 10,
};

const miniButtonTextStyle = {
  color: COLOR.white,
  fontWeight: '600',
  fontSize: 14,
};

const dangerButtonStyle = {
  backgroundColor: 'rgba(255, 107, 107, 0.2)',
  borderRadius: 12,
  padding: 15,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: COLOR.coral,
};

const dangerButtonTextStyle = {
  color: COLOR.coral,
  fontWeight: '600',
  fontSize: 16,
};

// PropTypes
SettingsScreen.propTypes = {
  dailyGoal: PropTypes.number.isRequired,
  setDailyGoal: PropTypes.func.isRequired,
  darkMode: PropTypes.bool.isRequired,
  setDarkMode: PropTypes.func.isRequired,
  theme: PropTypes.object.isRequired,
  userProfile: PropTypes.object.isRequired,
  setUserProfile: PropTypes.func.isRequired,
};
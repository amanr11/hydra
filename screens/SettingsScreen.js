import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Switch, Alert, ScrollView, TextInput } from 'react-native';
import PropTypes from 'prop-types';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';

import GradientBackground from '../components/GradientBackground';
import StreakSafeguard from '../components/StreakSafeguard';
import CustomReminders from '../components/CustomReminders';
import { LoadingOverlay } from '../components/LoadingIndicator';
import { COLOR } from '../components/Theme';
import XPService from '../services/XPService';

import StorageService from '../services/StorageService';
import NotificationService from '../services/NotificationService';
import StreakService from '../services/StreakService';
import AuthService from '../services/AuthService';
import { isFirebaseConfigured } from '../firebase';
import { calculateSmartGoal } from '../utils';

// ---- helpers ----
const ML_PER_OZ = 29.5735;
const toOz = (ml) => Math.round(ml / ML_PER_OZ);
const toMl = (oz) => Math.round(oz * ML_PER_OZ);

const DEFAULT_WAKE_TIME = '07:00';
const DEFAULT_SLEEP_TIME = '23:00';
const parseHHMM = (value, fallback = { hour: 7, minute: 0 }) => {
  if (!value || typeof value !== 'string') return fallback;
  const [hRaw, mRaw] = value.split(':');
  const h = parseInt(hRaw, 10);
  const m = parseInt(mRaw ?? '0', 10);
  if (!Number.isFinite(h) || h < 0 || h > 23 || !Number.isFinite(m) || m < 0 || m > 59) return fallback;
  return { hour: h, minute: m };
};

const formatHHMM = (hour, minute) => {
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return `${hh}:${mm}`;
};


export default function SettingsScreen({
  dailyGoal,
  setDailyGoal,
  darkMode,
  setDarkMode,
  userProfile,
  setUserProfile,
}) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userXP, setUserXP] = useState(0);

  const [showStreakSafeguard, setShowStreakSafeguard] = useState(false);
  const [showCustomReminders, setShowCustomReminders] = useState(false);
  const [streakStats, setStreakStats] = useState(null);

  // draft profile (only saved when pressing Save Profile)
  const [draftName, setDraftName] = useState(userProfile.name ?? '');
  const [draftWeight, setDraftWeight] = useState(userProfile.weight?.toString?.() ?? '');
  const [draftActivityLevel, setDraftActivityLevel] = useState(userProfile.activityLevel ?? 'moderate');

  // wake/sleep (stored in profile; used by smart reminders)
  const [draftWakeTime, setDraftWakeTime] = useState(userProfile.wakeTime ?? DEFAULT_WAKE_TIME);
  const [draftSleepTime, setDraftSleepTime] = useState(userProfile.sleepTime ?? DEFAULT_SLEEP_TIME);

  // goal editing
  const [tempGoal, setTempGoal] = useState(String(dailyGoal));

  const goalPresets = useMemo(() => [1500, 2000, 2500, 3000, 3500], []);

  useEffect(() => {
    loadSettings();
    loadStreakStats();
    loadXP();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep drafts in sync when profile changes externally
  useEffect(() => {
    setDraftName(userProfile.name ?? '');
    setDraftWeight(userProfile.weight?.toString?.() ?? '');
    setDraftActivityLevel(userProfile.activityLevel ?? 'moderate');
    setDraftWakeTime(userProfile.wakeTime ?? DEFAULT_WAKE_TIME);
    setDraftSleepTime(userProfile.sleepTime ?? DEFAULT_SLEEP_TIME);
  }, [userProfile]);

  useEffect(() => {
    setTempGoal(String(dailyGoal));
  }, [dailyGoal]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const savedSettings = await StorageService.getSettings();

      // migrate if older settings exist
      const migrated = {
        notificationsEnabled: savedSettings?.notificationsEnabled ?? true,
        reminderFrequency: savedSettings?.reminderFrequency ?? 'smart',
        customReminders: savedSettings?.customReminders ?? [],
        units: savedSettings?.units ?? 'ml',
        soundEnabled: savedSettings?.soundEnabled ?? true,
        hapticsEnabled: savedSettings?.hapticsEnabled ?? true,
      };

      setSettings(migrated);
      setNotificationsEnabled(!!migrated.notificationsEnabled);

      // Persist migration if changed
      await StorageService.setSettings(migrated);
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

  const loadXP = async () => {
    try {
      const xp = await StorageService.getXP();
      setUserXP(xp);
    } catch (error) {
      console.error('Error loading XP:', error);
    }
  };

  const updateSetting = useCallback(
    async (key, value) => {
      if (!settings) return;

      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);

      try {
        await StorageService.setSettings(newSettings);

        if (key === 'notificationsEnabled') {
          setNotificationsEnabled(value);

          if (value) {
            // Request permissions now; schedule later (on Save Profile or when leaving settings)
            const ok = await NotificationService.requestPermissions();
            if (!ok) {
              Alert.alert('Permission Needed', 'Please enable notifications in your device settings.');
              const reverted = { ...newSettings, notificationsEnabled: false };
              setSettings(reverted);
              setNotificationsEnabled(false);
              await StorageService.setSettings(reverted);
              return;
            }

            // Schedule smart reminders using current profile (saved profile values)
            await NotificationService.scheduleSmartReminders(userProfile);

            // Also schedule custom reminders if present
            if (newSettings.customReminders?.length) {
              await NotificationService.scheduleCustomReminders(newSettings.customReminders);
            }
          } else {
            await NotificationService.cancelAllReminders();
          }
        }

        if (key === 'customReminders' && newSettings.notificationsEnabled) {
          // reschedule custom reminders only when notifications enabled
          await NotificationService.scheduleCustomReminders(newSettings.customReminders);
        }
      } catch (error) {
        console.error(`Error updating setting ${key}:`, error);
        Alert.alert('Error', 'Failed to update setting.');
      }
    },
    [settings, userProfile]
  );

  const saveProfile = useCallback(async () => {
    const weightN = parseInt(draftWeight, 10);
    if (!Number.isFinite(weightN) || weightN < 30 || weightN > 200) {
      Alert.alert('Invalid Weight', 'Please enter a weight between 30 and 200 kg.');
      return;
    }

    const wake = parseHHMM(draftWakeTime, { hour: 7, minute: 0 });
    const sleep = parseHHMM(draftSleepTime, { hour: 23, minute: 0 });

    // simple guard: require wake < sleep (same-day schedule)
    if (sleep.hour < wake.hour || (sleep.hour === wake.hour && sleep.minute <= wake.minute)) {
      Alert.alert('Invalid Sleep/Wake Times', 'Sleep time must be after wake time.');
      return;
    }

    try {
      setLoading(true);

      const newProfile = {
        ...userProfile,
        name: (draftName ?? '').trim() || 'Hydration Hero',
        weight: weightN,
        activityLevel: draftActivityLevel,
        wakeTime: formatHHMM(wake.hour, wake.minute),
        sleepTime: formatHHMM(sleep.hour, sleep.minute),
      };

      setUserProfile(newProfile);
      await StorageService.setUserProfile(newProfile);

      // reschedule reminders if enabled
      if (settings?.notificationsEnabled) {
        await NotificationService.scheduleSmartReminders(newProfile);
        await NotificationService.scheduleCustomReminders(settings.customReminders);
      }

      Alert.alert('Saved', 'Profile updated.');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile.');
    } finally {
      setLoading(false);
    }
  }, [
    draftActivityLevel,
    draftName,
    draftSleepTime,
    draftWakeTime,
    draftWeight,
    settings?.customReminders,
    settings?.notificationsEnabled,
    setUserProfile,
    userProfile,
  ]);

  const profileDirty = useMemo(() => {
    const normalize = (s) => (s ?? '').trim();
    return (
      normalize(draftName) !== normalize(userProfile.name) ||
      (draftWeight ?? '') !== (userProfile.weight?.toString?.() ?? '') ||
      (draftActivityLevel ?? 'moderate') !== (userProfile.activityLevel ?? 'moderate') ||
      (draftWakeTime ?? DEFAULT_WAKE_TIME) !== (userProfile.wakeTime ?? DEFAULT_WAKE_TIME) ||
      (draftSleepTime ?? DEFAULT_SLEEP_TIME) !== (userProfile.sleepTime ?? DEFAULT_SLEEP_TIME)
    );
  }, [draftActivityLevel, draftName, draftSleepTime, draftWakeTime, draftWeight, userProfile]);

  const applyDailyGoal = useCallback(
    async (goalMl, { showAlert } = { showAlert: true }) => {
      if (!Number.isFinite(goalMl) || goalMl < 500 || goalMl > 5000) {
        Alert.alert('Invalid Goal', 'Please enter a goal between 500ml and 5000ml.');
        setTempGoal(String(dailyGoal));
        return;
      }

      try {
        setLoading(true);
        setDailyGoal(goalMl);
        setTempGoal(String(goalMl));
        await StorageService.setDailyGoal(goalMl);
        if (showAlert) Alert.alert('Goal Updated', `Your daily goal is now ${goalMl}ml!`);
      } catch (error) {
        console.error('Error updating daily goal:', error);
        Alert.alert('Error', 'Failed to update daily goal.');
        setTempGoal(String(dailyGoal));
      } finally {
        setLoading(false);
      }
    },
    [dailyGoal, setDailyGoal]
  );

  const updateDailyGoal = useCallback(async () => {
    const newGoal = parseInt(tempGoal, 10);
    await applyDailyGoal(newGoal, { showAlert: true });
  }, [applyDailyGoal, tempGoal]);

  const testNotification = useCallback(async () => {
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
  }, []);

  const resetAllData = useCallback(() => {
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
              Alert.alert('Data Reset', 'All data has been cleared. Please restart the app.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset data.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }, []);

  const handleStreakRestored = useCallback(() => {
    loadStreakStats();
  }, []);

  // recommended goal (considers weight, activity level, and wake/sleep times)
  const weightN = parseInt(draftWeight, 10);
  const recGoalMl = calculateSmartGoal({
    weight: Number.isFinite(weightN) && weightN > 0 ? weightN : userProfile.weight,
    activityLevel: draftActivityLevel,
    wakeTime: draftWakeTime || DEFAULT_WAKE_TIME,
    sleepTime: draftSleepTime || DEFAULT_SLEEP_TIME,
  });
  const units = settings?.units ?? 'ml';
  const recGoalDisplay = units === 'oz' ? `${toOz(recGoalMl)} oz` : `${recGoalMl} ml`;
  const dailyGoalDisplay = units === 'oz' ? `${toOz(dailyGoal)} oz` : `${dailyGoal} ml`;

  const xpData = XPService.getXPSummary(userXP);

  if (!settings) {
    return (
      <LoadingOverlay visible message="Loading settings...">
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
              style={{ fontSize: 28, fontWeight: 'bold', color: COLOR.white, marginBottom: 20 }}
            >
              ⚙️ Settings
            </Animatable.Text>

            {/* Level & XP Progress Card */}
            <Animatable.View animation="fadeInUp" delay={100} style={levelCardStyle}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: COLOR.amber }}>
                    LV {xpData.level}
                  </Text>
                  <Text style={{ fontSize: 13, color: COLOR.white, opacity: 0.9, marginTop: 2 }}>
                    {xpData.title}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: COLOR.aquaMint }}>
                    {xpData.currentXP} XP
                  </Text>
                  {!xpData.isMaxLevel && (
                    <Text style={{ fontSize: 11, color: COLOR.white, opacity: 0.65, marginTop: 2 }}>
                      {xpData.xpToNext} XP to Level {xpData.level + 1}
                    </Text>
                  )}
                </View>
              </View>

              {!xpData.isMaxLevel ? (
                <>
                  <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4, overflow: 'hidden' }}>
                    <Animatable.View
                      animation="slideInLeft"
                      duration={900}
                      style={{ width: `${xpData.progress}%`, height: '100%', backgroundColor: COLOR.amber, borderRadius: 4 }}
                    />
                  </View>
                  <Text style={{ fontSize: 11, color: COLOR.white, opacity: 0.6, marginTop: 5, textAlign: 'right' }}>
                    {xpData.progress}% to next level
                  </Text>
                </>
              ) : (
                <Text style={{ color: COLOR.amber, fontWeight: '700', textAlign: 'center', marginTop: 4 }}>
                  🏆 MAX LEVEL REACHED!
                </Text>
              )}

              {/* XP How-to guide */}
              <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLOR.aquaMint, marginBottom: 6 }}>
                  💡 How to earn XP
                </Text>
                {[
                  { icon: '🥇', text: 'First drink of the day', xp: '+10 XP' },
                  { icon: '🎯', text: 'Complete your daily goal', xp: '+50 XP' },
                  { icon: '📈', text: 'Reach 25 / 50 / 75% of goal', xp: '+10–20 XP' },
                  { icon: '🔥', text: 'Maintain a 3-day streak', xp: '+25 XP' },
                  { icon: '🔥', text: 'Maintain a 7-day streak', xp: '+75 XP' },
                  { icon: '⚠️', text: 'Reset today\'s progress', xp: '−Daily XP' },
                ].map((item, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 12, color: COLOR.white, opacity: 0.8 }}>
                      {item.icon} {item.text}
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: item.xp.startsWith('−') ? COLOR.coral : COLOR.amber }}>
                      {item.xp}
                    </Text>
                  </View>
                ))}
              </View>
            </Animatable.View>

            {/* Profile */}
            <View style={{ marginBottom: 30 }}>
              <Text style={sectionTitleStyle}>👤 Profile</Text>

              <View style={settingCardStyle}>
                <Text style={settingLabelStyle}>Name</Text>
                <TextInput
                  style={textInputStyle}
                  value={draftName}
                  onChangeText={setDraftName}
                  placeholder="Enter your name"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  maxLength={30}
                />
              </View>

              <View style={settingCardStyle}>
                <Text style={settingLabelStyle}>Weight (kg)</Text>
                <TextInput
                  style={textInputStyle}
                  value={draftWeight}
                  onChangeText={(t) => setDraftWeight(t.replace(/[^\d]/g, ''))}
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
                    { key: 'high', label: 'Active', emoji: '💪' },
                  ].map((level) => (
                    <TouchableOpacity
                      key={level.key}
                      onPress={() => setDraftActivityLevel(level.key)}
                      style={[
                        activityButtonStyle,
                        {
                          backgroundColor:
                            draftActivityLevel === level.key ? COLOR.skyBlue : 'rgba(255,255,255,0.1)',
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 20, marginBottom: 4 }}>{level.emoji}</Text>
                      <Text
                        style={{
                          color: COLOR.white,
                          fontWeight: draftActivityLevel === level.key ? '700' : '500',
                          fontSize: 12,
                        }}
                      >
                        {level.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={settingCardStyle}>
                <Text style={settingLabelStyle}>Wake / Sleep</Text>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLOR.white, opacity: 0.7, fontSize: 12 }}>Wake</Text>
                    <TextInput
                      style={textInputStyle}
                      value={draftWakeTime}
                      onChangeText={setDraftWakeTime}
                      placeholder="07:00"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      maxLength={5}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLOR.white, opacity: 0.7, fontSize: 12 }}>Sleep</Text>
                    <TextInput
                      style={textInputStyle}
                      value={draftSleepTime}
                      onChangeText={setDraftSleepTime}
                      placeholder="23:00"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      maxLength={5}
                    />
                  </View>
                </View>

                <Text style={{ color: COLOR.white, opacity: 0.7, fontSize: 12, marginTop: 8 }}>
                  Smart reminders will only schedule between wake and sleep times.
                </Text>
              </View>

              {/* Recommended goal (functional) */}
              <View style={settingCardStyle}>
                <Text style={settingLabelStyle}>Recommended Goal</Text>
                <Text style={{ color: COLOR.white, opacity: 0.85, marginTop: 6 }}>
                  Based on your weight + activity: {recGoalDisplay}
                </Text>

                <TouchableOpacity
                  onPress={() => applyDailyGoal(recGoalMl, { showAlert: true })}
                  style={[miniButtonContainerStyle, { marginTop: 12, backgroundColor: COLOR.skyBlue }]}
                >
                  <Text style={miniButtonTextStyle}>✨ Use Recommended Goal</Text>
                </TouchableOpacity>
              </View>

              {/* Save profile */}
              <TouchableOpacity
                onPress={saveProfile}
                disabled={!profileDirty}
                style={[
                  miniButtonContainerStyle,
                  { marginTop: 0, opacity: profileDirty ? 1 : 0.4 },
                ]}
              >
                <Text style={miniButtonTextStyle}>💾 Save Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  // reset drafts to saved profile
                  setDraftName(userProfile.name ?? '');
                  setDraftWeight(userProfile.weight?.toString?.() ?? '');
                  setDraftActivityLevel(userProfile.activityLevel ?? 'moderate');
                  setDraftWakeTime(userProfile.wakeTime ?? DEFAULT_WAKE_TIME);
                  setDraftSleepTime(userProfile.sleepTime ?? DEFAULT_SLEEP_TIME);
                }}
                disabled={!profileDirty}
                style={[
                  miniButtonContainerStyle,
                  { marginTop: 10, backgroundColor: COLOR.amber, opacity: profileDirty ? 1 : 0.4 },
                ]}
              >
                <Text style={miniButtonTextStyle}>↩️ Discard Changes</Text>
              </TouchableOpacity>
            </View>

            {/* Daily Goal */}
            <View style={{ marginBottom: 30 }}>
              <Text style={sectionTitleStyle}>🎯 Daily Goal</Text>

              <View style={settingCardStyle}>
                <Text style={settingLabelStyle}>Current Goal: {dailyGoalDisplay}</Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                  <TextInput
                    style={[textInputStyle, { flex: 1, marginRight: 10 }]}
                    value={tempGoal}
                    onChangeText={(t) => setTempGoal(t.replace(/[^\d]/g, ''))}
                    placeholder="2000"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    keyboardType="numeric"
                    maxLength={4}
                  />
                  <TouchableOpacity onPress={updateDailyGoal} style={miniButtonStyle}>
                    <Text style={{ color: COLOR.white, fontWeight: '600' }}>Update</Text>
                  </TouchableOpacity>
                </View>

                <Text style={{ color: COLOR.white, opacity: 0.7, fontSize: 12, marginTop: 8 }}>Quick presets:</Text>

                <View style={{ flexDirection: 'row', marginTop: 8, flexWrap: 'wrap' }}>
                  {goalPresets.map((val) => (
                    <TouchableOpacity
                      key={val}
                      onPress={() => applyDailyGoal(val, { showAlert: false })}
                      style={[
                        goalButtonStyle,
                        { backgroundColor: dailyGoal === val ? COLOR.amber : COLOR.skyBlue },
                      ]}
                    >
                      <Text style={{ color: COLOR.white, fontWeight: '600', fontSize: 12 }}>{val}ml</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Units */}
            <View style={{ marginBottom: 30 }}>
              <Text style={sectionTitleStyle}>📏 Units</Text>

              <View style={settingCardStyle}>
                <Text style={settingLabelStyle}>Display Units</Text>

                <View style={{ flexDirection: 'row', marginTop: 10, justifyContent: 'space-between' }}>
                  {[
                    { key: 'ml', label: 'ml' },
                    { key: 'oz', label: 'oz' },
                  ].map((u) => (
                    <TouchableOpacity
                      key={u.key}
                      onPress={() => updateSetting('units', u.key)}
                      style={[
                        activityButtonStyle,
                        { backgroundColor: units === u.key ? COLOR.skyBlue : 'rgba(255,255,255,0.1)' },
                      ]}
                    >
                      <Text style={{ color: COLOR.white, fontWeight: units === u.key ? '700' : '500' }}>
                        {u.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={{ color: COLOR.white, opacity: 0.7, fontSize: 12, marginTop: 8 }}>
                  This currently affects goal display + recommendations. (Next: apply to drink logging UI.)
                </Text>
              </View>
            </View>

            {/* Notifications */}
            <View style={{ marginBottom: 30 }}>
              <Text style={sectionTitleStyle}>🔔 Notifications</Text>

              <View style={[settingCardStyle, switchRowStyle]}>
                <Text style={settingLabelStyle}>Enable Notifications</Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={(value) => updateSetting('notificationsEnabled', value)}
                  trackColor={{ false: 'rgba(255,255,255,0.3)', true: COLOR.skyBlue }}
                  thumbColor={COLOR.white}
                />
              </View>

              <TouchableOpacity onPress={() => setShowCustomReminders(true)} style={settingCardStyle}>
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
                      <Text style={{ color: COLOR.white, opacity: 0.8, fontSize: 12 }}>Current</Text>
                    </View>

                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLOR.aquaMint }}>
                        {streakStats.longestStreak}
                      </Text>
                      <Text style={{ color: COLOR.white, opacity: 0.8, fontSize: 12 }}>Longest</Text>
                    </View>

                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLOR.skyBlue }}>
                        {streakStats.successfulDays}
                      </Text>
                      <Text style={{ color: COLOR.white, opacity: 0.8, fontSize: 12 }}>Total Days</Text>
                    </View>
                  </View>

                  <Text style={{ color: COLOR.white, opacity: 0.9, textAlign: 'center' }}>
                    {StreakService.getStreakMotivation(streakStats.currentStreak)}
                  </Text>
                </View>
              )}

              <TouchableOpacity onPress={() => setShowStreakSafeguard(true)} style={settingCardStyle}>
                <Text style={settingLabelStyle}>🛡️ Streak Safeguard</Text>
                <Text style={settingDescStyle}>
                  {streakStats?.canUseSafeguard
                    ? 'Available - Restore a broken streak (once per month)'
                    : 'Used this month - Next available next month'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sound & Haptics */}
            <View style={{ marginBottom: 30 }}>
              <Text style={sectionTitleStyle}>🔊 Sound & Haptics</Text>

              <View style={[settingCardStyle, switchRowStyle]}>
                <View style={{ flex: 1 }}>
                  <Text style={settingLabelStyle}>Sound Effects</Text>
                  <Text style={settingDescStyle}>Play sounds for drink added, milestones & level ups</Text>
                </View>
                <Switch
                  value={settings?.soundEnabled ?? true}
                  onValueChange={(value) => updateSetting('soundEnabled', value)}
                  trackColor={{ false: 'rgba(255,255,255,0.3)', true: COLOR.skyBlue }}
                  thumbColor={COLOR.white}
                />
              </View>

              <View style={[settingCardStyle, switchRowStyle]}>
                <View style={{ flex: 1 }}>
                  <Text style={settingLabelStyle}>Haptic Feedback</Text>
                  <Text style={settingDescStyle}>Vibration on drink added & achievements</Text>
                </View>
                <Switch
                  value={settings?.hapticsEnabled ?? true}
                  onValueChange={(value) => updateSetting('hapticsEnabled', value)}
                  trackColor={{ false: 'rgba(255,255,255,0.3)', true: COLOR.skyBlue }}
                  thumbColor={COLOR.white}
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
                  thumbColor={COLOR.white}
                />
              </View>

              <Text style={{ color: COLOR.white, opacity: 0.7, fontSize: 12, marginTop: 8 }}>
                Tip: to make Dark Mode more noticeable, also apply it to GradientBackground + cards.
              </Text>
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

              {isFirebaseConfigured && (
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Sign Out',
                        style: 'destructive',
                        onPress: () => AuthService.signOutUser(),
                      },
                    ])
                  }
                  style={[dangerButtonStyle, { marginTop: 12, borderColor: COLOR.amber }]}
                >
                  <Text style={[dangerButtonTextStyle, { color: COLOR.amber }]}>🚪 Sign Out</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          {/* Modals */}
          <StreakSafeguard
            visible={showStreakSafeguard}
            onClose={() => setShowStreakSafeguard(false)}
            onStreakRestored={handleStreakRestored}
          />

          <CustomReminders
            visible={showCustomReminders}
            onClose={() => setShowCustomReminders(false)}
            // If your CustomReminders component supports a callback like onSave(reminders),
            // wire it to updateSetting('customReminders', reminders)
          />
        </SafeAreaView>
      </GradientBackground>
    </LoadingOverlay>
  );
}

// Styles
const levelCardStyle = {
  backgroundColor: 'rgba(255,215,0,0.08)',
  borderRadius: 16,
  padding: 16,
  marginBottom: 24,
  borderWidth: 1,
  borderColor: 'rgba(255,215,0,0.25)',
};

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

SettingsScreen.propTypes = {
  dailyGoal: PropTypes.number.isRequired,
  setDailyGoal: PropTypes.func.isRequired,
  darkMode: PropTypes.bool.isRequired,
  setDarkMode: PropTypes.func.isRequired,
  userProfile: PropTypes.object.isRequired,
  setUserProfile: PropTypes.func.isRequired,
};
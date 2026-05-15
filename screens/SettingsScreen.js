import React, { useEffect, useMemo, useState } from 'react';
import { View, Image, Text, TouchableOpacity, Switch, Alert, ScrollView, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons'; 
import DateTimePicker from '@react-native-community/datetimepicker';

import GradientBackground from '../components/GradientBackground';
import { LoadingOverlay } from '../components/LoadingIndicator';
import { COLOR } from '../components/Theme';
import XPService from '../services/XPService';
import StorageService from '../services/StorageService';
import NotificationService from '../services/NotificationService';
import ProfilePictureService from '../services/ProfilePictureService';
import AuthService from '../services/AuthService';
import { isFirebaseConfigured } from '../firebase';
import { calculateSmartGoal } from '../utils';

// ---- helpers ----
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

export default function SettingsScreen({
  dailyGoal,
  setDailyGoal,
  userProfile,
  setUserProfile,
}) {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [profilePic, setProfilePic] = useState(userProfile?.photoURL || null);
  const [xpData, setXpData] = useState({ level: 1, currentXP: 0, nextLevelXP: 100, progress: 0 });
  const [showPicker, setShowPicker] = useState({ show: false, type: 'wake' });

  // Draft states
  const [draftName, setDraftName] = useState(userProfile?.name || '');
  const [draftWeight, setDraftWeight] = useState(String(userProfile?.weight || ''));
  const [draftActivityLevel, setDraftActivityLevel] = useState(userProfile?.activityLevel || 'moderate');
  const [draftWakeTime, setDraftWakeTime] = useState(userProfile?.wakeTime || DEFAULT_WAKE_TIME);
  const [draftSleepTime, setDraftSleepTime] = useState(userProfile?.sleepTime || DEFAULT_SLEEP_TIME);
  const [tempGoal, setTempGoal] = useState(String(dailyGoal));

  useEffect(() => {
    loadSettings();
    loadXP();
    loadProfilePic();
  }, []);

  const loadSettings = async () => {
    const s = await StorageService.getSettings();
    setSettings(s);
    setNotificationsEnabled(s?.notificationsEnabled ?? true);
    setTempGoal(String(dailyGoal));
  };

  const onTimeChange = (event, selectedDate) => {
    setShowPicker({ ...showPicker, show: false });
    if (selectedDate) {
      const hh = String(selectedDate.getHours()).padStart(2, '0');
      const mm = String(selectedDate.getMinutes()).padStart(2, '0');
      const timeStr = `${hh}:${mm}`;
      if (showPicker.type === 'wake') setDraftWakeTime(timeStr);
      else setDraftSleepTime(timeStr);
    }
  };
  
  const loadXP = async () => {
    const xp = await StorageService.getXP();
    const summary = XPService.getXPSummary(xp);
    setXpData(summary);
  };

  const loadProfilePic = async () => {
    if (!isFirebaseConfigured) return;
    const user = AuthService.auth?.currentUser;
    if (user) {
      const result = await ProfilePictureService.getProfilePicture(user.uid);
      if (result.success) setProfilePic(result.url);
    }
  };

  // 1. Create a safe profile object to pass to your utils.js
  const safeProfileForCalc = {
    weight: parseInt(draftWeight, 10) || userProfile?.weight || 70,
    activityLevel: draftActivityLevel || userProfile?.activityLevel || 'moderate',
    wakeTime: draftWakeTime || userProfile?.wakeTime || DEFAULT_WAKE_TIME,
    sleepTime: draftSleepTime || userProfile?.sleepTime || DEFAULT_SLEEP_TIME,
  };

  // 2. Call your utility function with the object it expects
  const recGoalMl = useMemo(() => {
    try {
      return calculateSmartGoal(safeProfileForCalc);
    } catch (e) {
      return 2500; // Fallback if split(':') still fails
    }
  }, [safeProfileForCalc]);

  const recGoalDisplay = `${recGoalMl} ml`;

  const profileDirty = useMemo(() => {
    const goalVal = Number(tempGoal);
    return (
      (draftName || '').trim() !== (userProfile.name || '').trim() ||
      draftWeight !== String(userProfile.weight || '') ||
      draftActivityLevel !== (userProfile.activityLevel || 'moderate') ||
      draftWakeTime !== (userProfile.wakeTime || DEFAULT_WAKE_TIME) ||
      draftSleepTime !== (userProfile.sleepTime || DEFAULT_SLEEP_TIME) ||
      goalVal !== dailyGoal
    );
  }, [draftName, draftWeight, draftActivityLevel, draftWakeTime, draftSleepTime, tempGoal, userProfile, dailyGoal]);

  const saveProfile = async () => {
    const weightVal = parseInt(draftWeight, 10);
    if (!Number.isFinite(weightVal) || weightVal < 30) {
        Alert.alert("Invalid Weight", "Please enter a realistic weight.");
        return;
    }

    setLoading(true);
    try {
      const finalGoal = Number(tempGoal);
      const updates = {
        name: draftName.trim(),
        weight: weightVal,
        activityLevel: draftActivityLevel,
        wakeTime: draftWakeTime,
        sleepTime: draftSleepTime,
      };

      await StorageService.setUserProfile({ ...userProfile, ...updates });
      setUserProfile({ ...userProfile, ...updates });
      setDailyGoal(finalGoal);
      await StorageService.setDailyGoal(finalGoal);

      if (settings?.notificationsEnabled) {
        await NotificationService.scheduleSmartReminders({ ...userProfile, ...updates });
      }
      
      Alert.alert('Success', 'Profile updated!');
    } catch (err) {
      Alert.alert('Error', 'Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await StorageService.setSettings(newSettings);
  };

  const toggleNotifications = async (enabled) => {
    setNotificationsEnabled(enabled);
    await updateSetting('notificationsEnabled', enabled);
    if (enabled) {
      const hasPermission = await NotificationService.requestPermissions();
      if (!hasPermission) {
        setNotificationsEnabled(false);
        await updateSetting('notificationsEnabled', false);
        Alert.alert('Notifications Disabled', 'Notification permission is required to enable reminders.');
        return;
      }
      await NotificationService.scheduleSmartReminders({
        ...userProfile,
        wakeTime: draftWakeTime || userProfile?.wakeTime || DEFAULT_WAKE_TIME,
        sleepTime: draftSleepTime || userProfile?.sleepTime || DEFAULT_SLEEP_TIME,
      });
      const latestSettings = await StorageService.getSettings();
      await NotificationService.scheduleCustomReminders(latestSettings?.customReminders || []);
      return;
    }
    await NotificationService.cancelAllReminders();
  };

  const pickerDate = useMemo(() => {
    const fallback = showPicker.type === 'wake' ? { hour: 7, minute: 0 } : { hour: 23, minute: 0 };
    const parsed = parseHHMM(showPicker.type === 'wake' ? draftWakeTime : draftSleepTime, fallback);
    const d = new Date();
    d.setHours(parsed.hour, parsed.minute, 0, 0);
    return d;
  }, [showPicker, draftWakeTime, draftSleepTime]);

  const handlePickImage = async () => {
    const result = await ProfilePictureService.pickAndUploadImage();
    if (result.success) setProfilePic(result.url);
  };

  // UI Components
  const SettingSection = ({ title, children }) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeader}>{title.toUpperCase()}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );

  const SettingRow = ({ icon, label, children, isLast }) => (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={styles.rowLabelContainer}>
        <Text style={styles.rowIcon}>{icon}</Text>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      {children}
    </View>
  );

  if (!settings) return null;

  return (
    <LoadingOverlay visible={loading} message="Updating...">
      <GradientBackground>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            
            <View style={styles.headerTitleContainer}>
                <Text style={styles.mainTitle}>Settings</Text>
            </View>

            {/* PROFILE DASHBOARD */}
            <View style={styles.profileDashboard}>
                <TouchableOpacity onPress={handlePickImage}>
                    <View>
                      {profilePic ? (
                          <Image source={{ uri: profilePic }} style={styles.avatar} />
                      ) : (
                          <View style={styles.placeholderAvatar}>
                              <Ionicons name="person" size={36} color={COLOR.white} />
                          </View>
                      )}
                      <View style={styles.cameraBadge}>
                        <Ionicons name="camera" size={12} color="white" />
                      </View>
                    </View>
                </TouchableOpacity>

                <View style={styles.xpInfo}>
                    <Text style={styles.userName}>{draftName || 'Hydra Hero'}</Text>
                    <View style={styles.levelBadgeContainer}>
                        <Text style={styles.levelText}>LEVEL {xpData.level} • {xpData.title}</Text>
                        <View style={styles.xpBarBackground}>
                            <View style={[styles.xpBarFill, { width: `${xpData.progress}%` }]} />
                        </View>
                    </View>
                </View>
            </View>

            <SettingSection title="Physical Profile">
              <SettingRow icon="👤" label="Name">
                <TextInput style={styles.inlineInput} value={draftName} onChangeText={setDraftName} />
              </SettingRow>
              <SettingRow icon="⚖️" label="Weight (kg)">
                <TextInput style={styles.inlineInput} value={draftWeight} keyboardType="numeric" onChangeText={t => setDraftWeight(t.replace(/[^\d]/g, ''))} />
              </SettingRow>
              <View style={styles.activityPickerContainer}>
                 {['low', 'moderate', 'high'].map((level) => (
                    <TouchableOpacity
                      key={level}
                      onPress={() => setDraftActivityLevel(level)}
                      style={[styles.activityTab, draftActivityLevel === level && styles.activeTab]}
                    >
                      <Text style={[styles.tabText, draftActivityLevel === level && styles.activeTabText]}>{level.toUpperCase()}</Text>
                    </TouchableOpacity>
                 ))}
              </View>
            </SettingSection>

            <SettingSection title="Schedule">
               <SettingRow icon="☀️" label="Wake Up">
                 <TouchableOpacity onPress={() => setShowPicker({ show: true, type: 'wake' })}>
                   <Text style={styles.inlineInput}>{draftWakeTime}</Text>
                 </TouchableOpacity>
               </SettingRow>
               <SettingRow icon="🌙" label="Sleep" isLast>
                  <TouchableOpacity onPress={() => setShowPicker({ show: true, type: 'sleep' })}>
                    <Text style={styles.inlineInput}>{draftSleepTime}</Text>
                  </TouchableOpacity>
               </SettingRow>
             </SettingSection>

            <SettingSection title="Hydration Goal">
               <SettingRow icon="🎯" label="Daily Goal">
                 <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <TextInput style={styles.inlineInput} value={tempGoal} onChangeText={t => setTempGoal(t.replace(/[^\d]/g, ''))} keyboardType="numeric" />
                     <Text style={styles.unitLabel}>ml</Text>
                  </View>
                </SettingRow>
               <TouchableOpacity style={styles.smartGoalLink} onPress={() => setTempGoal(String(recGoalMl))}>
                  <Text style={styles.smartGoalText}>✨ Use Smart Recommendation ({recGoalDisplay})</Text>
                </TouchableOpacity>
             </SettingSection>

            <SettingSection title="Preferences">
              <SettingRow icon="🔔" label="Notifications">
                <Switch value={notificationsEnabled} onValueChange={toggleNotifications} trackColor={{ false: '#3e3e3e', true: COLOR.skyBlue }} />
              </SettingRow>
              <SettingRow icon="🔊" label="Sounds">
                <Switch value={!!settings?.soundEnabled} onValueChange={v => updateSetting('soundEnabled', v)} trackColor={{ false: '#3e3e3e', true: COLOR.skyBlue }} />
              </SettingRow>
              <SettingRow icon="📳" label="Haptics" isLast>
                <Switch value={!!settings?.hapticsEnabled} onValueChange={v => updateSetting('hapticsEnabled', v)} trackColor={{ false: '#3e3e3e', true: COLOR.skyBlue }} />
              </SettingRow>
            </SettingSection>

            <View style={{ paddingHorizontal: 20 }}>
                <TouchableOpacity onPress={() => AuthService.signOutUser()} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>Sign Out</Text>
                </TouchableOpacity>
            </View>

          </ScrollView>

          {profileDirty && (
            <Animatable.View animation="slideInUp" duration={300} style={styles.fabContainer}>
                <TouchableOpacity style={styles.saveFab} onPress={saveProfile}>
                    <Text style={styles.saveFabText}>Save Changes</Text>
                </TouchableOpacity>
            </Animatable.View>
          )}

          {showPicker.show && (
            <DateTimePicker value={pickerDate} mode="time" display="default" onChange={onTimeChange} />
          )}
        </SafeAreaView>
      </GradientBackground>
    </LoadingOverlay>
  );
}

const styles = StyleSheet.create({
  headerTitleContainer: { paddingHorizontal: 20, paddingVertical: 15 },
  mainTitle: { fontSize: 32, fontWeight: '800', color: 'white' },
  profileDashboard: { flexDirection: 'row', padding: 20, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 20, borderRadius: 20, marginBottom: 25 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: COLOR.skyBlue },
  placeholderAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLOR.skyBlue },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLOR.skyBlue,
    borderWidth: 1.5,
    borderColor: COLOR.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpInfo: { marginLeft: 20, flex: 1 },
  userName: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  levelText: { color: COLOR.amber, fontSize: 11, fontWeight: '800', marginBottom: 4 },
  xpBarBackground: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, marginTop: 5 },
  xpBarFill: { height: '100%', backgroundColor: COLOR.amber, borderRadius: 3 },
  sectionContainer: { marginBottom: 25, paddingHorizontal: 20 },
  sectionHeader: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, marginLeft: 5, letterSpacing: 1 },
  sectionCard: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  rowLabelContainer: { flexDirection: 'row', alignItems: 'center' },
  rowIcon: { fontSize: 18, marginRight: 12 },
  rowLabel: { color: 'white', fontSize: 16, fontWeight: '500' },
  inlineInput: { color: COLOR.skyBlue, fontSize: 16, fontWeight: '600', textAlign: 'right', minWidth: 60 },
  unitLabel: { color: 'white', opacity: 0.5, marginLeft: 5, fontSize: 14 },
  activityPickerContainer: { flexDirection: 'row', padding: 8, backgroundColor: 'rgba(0,0,0,0.2)', margin: 10, borderRadius: 12 },
  activityTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: COLOR.skyBlue },
  tabText: { color: 'white', opacity: 0.6, fontSize: 10, fontWeight: 'bold' },
  activeTabText: { opacity: 1 },
  smartGoalLink: { padding: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  smartGoalText: { color: COLOR.aquaMint, fontSize: 13, fontWeight: '600' },
  secondaryButton: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
  secondaryButtonText: { color: 'white', fontWeight: 'bold' },
  fabContainer: { position: 'absolute', bottom: 30, left: 20, right: 20 },
  saveFab: { backgroundColor: COLOR.skyBlue, padding: 18, borderRadius: 20, alignItems: 'center', elevation: 8 },
  saveFabText: { color: 'white', fontWeight: '800', fontSize: 16 }
});

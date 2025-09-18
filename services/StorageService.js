// services/StorageService.js - Centralized AsyncStorage service
import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageService {
  // User Profile
  static async getUserProfile() {
    try {
      const profile = await AsyncStorage.getItem('userProfile');
      return profile ? JSON.parse(profile) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  static async setUserProfile(profile) {
    try {
      await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
      return true;
    } catch (error) {
      console.error('Error setting user profile:', error);
      return false;
    }
  }

  // Daily Goal
  static async getDailyGoal() {
    try {
      const goal = await AsyncStorage.getItem('dailyGoal');
      return goal ? parseInt(goal) : 2000;
    } catch (error) {
      console.error('Error getting daily goal:', error);
      return 2000;
    }
  }

  static async setDailyGoal(goal) {
    try {
      await AsyncStorage.setItem('dailyGoal', goal.toString());
      return true;
    } catch (error) {
      console.error('Error setting daily goal:', error);
      return false;
    }
  }

  // Streak
  static async getStreak() {
    try {
      const streak = await AsyncStorage.getItem('currentStreak');
      return streak ? parseInt(streak) : 0;
    } catch (error) {
      console.error('Error getting streak:', error);
      return 0;
    }
  }

  static async setStreak(streak) {
    try {
      await AsyncStorage.setItem('currentStreak', streak.toString());
      return true;
    } catch (error) {
      console.error('Error setting streak:', error);
      return false;
    }
  }

  // History
  static async getHistory() {
    try {
      const history = await AsyncStorage.getItem('history');
      return history ? JSON.parse(history) : {};
    } catch (error) {
      console.error('Error getting history:', error);
      return {};
    }
  }

  static async setHistory(history) {
    try {
      await AsyncStorage.setItem('history', JSON.stringify(history));
      return true;
    } catch (error) {
      console.error('Error setting history:', error);
      return false;
    }
  }

  // Daily Total
  static async getDailyTotal(date) {
    try {
      const total = await AsyncStorage.getItem(date);
      return total ? parseInt(total) : 0;
    } catch (error) {
      console.error('Error getting daily total:', error);
      return 0;
    }
  }

  static async setDailyTotal(date, total) {
    try {
      await AsyncStorage.setItem(date, total.toString());
      return true;
    } catch (error) {
      console.error('Error setting daily total:', error);
      return false;
    }
  }

  // Intake Records
  static async getTodayIntake(date) {
    try {
      const intake = await AsyncStorage.getItem(`intake_${date}`);
      return intake ? JSON.parse(intake) : [];
    } catch (error) {
      console.error('Error getting today intake:', error);
      return [];
    }
  }

  static async setTodayIntake(date, intake) {
    try {
      await AsyncStorage.setItem(`intake_${date}`, JSON.stringify(intake));
      return true;
    } catch (error) {
      console.error('Error setting today intake:', error);
      return false;
    }
  }

  // XP and Achievements
  static async getXP() {
    try {
      const xp = await AsyncStorage.getItem('userXP');
      return xp ? parseInt(xp) : 0;
    } catch (error) {
      console.error('Error getting XP:', error);
      return 0;
    }
  }

  static async setXP(xp) {
    try {
      await AsyncStorage.setItem('userXP', xp.toString());
      return true;
    } catch (error) {
      console.error('Error setting XP:', error);
      return false;
    }
  }

  static async getUnlockedThemes() {
    try {
      const themes = await AsyncStorage.getItem('unlockedThemes');
      return themes ? JSON.parse(themes) : ['default'];
    } catch (error) {
      console.error('Error getting unlocked themes:', error);
      return ['default'];
    }
  }

  static async setUnlockedThemes(themes) {
    try {
      await AsyncStorage.setItem('unlockedThemes', JSON.stringify(themes));
      return true;
    } catch (error) {
      console.error('Error setting unlocked themes:', error);
      return false;
    }
  }

  // Settings
  static async getSettings() {
    try {
      const settings = await AsyncStorage.getItem('appSettings');
      return settings ? JSON.parse(settings) : {
        notificationsEnabled: true,
        reminderFrequency: 'smart',
        customReminders: [],
        largeFontMode: false,
        highContrastMode: false,
        voiceLoggingEnabled: false
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return {
        notificationsEnabled: true,
        reminderFrequency: 'smart',
        customReminders: [],
        largeFontMode: false,
        highContrastMode: false,
        voiceLoggingEnabled: false
      };
    }
  }

  static async setSettings(settings) {
    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error setting settings:', error);
      return false;
    }
  }

  // Streak Safeguard
  static async getStreakSafeguardUsed() {
    try {
      const used = await AsyncStorage.getItem('streakSafeguardUsed');
      return used ? JSON.parse(used) : { count: 0, lastUsed: null };
    } catch (error) {
      console.error('Error getting streak safeguard:', error);
      return { count: 0, lastUsed: null };
    }
  }

  static async setStreakSafeguardUsed(data) {
    try {
      await AsyncStorage.setItem('streakSafeguardUsed', JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error setting streak safeguard:', error);
      return false;
    }
  }

  // Clear all data
  static async clearAllData() {
    try {
      const keys = [
        'userProfile', 'dailyGoal', 'currentStreak', 'history',
        'userXP', 'unlockedThemes', 'appSettings', 'streakSafeguardUsed',
        'completedAchievements'
      ];
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    }
  }
}

export default StorageService;
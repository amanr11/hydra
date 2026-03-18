// services/NotificationService.js - Centralized notification service
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import StorageService from './StorageService';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const ANDROID_CHANNEL_ID = 'hydration-reminders';

class NotificationService {
  static async ensureAndroidChannel() {
    if (Platform.OS !== 'android') return true;

    try {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'Hydration reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6FE7DD',
      });
      return true;
    } catch (error) {
      console.error('Error creating Android notification channel:', error);
      return false;
    }
  }

  static async requestPermissions() {
    try {
      await this.ensureAndroidChannel();
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  static async cancelMany(notificationIds) {
    try {
      const ids = (notificationIds || []).filter(Boolean);
      await Promise.all(
        ids.map((id) =>
          Notifications.cancelScheduledNotificationAsync(id).catch((e) => {
            console.warn('Failed to cancel notification', id, e);
            return null;
          })
        )
      );
      return true;
    } catch (e) {
      console.error('Error canceling notification list:', e);
      return false;
    }
  }

  static async scheduleHydrationReminder(title, body, triggerSeconds = 3600) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const trigger =
        triggerSeconds > 0
          ? { type: 'timeInterval', seconds: triggerSeconds, repeats: false }
          : null;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: title || 'Hydra Reminder',
          body: body || '💧 Time to drink some water!',
          sound: true,
          ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
          data: { type: 'hydration_reminder' },
        },
        trigger,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  // SMART reminders (coexistence-safe)
  static async scheduleSmartReminders(userProfile) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return [];

      // Cancel only previous smart reminders (not custom)
      const existingSmartIds = await StorageService.getSmartReminderIds();
      if (existingSmartIds?.length) {
        await this.cancelMany(existingSmartIds);
      }

      const { wakeTime = '07:00', sleepTime = '23:00' } = userProfile || {};
      const wakeHour = parseInt(wakeTime.split(':')[0], 10);
      const wakeMinute = parseInt(wakeTime.split(':')[1] || '0', 10);
      const sleepHour = parseInt(sleepTime.split(':')[0], 10);
      const sleepMinute = parseInt(sleepTime.split(':')[1] || '0', 10);

      if (!Number.isFinite(wakeHour) || !Number.isFinite(sleepHour)) {
        console.error('Invalid wakeTime/sleepTime:', { wakeTime, sleepTime });
        await StorageService.setSmartReminderIds([]);
        return [];
      }

      // simple guard (same-day)
      if (sleepHour < wakeHour || (sleepHour === wakeHour && sleepMinute <= wakeMinute)) {
        console.warn('Sleep time is earlier than wake time; skipping smart reminders.');
        await StorageService.setSmartReminderIds([]);
        return [];
      }

      const ids = [];

      // Every 2 hours while awake
      for (let hour = wakeHour; hour < sleepHour; hour += 2) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Stay Hydrated! 💧',
            body: this.getRandomReminderMessage(),
            sound: true,
            ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
            data: { type: 'smart_reminder' },
          },
          trigger: {
            type: 'calendar',
            hour,
            minute: 0,
            repeats: true,
          },
        });

        ids.push(id);
      }

      await StorageService.setSmartReminderIds(ids);
      return ids;
    } catch (error) {
      console.error('Error scheduling smart reminders:', error);
      await StorageService.setSmartReminderIds([]);
      return [];
    }
  }

  /**
   * Schedules custom reminders on selected weekdays.
   * Returns scheduled IDs per reminder so UI can persist them (for clean canceling).
   */
  static async scheduleCustomReminders(customReminders) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return { scheduledIdsByReminder: {} };

      const scheduledIdsByReminder = {};

      for (const reminder of customReminders || []) {
        // Cancel any previously scheduled IDs for THIS reminder
        if (Array.isArray(reminder.scheduledIds) && reminder.scheduledIds.length > 0) {
          await this.cancelMany(reminder.scheduledIds);
        }

        if (!reminder?.enabled) {
          scheduledIdsByReminder[reminder?.id] = [];
          continue;
        }

        const hour = parseInt(reminder.hour, 10);
        const minute = parseInt(reminder.minute, 10);
        const days = Array.isArray(reminder.days) ? reminder.days : [1, 1, 1, 1, 1, 1, 1];

        if (
          !Number.isFinite(hour) ||
          hour < 0 ||
          hour > 23 ||
          !Number.isFinite(minute) ||
          minute < 0 ||
          minute > 59
        ) {
          console.warn('Skipping invalid custom reminder time:', reminder);
          scheduledIdsByReminder[reminder?.id] = [];
          continue;
        }

        // Expo weekday: 1=Sun..7=Sat ; your array is Mon..Sun (0..6)
        const expoWeekdayFromIndex = (idx) => (idx === 6 ? 1 : idx + 2);

        const idsForThisReminder = [];

        for (let idx = 0; idx < 7; idx++) {
          if (days[idx] !== 1) continue;

          const weekday = expoWeekdayFromIndex(idx);

          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: reminder.title || 'Custom Hydration Reminder',
              body: reminder.message || '💧 Time to drink water!',
              sound: true,
              ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
              data: { type: 'custom_reminder', reminderId: reminder.id, weekday },
            },
            trigger: {
              type: 'calendar',
              weekday,
              hour,
              minute,
              repeats: true,
            },
          });

          idsForThisReminder.push(id);
        }

        scheduledIdsByReminder[reminder.id] = idsForThisReminder;
      }

      return { scheduledIdsByReminder };
    } catch (error) {
      console.error('Error scheduling custom reminders:', error);
      return { scheduledIdsByReminder: {} };
    }
  }

  static async scheduleGoalAchievementNotification() {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Goal Achieved! 🎉',
          body: "Congratulations! You've reached your daily hydration goal!",
          sound: true,
          ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
          data: { type: 'goal_achievement' },
        },
        trigger: null,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling goal achievement notification:', error);
      return null;
    }
  }

  static async scheduleStreakNotification(streakCount) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${streakCount} Day Streak! 🔥`,
          body: `Amazing! You're on a ${streakCount} day hydration streak!`,
          sound: true,
          ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
          data: { type: 'streak_achievement', streak: streakCount },
        },
        trigger: null,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling streak notification:', error);
      return null;
    }
  }

  static async cancelAllReminders() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await StorageService.setSmartReminderIds([]); // keep storage consistent
      return true;
    } catch (error) {
      console.error('Error canceling all reminders:', error);
      return false;
    }
  }

  static getRandomReminderMessage() {
    const messages = [
      '💧 Time to hydrate! Your body will thank you.',
      "🌊 Don't forget to drink water!",
      '💦 Stay refreshed - grab a glass of water!',
      '🚰 Hydration check! Time for some H2O.',
      '🌿 Keep your body happy with some water.',
      '💙 Your hydration reminder is here!',
      '🏃‍♂️ Fuel your body with water!',
      '☀️ Beat dehydration - drink up!',
      '💪 Stay strong, stay hydrated!',
      '🧘‍♀️ Mindful moment: time for water!',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  static async testNotification() {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Hydra Test Notification',
          body: '💧 This is a test notification from Hydra!',
          sound: true,
          ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
          data: { type: 'test' },
        },
        trigger: null,
      });

      return true;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  }
}

export default NotificationService;
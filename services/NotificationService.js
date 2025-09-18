// services/NotificationService.js - Centralized notification service
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  static async requestPermissions() {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  static async scheduleHydrationReminder(title, body, triggerSeconds = 3600) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const trigger = triggerSeconds > 0 
        ? { seconds: triggerSeconds, repeats: false }
        : null;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: title || 'Hydra Reminder',
          body: body || '💧 Time to drink some water!',
          sound: true,
          data: { type: 'hydration_reminder' }
        },
        trigger,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  static async scheduleSmartReminders(userProfile) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return [];
      }

      // Cancel existing reminders
      await this.cancelAllReminders();

      const { wakeTime, sleepTime } = userProfile;
      const wakeHour = parseInt(wakeTime.split(':')[0], 10);
      const sleepHour = parseInt(sleepTime.split(':')[0], 10);
      
      const notifications = [];
      const now = new Date();
      const currentHour = now.getHours();

      // Calculate reminder times (every 2 hours while awake)
      for (let hour = wakeHour; hour < sleepHour; hour += 2) {
        if (hour > currentHour) {
          const triggerTime = new Date();
          triggerTime.setHours(hour, 0, 0, 0);
          
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Stay Hydrated! 💧',
              body: this.getRandomReminderMessage(),
              sound: true,
              data: { type: 'smart_reminder' }
            },
            trigger: {
              hour: hour,
              minute: 0,
              repeats: true
            }
          });
          
          notifications.push(notificationId);
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error scheduling smart reminders:', error);
      return [];
    }
  }

  static async scheduleCustomReminders(customReminders) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return [];
      }

      const notifications = [];

      for (const reminder of customReminders) {
        if (reminder.enabled) {
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: reminder.title || 'Custom Hydration Reminder',
              body: reminder.message || '💧 Time to drink water!',
              sound: true,
              data: { type: 'custom_reminder', reminderId: reminder.id }
            },
            trigger: {
              hour: reminder.hour,
              minute: reminder.minute,
              repeats: true
            }
          });
          
          notifications.push(notificationId);
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error scheduling custom reminders:', error);
      return [];
    }
  }

  static async scheduleGoalAchievementNotification() {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Goal Achieved! 🎉',
          body: 'Congratulations! You\'ve reached your daily hydration goal!',
          sound: true,
          data: { type: 'goal_achievement' }
        },
        trigger: null, // Immediate notification
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
      if (!hasPermission) {
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${streakCount} Day Streak! 🔥`,
          body: `Amazing! You're on a ${streakCount} day hydration streak!`,
          sound: true,
          data: { type: 'streak_achievement', streak: streakCount }
        },
        trigger: null, // Immediate notification
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
      return true;
    } catch (error) {
      console.error('Error canceling all reminders:', error);
      return false;
    }
  }

  static async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      return true;
    } catch (error) {
      console.error('Error canceling notification:', error);
      return false;
    }
  }

  static getRandomReminderMessage() {
    const messages = [
      '💧 Time to hydrate! Your body will thank you.',
      '🌊 Don\'t forget to drink water!',
      '💦 Stay refreshed - grab a glass of water!',
      '🚰 Hydration check! Time for some H2O.',
      '🌿 Keep your body happy with some water.',
      '💙 Your hydration reminder is here!',
      '🏃‍♂️ Fuel your body with water!',
      '☀️ Beat dehydration - drink up!',
      '💪 Stay strong, stay hydrated!',
      '🧘‍♀️ Mindful moment: time for water!'
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }

  static async getPendingNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications;
    } catch (error) {
      console.error('Error getting pending notifications:', error);
      return [];
    }
  }

  static async testNotification() {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return false;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Hydra Test Notification',
          body: '💧 This is a test notification from Hydra!',
          sound: true,
          data: { type: 'test' }
        },
        trigger: null, // Immediate
      });

      return true;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  }
}

export default NotificationService;
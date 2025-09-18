// services/StreakService.js - Streak safeguard and management
import StorageService from './StorageService';
import { getTodayKey } from '../utils';

class StreakService {
  // Check if user can use streak safeguard (once per month)
  static async canUseStreakSafeguard() {
    try {
      const safeguardData = await StorageService.getStreakSafeguardUsed();
      const now = new Date();
      const currentMonth = now.getFullYear() * 12 + now.getMonth();
      
      if (!safeguardData.lastUsed) {
        return true;
      }
      
      const lastUsedDate = new Date(safeguardData.lastUsed);
      const lastUsedMonth = lastUsedDate.getFullYear() * 12 + lastUsedDate.getMonth();
      
      return currentMonth > lastUsedMonth;
    } catch (error) {
      console.error('Error checking streak safeguard availability:', error);
      return false;
    }
  }

  // Use streak safeguard to restore a missed day
  static async useStreakSafeguard(missedDate) {
    try {
      const canUse = await this.canUseStreakSafeguard();
      if (!canUse) {
        return { success: false, error: 'Streak safeguard already used this month' };
      }

      // Get current data
      const history = await StorageService.getHistory();
      const dailyGoal = await StorageService.getDailyGoal();
      
      // Check if the missed date actually needs safeguard
      if (history[missedDate] && history[missedDate] >= dailyGoal) {
        return { success: false, error: 'This day already meets the goal' };
      }

      // Apply safeguard - set the missed day to meet the goal
      const updatedHistory = {
        ...history,
        [missedDate]: dailyGoal
      };

      // Save updated history
      await StorageService.setHistory(updatedHistory);
      
      // Update safeguard usage
      const safeguardData = {
        count: 1,
        lastUsed: new Date().toISOString()
      };
      await StorageService.setStreakSafeguardUsed(safeguardData);

      // Recalculate streak
      const newStreak = await this.calculateStreakFromHistory(updatedHistory);
      await StorageService.setStreak(newStreak);

      return {
        success: true,
        newStreak,
        message: `Streak safeguard applied! Your ${newStreak} day streak is restored.`
      };
    } catch (error) {
      console.error('Error using streak safeguard:', error);
      return { success: false, error: 'Failed to apply streak safeguard' };
    }
  }

  // Calculate streak from history
  static async calculateStreakFromHistory(historyData = null) {
    try {
      const history = historyData || await StorageService.getHistory();
      const dailyGoal = await StorageService.getDailyGoal();
      const today = getTodayKey();
      
      const dates = Object.keys(history).sort().reverse();
      let currentStreak = 0;
      
      // Check if today's goal is met
      const todayTotal = history[today] || 0;
      if (todayTotal >= dailyGoal) {
        currentStreak = 1;
        
        // Count consecutive days before today
        for (let i = 1; i < dates.length; i++) {
          const date = dates[i];
          const total = history[date];
          
          if (total >= dailyGoal) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
      
      return currentStreak;
    } catch (error) {
      console.error('Error calculating streak from history:', error);
      return 0;
    }
  }

  // Get streak statistics
  static async getStreakStats() {
    try {
      const [history, currentStreak, safeguardData] = await Promise.all([
        StorageService.getHistory(),
        StorageService.getStreak(),
        StorageService.getStreakSafeguardUsed()
      ]);

      const dailyGoal = await StorageService.getDailyGoal();
      const dates = Object.keys(history).sort();
      
      // Calculate longest streak
      let longestStreak = 0;
      let tempStreak = 0;
      
      for (const date of dates) {
        if (history[date] >= dailyGoal) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }

      // Calculate total successful days
      const successfulDays = dates.filter(date => history[date] >= dailyGoal).length;
      
      // Calculate streak milestones reached
      const milestones = [3, 7, 14, 30, 50, 100];
      const milestonesReached = milestones.filter(milestone => longestStreak >= milestone);

      return {
        currentStreak,
        longestStreak,
        successfulDays,
        totalDaysTracked: dates.length,
        milestonesReached,
        canUseSafeguard: await this.canUseStreakSafeguard(),
        safeguardData
      };
    } catch (error) {
      console.error('Error getting streak stats:', error);
      return {
        currentStreak: 0,
        longestStreak: 0,
        successfulDays: 0,
        totalDaysTracked: 0,
        milestonesReached: [],
        canUseSafeguard: false,
        safeguardData: { count: 0, lastUsed: null }
      };
    }
  }

  // Get dates that broke the streak (for safeguard suggestions)
  static async getStreakBreakers() {
    try {
      const history = await StorageService.getHistory();
      const dailyGoal = await StorageService.getDailyGoal();
      const dates = Object.keys(history).sort().reverse();
      
      const streakBreakers = [];
      const today = getTodayKey();
      
      // Look for dates that broke the current streak
      let streakBroken = false;
      for (const date of dates) {
        if (date === today) continue; // Skip today
        
        const total = history[date];
        if (total < dailyGoal && !streakBroken) {
          streakBreakers.push({
            date,
            total,
            shortfall: dailyGoal - total,
            daysAgo: Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24))
          });
          streakBroken = true;
        } else if (total >= dailyGoal && streakBroken) {
          break; // Stop at the first successful day before the break
        }
      }
      
      return streakBreakers.slice(0, 3); // Return up to 3 recent breaks
    } catch (error) {
      console.error('Error getting streak breakers:', error);
      return [];
    }
  }

  // Get next streak milestone
  static getNextStreakMilestone(currentStreak) {
    const milestones = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 365];
    return milestones.find(milestone => milestone > currentStreak) || null;
  }

  // Calculate days until next milestone
  static getDaysToNextMilestone(currentStreak) {
    const nextMilestone = this.getNextStreakMilestone(currentStreak);
    return nextMilestone ? nextMilestone - currentStreak : 0;
  }

  // Get streak motivation message
  static getStreakMotivation(streak) {
    if (streak === 0) {
      return "🌟 Start your hydration journey today!";
    } else if (streak < 3) {
      return `💪 Keep going! You're building a great habit.`;
    } else if (streak < 7) {
      return `🔥 Amazing! You're on a ${streak} day streak!`;
    } else if (streak < 30) {
      return `🏆 Incredible ${streak} day streak! You're unstoppable!`;
    } else if (streak < 100) {
      return `👑 ${streak} days! You're a hydration champion!`;
    } else {
      return `🌟 ${streak} days! You're a true hydration legend!`;
    }
  }
}

export default StreakService;
// services/XPService.js - Experience points and gamification system
import StorageService from './StorageService';

class XPService {
  // XP rewards for different actions
  static XP_REWARDS = {
    DRINK_WATER: 5,
    REACH_25_PERCENT: 10,
    REACH_50_PERCENT: 15,
    REACH_75_PERCENT: 20,
    COMPLETE_DAILY_GOAL: 50,
    MAINTAIN_STREAK_3: 25,
    MAINTAIN_STREAK_7: 75,
    MAINTAIN_STREAK_14: 150,
    MAINTAIN_STREAK_30: 300,
    FIRST_DRINK_OF_DAY: 10,
    CONSISTENT_WEEK: 100,
    PERFECT_WEEK: 200,
    USE_VOICE_LOGGING: 5,
    CUSTOM_REMINDER_COMPLETE: 5
  };

  // Level thresholds
  static LEVEL_THRESHOLDS = [
    0,     // Level 1
    100,   // Level 2
    250,   // Level 3
    500,   // Level 4
    800,   // Level 5
    1200,  // Level 6
    1700,  // Level 7
    2300,  // Level 8
    3000,  // Level 9
    3800,  // Level 10
    4700,  // Level 11
    5700,  // Level 12
    6800,  // Level 13
    8000,  // Level 14
    9300,  // Level 15
    10700, // Level 16
    12200, // Level 17
    13800, // Level 18
    15500, // Level 19
    17300, // Level 20
  ];

  static async getCurrentXP() {
    return await StorageService.getXP();
  }

  static async addXP(amount, reason = '') {
    try {
      const currentXP = await this.getCurrentXP();
      const newXP = currentXP + amount;
      
      const oldLevel = this.getLevel(currentXP);
      const newLevel = this.getLevel(newXP);
      
      await StorageService.setXP(newXP);
      
      // Check for level up
      if (newLevel > oldLevel) {
        await this.handleLevelUp(newLevel, oldLevel);
      }
      
      return {
        oldXP: currentXP,
        newXP: newXP,
        gainedXP: amount,
        oldLevel: oldLevel,
        newLevel: newLevel,
        leveledUp: newLevel > oldLevel,
        reason: reason
      };
    } catch (error) {
      console.error('Error adding XP:', error);
      return null;
    }
  }

  static getLevel(xp) {
    for (let i = this.LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= this.LEVEL_THRESHOLDS[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  static getXPForNextLevel(currentXP) {
    const currentLevel = this.getLevel(currentXP);
    if (currentLevel >= this.LEVEL_THRESHOLDS.length) {
      return null; // Max level reached
    }
    
    const nextLevelXP = this.LEVEL_THRESHOLDS[currentLevel];
    return nextLevelXP - currentXP;
  }

  static getProgressToNextLevel(currentXP) {
    const currentLevel = this.getLevel(currentXP);
    if (currentLevel >= this.LEVEL_THRESHOLDS.length) {
      return 100; // Max level
    }
    
    const currentLevelXP = this.LEVEL_THRESHOLDS[currentLevel - 1];
    const nextLevelXP = this.LEVEL_THRESHOLDS[currentLevel];
    const progressXP = currentXP - currentLevelXP;
    const totalXPNeeded = nextLevelXP - currentLevelXP;
    
    return Math.round((progressXP / totalXPNeeded) * 100);
  }

  static async handleLevelUp(newLevel, oldLevel) {
    try {
      // Unlock themes based on level
      const unlockedThemes = await StorageService.getUnlockedThemes();
      const newThemes = [...unlockedThemes];
      
      // Level-based theme unlocks
      if (newLevel >= 5 && !newThemes.includes('sunset')) {
        newThemes.push('sunset');
      }
      if (newLevel >= 10 && !newThemes.includes('forest')) {
        newThemes.push('forest');
      }
      if (newLevel >= 15 && !newThemes.includes('midnight')) {
        newThemes.push('midnight');
      }
      if (newLevel >= 20 && !newThemes.includes('rose')) {
        newThemes.push('rose');
      }
      
      if (newThemes.length > unlockedThemes.length) {
        await StorageService.setUnlockedThemes(newThemes);
      }
      
      return {
        level: newLevel,
        previousLevel: oldLevel,
        newThemesUnlocked: newThemes.filter(theme => !unlockedThemes.includes(theme))
      };
    } catch (error) {
      console.error('Error handling level up:', error);
      return null;
    }
  }

  static async calculateDailyXP(totalIntake, dailyGoal, streak, isFirstDrink = false) {
    let totalXP = 0;
    const rewards = [];

    if (isFirstDrink) {
      totalXP += this.XP_REWARDS.FIRST_DRINK_OF_DAY;
      rewards.push({ action: 'First drink of the day', xp: this.XP_REWARDS.FIRST_DRINK_OF_DAY });
    }

    const percentage = (totalIntake / dailyGoal) * 100;

    // Progress milestones
    if (percentage >= 25 && percentage < 50) {
      totalXP += this.XP_REWARDS.REACH_25_PERCENT;
      rewards.push({ action: '25% of daily goal', xp: this.XP_REWARDS.REACH_25_PERCENT });
    } else if (percentage >= 50 && percentage < 75) {
      totalXP += this.XP_REWARDS.REACH_50_PERCENT;
      rewards.push({ action: '50% of daily goal', xp: this.XP_REWARDS.REACH_50_PERCENT });
    } else if (percentage >= 75 && percentage < 100) {
      totalXP += this.XP_REWARDS.REACH_75_PERCENT;
      rewards.push({ action: '75% of daily goal', xp: this.XP_REWARDS.REACH_75_PERCENT });
    } else if (percentage >= 100) {
      totalXP += this.XP_REWARDS.COMPLETE_DAILY_GOAL;
      rewards.push({ action: 'Daily goal completed!', xp: this.XP_REWARDS.COMPLETE_DAILY_GOAL });
    }

    // Streak bonuses
    if (streak >= 30) {
      totalXP += this.XP_REWARDS.MAINTAIN_STREAK_30;
      rewards.push({ action: '30-day streak!', xp: this.XP_REWARDS.MAINTAIN_STREAK_30 });
    } else if (streak >= 14) {
      totalXP += this.XP_REWARDS.MAINTAIN_STREAK_14;
      rewards.push({ action: '14-day streak!', xp: this.XP_REWARDS.MAINTAIN_STREAK_14 });
    } else if (streak >= 7) {
      totalXP += this.XP_REWARDS.MAINTAIN_STREAK_7;
      rewards.push({ action: '7-day streak!', xp: this.XP_REWARDS.MAINTAIN_STREAK_7 });
    } else if (streak >= 3) {
      totalXP += this.XP_REWARDS.MAINTAIN_STREAK_3;
      rewards.push({ action: '3-day streak!', xp: this.XP_REWARDS.MAINTAIN_STREAK_3 });
    }

    return { totalXP, rewards };
  }

  static getLevelTitle(level) {
    const titles = {
      1: '💧 Hydration Newbie',
      2: '🌊 Water Warrior',
      3: '💦 Hydration Hero',
      4: '🏊‍♂️ Aqua Athlete',
      5: '🌊 Wave Rider',
      6: '💎 Crystal Clear',
      7: '🏆 Hydration Champion',
      8: '🌟 Aqua Star',
      9: '💫 Hydration Master',
      10: '👑 Water Royalty',
      11: '🔱 Neptune\'s Chosen',
      12: '🌊 Tsunami Tamer',
      13: '💧 Drop Deity',
      14: '🏛️ Aqua Architect',
      15: '🌊 Ocean Oracle',
      16: '💎 Diamond Drinker',
      17: '🚀 Hydration Hero',
      18: '🌟 Stellar Sipper',
      19: '👑 Aqua Emperor',
      20: '🔱 Hydration God'
    };
    
    return titles[level] || `🌊 Level ${level} Hydrator`;
  }

  static getXPSummary(currentXP) {
    const level = this.getLevel(currentXP);
    const xpToNext = this.getXPForNextLevel(currentXP);
    const progress = this.getProgressToNextLevel(currentXP);
    const title = this.getLevelTitle(level);
    
    return {
      currentXP,
      level,
      title,
      xpToNext,
      progress,
      isMaxLevel: level >= this.LEVEL_THRESHOLDS.length
    };
  }
}

export default XPService;
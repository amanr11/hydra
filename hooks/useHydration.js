// hooks/useHydration.js - Custom hook for hydration data management
import { useState, useEffect, useCallback } from 'react';
import StorageService from '../services/StorageService';
import NotificationService from '../services/NotificationService';
import XPService from '../services/XPService';
import { getTodayKey } from '../utils';

export const useHydration = (userProfile) => {
  const [total, setTotal] = useState(0);
  const [history, setHistory] = useState({});
  const [todayIntake, setTodayIntake] = useState([]);
  const [streak, setStreak] = useState(0);
  const [userXP, setUserXP] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const todayKey = getTodayKey();
      const [
        savedTotal,
        savedHistory,
        savedIntake,
        savedStreak,
        savedXP
      ] = await Promise.all([
        StorageService.getDailyTotal(todayKey),
        StorageService.getHistory(),
        StorageService.getTodayIntake(todayKey),
        StorageService.getStreak(),
        StorageService.getXP()
      ]);
      
      setTotal(savedTotal);
      setHistory(savedHistory);
      setTodayIntake(savedIntake);
      setStreak(savedStreak);
      setUserXP(savedXP);
      
      // Update streak based on history
      await updateStreakFromHistory(savedHistory);
    } catch (err) {
      console.error('Error loading hydration data:', err);
      setError('Failed to load hydration data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Update streak based on history
  const updateStreakFromHistory = useCallback(async (historyData = history) => {
    try {
      const dates = Object.keys(historyData).sort().reverse();
      let currentStreak = 0;
      const today = getTodayKey();
      
      // Check if today's goal is met
      const dailyGoal = await StorageService.getDailyGoal();
      const todayTotal = historyData[today] || 0;
      
      if (todayTotal >= dailyGoal) {
        currentStreak = 1;
        
        // Count consecutive days before today
        for (let i = 1; i < dates.length; i++) {
          const date = dates[i];
          const total = historyData[date];
          
          if (total >= dailyGoal) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
      
      if (currentStreak !== streak) {
        setStreak(currentStreak);
        await StorageService.setStreak(currentStreak);
        
        // Trigger streak notifications for milestones
        if (currentStreak > 0 && currentStreak % 7 === 0) {
          NotificationService.scheduleStreakNotification(currentStreak);
        }
      }
    } catch (err) {
      console.error('Error updating streak:', err);
    }
  }, [history, streak]);

  // Save data to storage
  const saveData = useCallback(async (newTotal) => {
    try {
      const todayKey = getTodayKey();
      const newHistory = { ...history, [todayKey]: newTotal };
      
      await Promise.all([
        StorageService.setDailyTotal(todayKey, newTotal),
        StorageService.setHistory(newHistory)
      ]);
      
      setHistory(newHistory);
      
      // Update streak if goal is reached
      const dailyGoal = await StorageService.getDailyGoal();
      if (newTotal >= dailyGoal) {
        await updateStreakFromHistory(newHistory);
      }
      
      return true;
    } catch (err) {
      console.error('Error saving hydration data:', err);
      return false;
    }
  }, [history, updateStreakFromHistory]);

  // Add drink with XP calculation
  const addDrink = useCallback(async (option) => {
    try {
      const effectiveML = Math.round(option.ml * (option.hydrationValue || 1.0));
      const newTotal = total + effectiveML;
      const timestamp = new Date().toISOString();
      
      const newIntakeEntry = {
        time: timestamp,
        amount: effectiveML,
        drink: option.label,
        emoji: option.emoji,
        category: option.category || 'water'
      };
      
      const updatedIntake = [...todayIntake, newIntakeEntry];
      const isFirstDrink = todayIntake.length === 0;
      
      // Update state
      setTotal(newTotal);
      setTodayIntake(updatedIntake);
      
      // Save to storage
      await saveData(newTotal);
      await StorageService.setTodayIntake(getTodayKey(), updatedIntake);
      
      // Calculate and add XP
      const dailyGoal = await StorageService.getDailyGoal();
      const xpResult = await XPService.calculateDailyXP(newTotal, dailyGoal, streak, isFirstDrink);
      
      if (xpResult.totalXP > 0) {
        const xpGain = await XPService.addXP(xpResult.totalXP, 'Hydration progress');
        if (xpGain) {
          setUserXP(xpGain.newXP);
          
          // Show XP notification for significant gains
          if (xpGain.gainedXP >= 25) {
            NotificationService.scheduleHydrationReminder(
              `+${xpGain.gainedXP} XP!`,
              `Great job! You earned ${xpGain.gainedXP} experience points.`,
              0
            );
          }
        }
      }
      
      // Trigger goal achievement notification
      if (newTotal >= dailyGoal && total < dailyGoal) {
        NotificationService.scheduleGoalAchievementNotification();
      }
      
      return {
        success: true,
        newTotal,
        xpGained: xpResult.totalXP
      };
    } catch (err) {
      console.error('Error adding drink:', err);
      return { success: false, error: err.message };
    }
  }, [total, todayIntake, history, streak, saveData]);

  // Reset day
  const resetDay = useCallback(async () => {
    try {
      const todayKey = getTodayKey();
      setTotal(0);
      setTodayIntake([]);
      
      await Promise.all([
        StorageService.setDailyTotal(todayKey, 0),
        StorageService.setTodayIntake(todayKey, [])
      ]);
      
      const newHistory = { ...history };
      delete newHistory[todayKey];
      setHistory(newHistory);
      await StorageService.setHistory(newHistory);
      
      return true;
    } catch (err) {
      console.error('Error resetting day:', err);
      return false;
    }
  }, [history]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    // State
    total,
    history,
    todayIntake,
    streak,
    userXP,
    loading,
    error,
    
    // Actions
    addDrink,
    resetDay,
    loadData,
    updateStreakFromHistory,
    
    // Utils
    saveData
  };
};
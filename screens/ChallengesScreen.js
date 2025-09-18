// screens/ChallengesScreen.js - Enhanced Achievements & Challenges
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WaveBottom from '../components/WaveBottom';
import GradientBackground from '../components/GradientBackground';
import { COLOR } from '../components/Theme';
import * as Animatable from 'react-native-animatable';

export default function ChallengesScreen({ streak, theme, userProfile }) {
  const [completedAchievements, setCompletedAchievements] = useState([]);
  const [activeChallenges, setActiveChallenges] = useState([]);

  const achievements = [
    { id: 'first_drop', title: 'First Drop', desc: 'Log your first drink', goal: 1, type: 'drinks', icon: '💧', reward: 'Hydration Hero badge' },
    { id: 'streak_3', title: 'Getting Started', desc: '3-day streak', goal: 3, type: 'streak', icon: '🔥', reward: '50 points' },
    { id: 'streak_7', title: 'Week Warrior', desc: '7-day streak', goal: 7, type: 'streak', icon: '🏆', reward: 'Weekly Champion badge' },
    { id: 'streak_14', title: 'Fortnight Fighter', desc: '14-day streak', goal: 14, type: 'streak', icon: '💪', reward: '100 points' },
    { id: 'streak_30', title: 'Monthly Master', desc: '30-day streak', goal: 30, type: 'streak', icon: '👑', reward: 'Elite Hydrator badge' },
    { id: 'early_bird', title: 'Early Bird', desc: 'Drink within 1 hour of waking', goal: 1, type: 'special', icon: '🌅', reward: 'Morning Warrior badge' },
    { id: 'overachiever', title: 'Overachiever', desc: 'Exceed goal by 50%', goal: 1, type: 'special', icon: '🚀', reward: 'Bonus points' },
  ];

  const weeklyTypes = [
    { id: 'social_1', title: '7-Day Team Challenge', desc: 'Join friends for a week-long hydration challenge', participants: 12, reward: '200 points', status: 'active' },
    { id: 'personal_1', title: 'Perfect Week', desc: 'Hit your goal every day this week', progress: '4/7', reward: '150 points', status: 'active' },
    { id: 'community_1', title: 'Community Goal', desc: 'Help reach 10,000L community goal', progress: '67%', reward: 'Special badge', status: 'active' },
  ];

  useEffect(() => {
    loadAchievements();
  }, [streak]);

  const loadAchievements = async () => {
    try {
      const saved = await AsyncStorage.getItem('completedAchievements');
      const completed = saved ? JSON.parse(saved) : [];
      setCompletedAchievements(completed);
    } catch (error) {
      console.log('Error loading achievements:', error);
    }
  };

  const unlockAchievement = async (achievement) => {
    if (completedAchievements.includes(achievement.id)) return;

    const newCompleted = [...completedAchievements, achievement.id];
    setCompletedAchievements(newCompleted);
    await AsyncStorage.setItem('completedAchievements', JSON.stringify(newCompleted));

    Alert.alert(
      'Achievement Unlocked! 🎉',
      `${achievement.icon} ${achievement.title}\n\nReward: ${achievement.reward}`,
      [{ text: 'Awesome!', style: 'default' }]
    );
  };

  const isAchievementUnlocked = (achievement) => {
    if (achievement.type === 'streak') {
      return streak >= achievement.goal;
    }
    return completedAchievements.includes(achievement.id);
  };

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1, padding: 20 }} showsVerticalScrollIndicator={false}>
          <Animatable.Text 
            animation="fadeInDown"
            style={{ fontSize: 28, fontWeight: 'bold', color: COLOR.white, marginBottom: 20 }}
          >
            🏆 Achievements & Challenges
          </Animatable.Text>

          {/* Active Challenges */}
          <View style={{ marginBottom: 30 }}>
            <Text style={{ fontSize: 22, fontWeight: '600', color: COLOR.aquaMint, marginBottom: 15 }}>
              🎯 Active Challenges
            </Text>
            {weeklyTypes.map((challenge, idx) => (
              <Animatable.View
                key={challenge.id}
                animation="fadeInUp"
                delay={idx * 100}
                style={{
                  backgroundColor: 'rgba(58, 190, 255, 0.15)',
                  borderRadius: 15,
                  padding: 15,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: COLOR.skyBlue,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ color: COLOR.white, fontWeight: '700', fontSize: 16, flex: 1 }}>
                    {challenge.title}
                  </Text>
                  <View style={{ 
                    backgroundColor: COLOR.amber, 
                    paddingHorizontal: 8, 
                    paddingVertical: 4, 
                    borderRadius: 12 
                  }}>
                    <Text style={{ color: COLOR.deepNavy, fontWeight: '600', fontSize: 10 }}>
                      ACTIVE
                    </Text>
                  </View>
                </View>
                <Text style={{ color: COLOR.white, opacity: 0.8, fontSize: 14, marginBottom: 8 }}>
                  {challenge.desc}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: COLOR.aquaMint, fontWeight: '600' }}>
                    {challenge.progress || `${challenge.participants} participants`}
                  </Text>
                  <Text style={{ color: COLOR.amber, fontWeight: '600' }}>
                    {challenge.reward}
                  </Text>
                </View>
              </Animatable.View>
            ))}
          </View>

          {/* Achievements */}
          <View>
            <Text style={{ fontSize: 22, fontWeight: '600', color: COLOR.aquaMint, marginBottom: 15 }}>
              🏅 Achievements
            </Text>
            {achievements.map((achievement, idx) => {
              const isUnlocked = isAchievementUnlocked(achievement);
              return (
                <Animatable.View
                  key={achievement.id}
                  animation="fadeInUp"
                  delay={200 + idx * 100}
                  style={{
                    backgroundColor: isUnlocked 
                      ? 'rgba(111, 231, 221, 0.2)' 
                      : 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 15,
                    padding: 15,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: isUnlocked ? COLOR.aquaMint : 'rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ 
                      fontSize: 30, 
                      marginRight: 12,
                      opacity: isUnlocked ? 1 : 0.5 
                    }}>
                      {achievement.icon}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ 
                        color: COLOR.white, 
                        fontWeight: '700', 
                        fontSize: 16,
                        opacity: isUnlocked ? 1 : 0.7 
                      }}>
                        {achievement.title}
                      </Text>
                      <Text style={{ 
                        color: COLOR.white, 
                        opacity: isUnlocked ? 0.9 : 0.5, 
                        fontSize: 14 
                      }}>
                        {achievement.desc}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ 
                        color: isUnlocked ? COLOR.aquaMint : COLOR.coral, 
                        fontWeight: '600',
                        fontSize: 12 
                      }}>
                        {isUnlocked ? '✅ UNLOCKED' : '🔒 LOCKED'}
                      </Text>
                      <Text style={{ 
                        color: COLOR.amber, 
                        fontWeight: '500', 
                        fontSize: 11,
                        opacity: isUnlocked ? 1 : 0.7 
                      }}>
                        {achievement.reward}
                      </Text>
                    </View>
                  </View>
                  {achievement.type === 'streak' && (
                    <View style={{
                      backgroundColor: 'rgba(58, 190, 255, 0.2)',
                      borderRadius: 8,
                      padding: 8,
                      marginTop: 8,
                    }}>
                      <Text style={{ color: COLOR.white, fontSize: 12, textAlign: 'center' }}>
                        Progress: {Math.min(streak, achievement.goal)}/{achievement.goal} days
                      </Text>
                      <View style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        height: 4,
                        borderRadius: 2,
                        marginTop: 4,
                      }}>
                        <View style={{
                          backgroundColor: COLOR.aquaMint,
                          height: 4,
                          borderRadius: 2,
                          width: `${Math.min((streak / achievement.goal) * 100, 100)}%`,
                        }} />
                      </View>
                    </View>
                  )}
                </Animatable.View>
              );
            })}
          </View>
          
          {/* Stats Summary */}
          <View style={{ marginTop: 20, marginBottom: 50 }}>
            <Text style={{ fontSize: 22, fontWeight: '600', color: COLOR.aquaMint, marginBottom: 15 }}>
              📊 Your Progress
            </Text>
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 15,
              padding: 20,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, color: COLOR.amber }}>🏆</Text>
                  <Text style={{ color: COLOR.white, fontWeight: '700', fontSize: 18 }}>
                    {achievements.filter(a => isAchievementUnlocked(a)).length}
                  </Text>
                  <Text style={{ color: COLOR.white, opacity: 0.8, fontSize: 12 }}>
                    Unlocked
                  </Text>
                </View>
                
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, color: COLOR.skyBlue }}>🎯</Text>
                  <Text style={{ color: COLOR.white, fontWeight: '700', fontSize: 18 }}>
                    {weeklyTypes.filter(c => c.status === 'active').length}
                  </Text>
                  <Text style={{ color: COLOR.white, opacity: 0.8, fontSize: 12 }}>
                    Active
                  </Text>
                </View>
                
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, color: COLOR.coral }}>🔥</Text>
                  <Text style={{ color: COLOR.white, fontWeight: '700', fontSize: 18 }}>
                    {streak}
                  </Text>
                  <Text style={{ color: COLOR.white, opacity: 0.8, fontSize: 12 }}>
                    Best Streak
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
        <WaveBottom />
      </SafeAreaView>
    </GradientBackground>
  );
}
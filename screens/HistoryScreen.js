import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WaveBottom from '../components/WaveBottom';
import GradientBackground from '../components/GradientBackground';
import { COLOR } from '../components/Theme';
import * as Animatable from 'react-native-animatable';

export default function HistoryScreen({ dailyGoal, theme }) {
  const [history, setHistory] = useState({});

  useEffect(() => { 
    loadHistory(); 
  }, []);

  const loadHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('history');
      setHistory(savedHistory ? JSON.parse(savedHistory) : {});
    } catch (error) {
      console.log('Error loading history:', error);
    }
  };

  const getProgressEmoji = (value, goal) => {
    const percentage = (value / goal) * 100;
    if (percentage >= 100) return '🏆';
    if (percentage >= 80) return '💪';
    if (percentage >= 60) return '👍';
    if (percentage >= 40) return '⚡';
    return '💧';
  };

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, padding: 20 }}>
          <Animatable.Text 
            animation="fadeInDown"
            style={{ fontSize: 28, fontWeight: 'bold', color: COLOR.white, marginBottom: 20 }}
          >
            📜 History
          </Animatable.Text>
          
          <ScrollView style={{ marginTop: 20 }} showsVerticalScrollIndicator={false}>
            {Object.entries(history).length === 0 ? (
              <Animatable.View 
                animation="fadeIn"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  padding: 20,
                  borderRadius: 15,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 50, marginBottom: 10 }}>💧</Text>
                <Text style={{ color: COLOR.white, fontSize: 18, fontWeight: '600', textAlign: 'center' }}>
                  No history yet!
                </Text>
                <Text style={{ color: COLOR.white, opacity: 0.8, fontSize: 14, textAlign: 'center', marginTop: 5 }}>
                  Start tracking your water intake to see your progress here.
                </Text>
              </Animatable.View>
            ) : (
              Object.entries(history)
                .sort((a, b) => new Date(b[0]) - new Date(a[0]))
                .map(([date, val], index) => (
                  <Animatable.View
                    key={date}
                    animation="fadeInUp"
                    delay={index * 100}
                    style={{
                      marginBottom: 12,
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      padding: 15,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: val >= dailyGoal ? COLOR.aquaMint : 'rgba(255,255,255,0.2)',
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 24, marginRight: 12 }}>
                          {getProgressEmoji(val, dailyGoal)}
                        </Text>
                        <View>
                          <Text style={{ color: COLOR.white, fontWeight: '600', fontSize: 16 }}>
                            {new Date(date).toLocaleDateString('en', { 
                              weekday: 'short',
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </Text>
                          <Text style={{ color: COLOR.white, opacity: 0.7, fontSize: 12 }}>
                            {date}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ 
                          color: val >= dailyGoal ? COLOR.aquaMint : COLOR.white, 
                          fontWeight: '700',
                          fontSize: 18 
                        }}>
                          {val} ml
                        </Text>
                        <Text style={{ color: COLOR.white, opacity: 0.7, fontSize: 12 }}>
                          {Math.round((val / dailyGoal) * 100)}% of goal
                        </Text>
                      </View>
                    </View>
                  </Animatable.View>
                ))
            )}
          </ScrollView>
          <WaveBottom/>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

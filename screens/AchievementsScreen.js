import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WaveBottom from '../components/WaveBottom';

export default function AchievementsScreen({ streak, theme }) {
  const achievements = [
    { title:'3-Day Streak', goal:3, icon:'🔥' },
    { title:'7-Day Streak', goal:7, icon:'🏆' },
    { title:'14-Day Streak', goal:14, icon:'💪' },
    { title:'30-Day Streak', goal:30, icon:'👑' },
  ];

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: theme.background }}>
      <View style={{flex:1,padding:20}}>
        <Text style={{fontSize:22,fontWeight:'bold',color: theme.text}}>🏆 Achievements</Text>
        <ScrollView style={{marginTop:20}}>
          {achievements.map((a,idx)=>(
            <View key={idx} style={{
              marginBottom:12, padding:12, 
              backgroundColor: theme.secondary, 
              borderRadius:10
            }}>
              <Text style={{color: theme.text, fontWeight:'bold'}}>{a.icon} {a.title}</Text>
              <Text style={{color: theme.text}}>{streak >= a.goal ? '✅ Completed' : '❌ Locked'}</Text>
            </View>
          ))}
        </ScrollView>
        <WaveBottom />
      </View>
    </SafeAreaView>
  );
}

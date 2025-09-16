import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView, StatusBar } from 'react-native';

export default function AchievementsScreen({ streak, theme }) {
  const achievements = [
    { title:'3-Day Streak', goal:3 },
    { title:'7-Day Streak', goal:7 },
    { title:'14-Day Streak', goal:14 },
    { title:'30-Day Streak', goal:30 },
  ];

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: theme.background, paddingTop: Platform.OS==='android' ? StatusBar.currentHeight : 0 }}>

    <View style={{flex:1,padding:20,backgroundColor: theme.background}}>
      <Text style={{fontSize:22,fontWeight:'bold',color: theme.text}}>🏆 Achievements</Text>
      <ScrollView style={{marginTop:20}}>
        {achievements.map((a,idx)=>(
          <View key={idx} style={{marginBottom:12, padding:12, backgroundColor: theme.secondary, borderRadius:10}}>
            <Text style={{color: theme.text, fontWeight:'bold'}}>{a.title}</Text>
            <Text style={{color: theme.text}}>{streak >= a.goal ? '✅ Completed' : '❌ Locked'}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
    </SafeAreaView>

  );
}

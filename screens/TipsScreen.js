import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export default function TipsScreen({ theme }) {
  const tips = [
    'Drink a glass of water first thing in the morning.',
    'Keep a bottle at your desk to remind yourself.',
    'Add fruit slices for flavor.',
    'Drink before meals to stay hydrated.',
    'Set hourly reminders to sip water.',
  ];

  return (
    <View style={{flex:1,padding:20,backgroundColor: theme.background}}>
      <Text style={{fontSize:22,fontWeight:'bold',color: theme.text}}>💡 Daily Tips</Text>
      <ScrollView style={{marginTop:20}}>
        {tips.map((tip,idx)=>(
          <View key={idx} style={{marginBottom:12, padding:12, backgroundColor: theme.secondary, borderRadius:10}}>
            <Text style={{color: theme.text}}>{tip}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

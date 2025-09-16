import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTodayKey } from '../utils';

export default function HistoryScreen({ dailyGoal, theme }) {
  const [history, setHistory] = useState({});

  useEffect(()=>{ loadHistory(); }, []);

  const loadHistory = async () => {
    const savedHistory = await AsyncStorage.getItem('history');
    setHistory(savedHistory ? JSON.parse(savedHistory) : {});
  };

  return (
    <View style={{flex:1, padding:20, backgroundColor: theme.background}}>
      <Text style={{fontSize:22,fontWeight:'bold',color: theme.text}}>📜 History</Text>
      <ScrollView style={{marginTop:20}}>
        {Object.entries(history).sort((a,b)=>b[0]-a[0]).map(([date,val])=>(
          <View key={date} style={{marginBottom:10, backgroundColor: theme.secondary, padding:10, borderRadius:8}}>
            <Text style={{color: theme.text}}>{date}: {val} / {dailyGoal} ml</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

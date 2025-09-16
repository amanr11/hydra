import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ConfettiCannon from 'react-native-confetti-cannon';
import { getTodayKey } from '../utils';
import CircularProgress from '../components/CircularProgress';
import GradientBackground from '../components/GradientBackground';
import AnimatedIcon from '../components/AnimatedIcon';
import * as Animatable from 'react-native-animatable';

const drinkOptions = [
  { label:'Small cup', ml:150, emoji:'🥤' },
  { label:'Large cup', ml:300, emoji:'🧋' },
  { label:'Bottle', ml:500, emoji:'🚰' }
];

export default function HomeScreen({ dailyGoal, total, setTotal, streak, setStreak, theme }) {
  const [history, setHistory] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef();

  useEffect(()=>{ loadData(); }, []);
  useEffect(()=>{
    if(total >= dailyGoal && confettiRef.current){
      setShowConfetti(true);
      confettiRef.current.start();
    }
  }, [total]);

  const loadData = async () => {
    const todayKey = getTodayKey();
    const savedTotal = await AsyncStorage.getItem(todayKey);
    const savedHistory = await AsyncStorage.getItem('history');
    setTotal(savedTotal ? parseInt(savedTotal) : 0);
    setHistory(savedHistory ? JSON.parse(savedHistory) : {});
  };

  const saveData = async (newTotal) => {
    const todayKey = getTodayKey();
    await AsyncStorage.setItem(todayKey,newTotal.toString());
    const newHistory = {...history,[todayKey]: newTotal};
    setHistory(newHistory);
    await AsyncStorage.setItem('history',JSON.stringify(newHistory));
    if(newTotal>=dailyGoal) updateStreak();
  };

  const addDrink = async (option) => {
    const newTotal = total + option.ml;
    setTotal(newTotal);
    await saveData(newTotal);
  };

  const resetDay = async () => {
    const todayKey = getTodayKey();
    setTotal(0);
    await AsyncStorage.setItem(todayKey,'0');
  };

  const updateStreak = async () => {
    const yesterdayKey = new Date(Date.now()-86400000).toISOString().slice(0,10);
    const yesterdayTotal = history[yesterdayKey] || 0;
    const newStreak = yesterdayTotal >= dailyGoal ? streak+1 : 1;
    setStreak(newStreak);
  };

  const percent = Math.min(total/dailyGoal,1);

  return (
    <GradientBackground>
      <View style={{flex:1,alignItems:'center',paddingTop:60}}>
        <Text style={{fontSize:36,fontWeight:'bold',color: theme.text}}>Hydra 💧</Text>
        <Animatable.View animation="fadeIn" delay={300}>
          <CircularProgress progress={percent} />
        </Animatable.View>

        <Text style={{fontSize:20,color:theme.text,marginTop:15}}>🔥 Streak: {streak} days</Text>

        <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',marginTop:20}}>
          {drinkOptions.map((o,i)=>(
            <Animatable.View key={i} animation="bounceIn" delay={i*150}>
              <TouchableOpacity
                style={{backgroundColor:'#28a745',padding:15,borderRadius:15,margin:5}}
                onPress={()=>addDrink(o)}
              >
                <Text style={{color:'#fff',fontSize:16,fontWeight:'bold'}}>{o.emoji} {o.label}</Text>
              </TouchableOpacity>
            </Animatable.View>
          ))}
        </View>

        <TouchableOpacity
          onPress={resetDay}
          style={{marginTop:20,backgroundColor:'#f1c40f',padding:12,borderRadius:10}}
        >
          <Text style={{color:'#222',fontWeight:'bold'}}>Reset Day</Text>
        </TouchableOpacity>

        <ScrollView style={{marginTop:30,width:'90%'}}>
          {Object.entries(history).sort((a,b)=>b[0]-a[0]).map(([date,val])=>(
            <View key={date} style={{padding:10,backgroundColor:theme.secondary,borderRadius:10,marginBottom:8}}>
              <Text style={{color:theme.text}}>{date}: {val} / {dailyGoal} ml</Text>
            </View>
          ))}
        </ScrollView>

        {showConfetti && <ConfettiCannon ref={confettiRef} count={150} origin={{x:200,y:0}} fadeOut={true} />}
      </View>
    </GradientBackground>
  );
}

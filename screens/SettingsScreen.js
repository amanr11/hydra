import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SettingsScreen({ dailyGoal, setDailyGoal, darkMode, setDarkMode }) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [testTime, setTestTime] = useState(new Date());

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const sendInstantNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: { title: "Hydra Test", body: "💧 Instant notification!" },
      trigger: null, // null = send immediately
    });
  };
  
  const scheduleTestNotification = async (minutes=0) => {
    const trigger = minutes > 0 ? { seconds: minutes * 60, repeats:false } : null;
    await Notifications.scheduleNotificationAsync({
      content: { title:'Hydra Test', body:'This is a test notification 💧' },
      trigger,
    });
    Alert.alert('Test Notification Scheduled', minutes>0 ? `In ${minutes} mins` : 'Instantly');
  };

  const onTimeChange = (event, selectedTime) => {
    const current = selectedTime || testTime;
    setPickerVisible(Platform.OS === 'ios');
    setTestTime(current);
    scheduleTestNotification(Math.ceil((current.getTime() - Date.now()) / 60000));
  };

  return (
    <View style={{flex:1, padding:20, backgroundColor: darkMode? '#121212':'#fff'}}>
      <Text style={{fontSize:22, fontWeight:'bold', color: darkMode? '#fff':'#222'}}>Settings</Text>

      <View style={{marginTop:20}}>
        <Text style={{fontSize:16, color: darkMode? '#fff':'#222'}}>Daily Goal: {dailyGoal} ml</Text>
        <View style={{flexDirection:'row', marginTop:10}}>
          {[1500,2000,2500,3000].map(val=>(
            <TouchableOpacity
              key={val}
              onPress={()=>setDailyGoal(val)}
              style={{marginRight:10, backgroundColor:'#28a745', padding:10, borderRadius:8}}
            >
              <Text style={{color:'#fff'}}>{val} ml</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{marginTop:30, flexDirection:'row', alignItems:'center', justifyContent:'space-between'}}>
        <Text style={{fontSize:16, color: darkMode? '#fff':'#222'}}>Dark Mode</Text>
        <Switch value={darkMode} onValueChange={toggleDarkMode} />
      </View>

      <View style={{marginTop:30}}>
        <Text style={{fontSize:18, fontWeight:'bold', color: darkMode? '#fff':'#222'}}>Test Notifications</Text>
        <TouchableOpacity
          onPress={()=>scheduleTestNotification(0)}
          style={{backgroundColor:'#f1c40f', padding:12, borderRadius:10, marginTop:10}}
        >
          <Text style={{color:'#222', fontWeight:'bold'}}>Instant Notification</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={()=>setPickerVisible(true)}
          style={{backgroundColor:'#28a745', padding:12, borderRadius:10, marginTop:10}}
        >
          <Text style={{color:'#fff', fontWeight:'bold'}}>Schedule in Minutes</Text>
        </TouchableOpacity>
        {pickerVisible && (
          <DateTimePicker
            value={testTime}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={onTimeChange}
          />
        )}
      </View>
    </View>
  );
}

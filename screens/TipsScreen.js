import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WaveBottom from '../components/WaveBottom';
import GradientBackground from '../components/GradientBackground';
import { COLOR } from '../components/Theme';
import * as Animatable from 'react-native-animatable';

export default function TipsScreen({ theme }) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  
  const tips = [
    {
      title: 'Morning Hydration',
      tip: 'Drink a glass of water first thing in the morning to kickstart your metabolism.',
      emoji: '🌅',
      category: 'Morning'
    },
    {
      title: 'Workplace Reminder',
      tip: 'Keep a water bottle at your desk as a visual reminder to drink throughout the day.',
      emoji: '💼',
      category: 'Work'
    },
    {
      title: 'Flavor Enhancement',
      tip: 'Add slices of lemon, cucumber, or mint to make water more appealing and tasty.',
      emoji: '🍋',
      category: 'Flavor'
    },
    {
      title: 'Pre-meal Hydration',
      tip: 'Drink water 30 minutes before meals to aid digestion and prevent overeating.',
      emoji: '🍽️',
      category: 'Nutrition'
    },
    {
      title: 'Exercise Hydration',
      tip: 'Drink water before, during, and after exercise to maintain optimal performance.',
      emoji: '🏃‍♂️',
      category: 'Exercise'
    },
    {
      title: 'Temperature Matters',
      tip: 'Room temperature water is absorbed faster than ice-cold water.',
      emoji: '🌡️',
      category: 'Science'
    },
    {
      title: 'Sleep Quality',
      tip: 'Stay hydrated during the day, but reduce intake 2 hours before bed for better sleep.',
      emoji: '😴',
      category: 'Sleep'
    },
    {
      title: 'Skin Benefits',
      tip: 'Proper hydration keeps your skin glowing and helps maintain elasticity.',
      emoji: '✨',
      category: 'Beauty'
    }
  ];

  const nextTip = () => {
    setCurrentTipIndex((prevIndex) => (prevIndex + 1) % tips.length);
  };

  const prevTip = () => {
    setCurrentTipIndex((prevIndex) => (prevIndex - 1 + tips.length) % tips.length);
  };

  const currentTip = tips[currentTipIndex];

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, padding: 20 }}>
          <Animatable.Text 
            animation="fadeInDown"
            style={{ fontSize: 28, fontWeight: 'bold', color: COLOR.white, marginBottom: 20 }}
          >
            💡 Daily Tips
          </Animatable.Text>

          {/* Featured Tip Card */}
          <Animatable.View 
            key={currentTipIndex}
            animation="fadeIn"
            style={{
              backgroundColor: 'rgba(111, 231, 221, 0.15)',
              borderRadius: 20,
              padding: 25,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: COLOR.aquaMint,
              minHeight: 200,
              justifyContent: 'center',
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: 15 }}>
              <Text style={{ fontSize: 60, marginBottom: 10 }}>{currentTip.emoji}</Text>
              <View style={{
                backgroundColor: COLOR.skyBlue,
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 15,
              }}>
                <Text style={{ color: COLOR.white, fontWeight: '600', fontSize: 12 }}>
                  {currentTip.category}
                </Text>
              </View>
            </View>
            
            <Text style={{ 
              color: COLOR.white, 
              fontWeight: '700', 
              fontSize: 20, 
              textAlign: 'center',
              marginBottom: 15
            }}>
              {currentTip.title}
            </Text>
            
            <Text style={{ 
              color: COLOR.white, 
              fontSize: 16, 
              textAlign: 'center',
              lineHeight: 24,
              opacity: 0.9
            }}>
              {currentTip.tip}
            </Text>
          </Animatable.View>

          {/* Navigation */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 20 
          }}>
            <TouchableOpacity 
              onPress={prevTip}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: 15,
                borderRadius: 50,
                width: 60,
                height: 60,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: COLOR.white, fontSize: 20, fontWeight: 'bold' }}>‹</Text>
            </TouchableOpacity>

            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: COLOR.white, fontWeight: '600', fontSize: 16 }}>
                Tip {currentTipIndex + 1} of {tips.length}
              </Text>
              <View style={{ 
                flexDirection: 'row', 
                marginTop: 8,
                alignItems: 'center' 
              }}>
                {tips.map((_, index) => (
                  <View
                    key={index}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: index === currentTipIndex ? COLOR.aquaMint : 'rgba(255,255,255,0.3)',
                      marginHorizontal: 3,
                    }}
                  />
                ))}
              </View>
            </View>

            <TouchableOpacity 
              onPress={nextTip}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: 15,
                borderRadius: 50,
                width: 60,
                height: 60,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: COLOR.white, fontSize: 20, fontWeight: 'bold' }}>›</Text>
            </TouchableOpacity>
          </View>

          {/* All Tips List */}
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <Text style={{ 
              color: COLOR.white, 
              fontWeight: '600', 
              fontSize: 18, 
              marginBottom: 15 
            }}>
              All Tips
            </Text>
            {tips.map((tipItem, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setCurrentTipIndex(idx)}
                style={{
                  marginBottom: 10,
                  backgroundColor: idx === currentTipIndex 
                    ? 'rgba(111, 231, 221, 0.15)' 
                    : 'rgba(255,255,255,0.1)',
                  padding: 15,
                  borderRadius: 12,
                  borderWidth: idx === currentTipIndex ? 1 : 0,
                  borderColor: COLOR.aquaMint,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, marginRight: 10 }}>{tipItem.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      color: COLOR.white, 
                      fontWeight: '600', 
                      fontSize: 14 
                    }}>
                      {tipItem.title}
                    </Text>
                    <Text style={{ 
                      color: COLOR.white, 
                      opacity: 0.7, 
                      fontSize: 12, 
                      marginTop: 2 
                    }}>
                      {tipItem.category}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <WaveBottom />
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}
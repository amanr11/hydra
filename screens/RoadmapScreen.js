import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import GradientBackground from '../components/GradientBackground';
import { COLOR } from '../components/Theme';
import StorageService from '../services/StorageService';
import XPService from '../services/XPService';

const MAX_LEVEL = 25;

export default function RoadmapScreen({ onClose }) {
  const navigation = useNavigation();
  const [currentXP, setCurrentXP] = useState(0);

  const loadXP = useCallback(async () => {
    const xp = await StorageService.getXP();
    setCurrentXP(xp || 0);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadXP();
    }, [loadXP])
  );

  const summary = useMemo(() => XPService.getXPSummary(currentXP), [currentXP]);

  const levels = useMemo(() => {
    const arr = [];
    for (let level = 1; level <= MAX_LEVEL; level++) {
      const threshold = XPService.LEVEL_THRESHOLDS[level - 1];
      arr.push({
        level,
        threshold,
        title: XPService.getLevelTitle(level),
      });
    }
    return arr;
  }, []);

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 6 }}>
          <TouchableOpacity
            onPress={() => {
              if (onClose) {
                onClose();
                return;
              }
              navigation.navigate('Home');
            }}
            accessibilityRole="button"
            accessibilityLabel="Back to home"
          >
            <Text style={{ color: COLOR.skyBlue, fontSize: 18, fontWeight: '700' }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ color: COLOR.white, fontSize: 24, fontWeight: '800', marginLeft: 14 }}>Level Roadmap</Text>
        </View>

        <View
          style={{
            marginTop: 16,
            marginHorizontal: 20,
            padding: 16,
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
          }}
        >
          <Text style={{ color: COLOR.amber, fontWeight: '800' }}>LV {summary.level}</Text>
          <Text style={{ color: COLOR.white, marginTop: 4 }}>{summary.title}</Text>
          <Text style={{ color: COLOR.aquaMint, marginTop: 8, fontWeight: '700' }}>{summary.currentXP} XP total</Text>
          <Text style={{ color: COLOR.white, opacity: 0.8, marginTop: 4 }}>
            {summary.isMaxLevel ? 'You reached max level 🎉' : `${summary.xpToNext} XP to reach Level ${summary.level + 1}`}
          </Text>
          {!summary.isMaxLevel && (
            <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden', marginTop: 10 }}>
              <View style={{ width: `${summary.progress}%`, height: '100%', backgroundColor: COLOR.amber }} />
            </View>
          )}
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          {levels.map((item, index) => {
            const reached = summary.level >= item.level;
            const current = summary.level === item.level;
            return (
              <View key={item.level} style={{ marginBottom: 12 }}>
                {index > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      left: 22,
                      top: -14,
                      width: 3,
                      height: 14,
                      backgroundColor: reached ? COLOR.aquaMint : 'rgba(255,255,255,0.2)',
                      borderRadius: 2,
                    }}
                  />
                )}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    backgroundColor: current ? 'rgba(247, 184, 1, 0.16)' : reached ? 'rgba(111,231,221,0.16)' : 'rgba(255,255,255,0.08)',
                    borderColor: current ? COLOR.amber : reached ? COLOR.aquaMint : 'rgba(255,255,255,0.12)',
                    borderWidth: 1.5,
                    borderRadius: 16,
                    padding: 14,
                    shadowColor: current ? COLOR.amber : reached ? COLOR.aquaMint : '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: current || reached ? 0.3 : 0.15,
                    shadowRadius: 8,
                    elevation: current || reached ? 5 : 2,
                  }}
                  accessible
                  accessibilityLabel={`${current ? 'Current Level' : reached ? 'Unlocked Level' : 'Locked Level'} ${item.level}. ${item.title}. Unlocks at ${item.threshold} XP.`}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      marginTop: 3,
                      marginRight: 12,
                      backgroundColor: current ? COLOR.amber : reached ? COLOR.aquaMint : 'rgba(255,255,255,0.2)',
                      borderWidth: 2,
                      borderColor: current || reached ? COLOR.white : 'rgba(255,255,255,0.5)',
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: reached ? COLOR.aquaMint : COLOR.white, fontWeight: '900', letterSpacing: 0.4 }}>
                      {current ? '🔥 YOU ARE HERE • ' : reached ? '✅ UNLOCKED • ' : '🔒 LOCKED • '}Level {item.level}
                    </Text>
                    <Text style={{ color: COLOR.white, marginTop: 2, opacity: 0.95 }}>{item.title}</Text>
                    <Text style={{ color: COLOR.white, marginTop: 4, opacity: 0.75 }}>Unlocks at {item.threshold} XP</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

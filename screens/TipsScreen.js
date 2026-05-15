import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../components/GradientBackground';
import { COLOR } from '../components/Theme';

const TIPS = [
  { title: "Morning Kickstart", body: "Drinking 500ml of water right after waking up fires up your metabolism.", icon: "sunny", color: COLOR.amber },
  { title: "Cognitive Focus", body: "Brain tissue is 75% water. Stay hydrated to avoid brain fog and fatigue.", icon: "brain", color: COLOR.skyBlue },
  { title: "Workout Recovery", body: "Sip water every 15 minutes during exercise to prevent muscle cramps.", icon: "fitness", color: COLOR.aquaMint }
];

export default function TipsScreen() {
  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={styles.title}>Tips & Insights</Text>
          
          <View style={styles.hero}>
            <Ionicons name="water" size={40} color={COLOR.skyBlue} />
            <Text style={styles.heroTitle}>Did you know?</Text>
            <Text style={styles.heroBody}>By the time you feel thirsty, you are already dehydrated. Small sips throughout the day are best!</Text>
          </View>

          {TIPS.map((tip, i) => (
            <View key={i} style={styles.card}>
              <View style={[styles.iconBox, { backgroundColor: tip.color + '20' }]}>
                <Ionicons name={tip.icon} size={24} color={tip.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.cardTitle}>{tip.title}</Text>
                <Text style={styles.cardBody}>{tip.body}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 32, fontWeight: '900', color: 'white', marginBottom: 20 },
  hero: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 25, borderRadius: 25, marginBottom: 25 },
  heroTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  heroBody: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 5, lineHeight: 20 },
  card: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', padding: 18, borderRadius: 20, marginBottom: 15, alignItems: 'center' },
  iconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { color: 'white', fontSize: 16, fontWeight: '700' },
  cardBody: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 2 }
});
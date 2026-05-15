import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import GradientBackground from '../components/GradientBackground';
import { COLOR } from '../components/Theme';
import StorageService from '../services/StorageService';

export default function HistoryScreen({ dailyGoal }) {
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const data = await StorageService.getHistory();
      
      // FIX: Ensure data exists and map safely
      if (data) {
        const formattedHistory = Object.keys(data).map(date => {
          const dayEntry = data[date];
          let total = 0;

          // Backward-compat parsing:
          // - number/string: current format from useHydration.saveData (date -> total ml)
          // - array: legacy format where date stored full intake entries
          // - object.total: migration-safe fallback for partially normalized entries
          if (Array.isArray(dayEntry)) {
            total = dayEntry.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
          } else if (typeof dayEntry === 'number' || typeof dayEntry === 'string') {
            total = Number(dayEntry) || 0;
          } else if (dayEntry && typeof dayEntry === 'object' && Number.isFinite(Number(dayEntry.total))) {
            total = Number(dayEntry.total);
          }

          return { date, total };
        }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort newest first

        setHistory(formattedHistory);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error("History Load Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const avgIntake = history.length 
    ? Math.round(history.reduce((a, b) => a + b.total, 0) / history.length) 
    : 0;

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
        >
          <Text style={styles.title}>History</Text>

          {/* INSIGHTS CARDS */}
          <View style={styles.statsRow}>
            <View style={styles.miniStat}>
              <Text style={styles.statVal}>{history.length}</Text>
              <Text style={styles.statLab}>Days Active</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={styles.statVal}>{avgIntake}ml</Text>
              <Text style={styles.statLab}>Daily Avg</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Daily Logs</Text>
          
          {history.length === 0 && !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hydration logs found yet.</Text>
            </View>
          ) : (
            history.map((day, i) => (
              <Animatable.View 
                key={day.date} 
                animation="fadeInUp" 
                delay={i * 50} 
                style={styles.logCard}
              >
                <View>
                  <Text style={styles.logDate}>
                    {new Date(day.date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </Text>
                  <Text style={[
                    styles.logStatus, 
                    { color: day.total >= dailyGoal ? COLOR.aquaMint : COLOR.amber }
                  ]}>
                    {day.total >= dailyGoal ? '★ Goal Achieved' : '💧 Keep it up'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.logAmount}>{day.total}ml</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[
                      styles.progressBarFill, 
                      { width: `${Math.min(100, (day.total / dailyGoal) * 100)}%` }
                    ]} />
                  </View>
                </View>
              </Animatable.View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 34, fontWeight: '900', color: 'white', marginBottom: 25 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  miniStat: { backgroundColor: 'rgba(255,255,255,0.08)', flex: 0.48, padding: 20, borderRadius: 24, alignItems: 'center' },
  statVal: { color: COLOR.skyBlue, fontSize: 24, fontWeight: '900' },
  statLab: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4, fontWeight: '600' },
  sectionLabel: { color: 'white', opacity: 0.6, fontSize: 14, fontWeight: '800', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
  logCard: { 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    padding: 20, 
    borderRadius: 22, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  logDate: { color: 'white', fontSize: 17, fontWeight: '700' },
  logStatus: { fontSize: 12, marginTop: 4, fontWeight: 'bold' },
  logAmount: { color: 'white', fontSize: 19, fontWeight: '800' },
  progressBarBg: { width: 60, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLOR.skyBlue },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }
});

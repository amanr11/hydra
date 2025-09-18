import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import WaveBottom from '../components/WaveBottom';
import GradientBackground from '../components/GradientBackground';
import { COLOR } from '../components/Theme';
import * as Animatable from 'react-native-animatable';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen({ dailyGoal, theme }) {
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [averageIntake, setAverageIntake] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalHydrated, setTotalHydrated] = useState(0);

  useEffect(() => {
    loadStatsData();
  }, []);

  const loadStatsData = async () => {
    try {
      const history = await AsyncStorage.getItem('history');
      if (!history) return;
      
      const historyData = JSON.parse(history);
      const entries = Object.entries(historyData).sort((a, b) => new Date(a[0]) - new Date(b[0]));
      
      // Calculate weekly data (last 7 days)
      const last7Days = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().slice(0, 10);
        const value = historyData[dateKey] || 0;
        last7Days.push({
          date: date.toLocaleDateString('en', { weekday: 'short' }),
          value: value
        });
      }
      setWeeklyData(last7Days);

      // Calculate monthly average
      const last30Days = entries.slice(-30);
      const monthlyAverage = last30Days.reduce((sum, [_, value]) => sum + value, 0) / Math.max(last30Days.length, 1);
      setAverageIntake(Math.round(monthlyAverage));

      // Calculate best streak
      let currentStreak = 0;
      let maxStreak = 0;
      entries.forEach(([_, value]) => {
        if (value >= dailyGoal) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      });
      setBestStreak(maxStreak);

      // Total hydrated
      const total = entries.reduce((sum, [_, value]) => sum + value, 0);
      setTotalHydrated(total);

    } catch (error) {
      console.log('Error loading stats:', error);
    }
  };

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'rgba(58, 190, 255, 0.1)',
    backgroundGradientTo: 'rgba(111, 231, 221, 0.1)',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(58, 190, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: COLOR.aquaMint,
    },
  };

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView 
          style={{ flex: 1, padding: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <Animatable.Text 
            animation="fadeInDown"
            style={{ fontSize: 28, fontWeight: 'bold', color: COLOR.white, marginBottom: 20 }}
          >
            📊 Your Stats
          </Animatable.Text>

          {/* Key Metrics Cards */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 }}>
            <Animatable.View 
              animation="fadeInLeft" 
              delay={200}
              style={statsCardStyle}
            >
              <Text style={statsEmojiStyle}>🏆</Text>
              <Text style={statsValueStyle}>{bestStreak}</Text>
              <Text style={statsLabelStyle}>Best Streak</Text>
            </Animatable.View>

            <Animatable.View 
              animation="fadeInRight" 
              delay={300}
              style={statsCardStyle}
            >
              <Text style={statsEmojiStyle}>📈</Text>
              <Text style={statsValueStyle}>{averageIntake}</Text>
              <Text style={statsLabelStyle}>Daily Avg (ml)</Text>
            </Animatable.View>

            <Animatable.View 
              animation="fadeInLeft" 
              delay={400}
              style={[statsCardStyle, { width: '100%', marginTop: 10 }]}
            >
              <Text style={statsEmojiStyle}>🌊</Text>
              <Text style={statsValueStyle}>{(totalHydrated / 1000).toFixed(1)}L</Text>
              <Text style={statsLabelStyle}>Total Hydrated</Text>
            </Animatable.View>
          </View>

          {/* Weekly Chart */}
          <Animatable.View animation="fadeInUp" delay={600}>
            <Text style={{ fontSize: 20, fontWeight: '600', color: COLOR.white, marginBottom: 15 }}>
              📅 This Week
            </Text>
            {weeklyData.length > 0 && (
              <LineChart
                data={{
                  labels: weeklyData.map(d => d.date),
                  datasets: [{
                    data: weeklyData.map(d => d.value),
                    color: (opacity = 1) => `rgba(58, 190, 255, ${opacity})`,
                    strokeWidth: 3,
                  }],
                }}
                width={screenWidth - 40}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={{ borderRadius: 16, marginBottom: 25 }}
              />
            )}
          </Animatable.View>

          {/* Hydration Pattern Analysis */}
          <Animatable.View animation="fadeInUp" delay={800}>
            <Text style={{ fontSize: 20, fontWeight: '600', color: COLOR.white, marginBottom: 15 }}>
              🔍 Insights
            </Text>
            <View style={insightCardStyle}>
              <Text style={insightTextStyle}>
                {averageIntake >= dailyGoal 
                  ? "🎉 Excellent! You're consistently meeting your hydration goals."
                  : averageIntake >= dailyGoal * 0.8
                  ? "👍 Good progress! You're close to your daily targets."
                  : "💪 Keep pushing! Small improvements lead to big changes."}
              </Text>
            </View>
            
            <View style={insightCardStyle}>
              <Text style={insightTextStyle}>
                {bestStreak >= 7 
                  ? `🔥 Amazing ${bestStreak}-day streak! You're building a strong hydration habit.`
                  : bestStreak >= 3
                  ? `⚡ Your ${bestStreak}-day streak shows great potential. Keep it up!`
                  : "🌱 Every journey starts with a single step. Start your streak today!"}
              </Text>
            </View>
          </Animatable.View>

        </ScrollView>
        <WaveBottom />
      </SafeAreaView>
    </GradientBackground>
  );
}

const statsCardStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: 15,
  padding: 20,
  alignItems: 'center',
  width: '48%',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.2)',
};

const statsEmojiStyle = {
  fontSize: 30,
  marginBottom: 10,
};

const statsValueStyle = {
  fontSize: 24,
  fontWeight: 'bold',
  color: COLOR.white,
  marginBottom: 5,
};

const statsLabelStyle = {
  fontSize: 12,
  color: COLOR.white,
  opacity: 0.8,
  textAlign: 'center',
};

const insightCardStyle = {
  backgroundColor: 'rgba(111, 231, 221, 0.15)',
  borderRadius: 12,
  padding: 15,
  marginBottom: 10,
  borderLeftWidth: 4,
  borderLeftColor: COLOR.aquaMint,
};

const insightTextStyle = {
  color: COLOR.white,
  fontSize: 14,
  lineHeight: 20,
};

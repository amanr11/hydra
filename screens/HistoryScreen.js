import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import { SafeAreaView } from 'react-native-safe-area-context';
import WaveBottom from '../components/WaveBottom';
import GradientBackground from '../components/GradientBackground';
import { LoadingOverlay, SkeletonLoader } from '../components/LoadingIndicator';
import { COLOR } from '../components/Theme';
import StorageService from '../services/StorageService';
import * as Animatable from 'react-native-animatable';

export default function HistoryScreen({ dailyGoal, theme }) {
  const [history, setHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // all, week, month

  useEffect(() => { 
    loadHistory(); 
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const savedHistory = await StorageService.getHistory();
      setHistory(savedHistory);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  // Process and filter history data
  const historyData = useMemo(() => {
    const entries = Object.entries(history)
      .map(([date, total]) => ({
        date,
        total: parseInt(total) || 0,
        percentage: Math.round((parseInt(total) || 0) / dailyGoal * 100),
        dateObj: new Date(date)
      }))
      .sort((a, b) => b.dateObj - a.dateObj); // Most recent first

    // Filter based on selected period
    const now = new Date();
    const filteredEntries = entries.filter(entry => {
      const diffTime = now - entry.dateObj;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      switch (selectedPeriod) {
        case 'week':
          return diffDays <= 7;
        case 'month':
          return diffDays <= 30;
        default:
          return true;
      }
    });

    return filteredEntries;
  }, [history, dailyGoal, selectedPeriod]);

  const getProgressEmoji = (percentage) => {
    if (percentage >= 100) return '🏆';
    if (percentage >= 80) return '💪';
    if (percentage >= 60) return '👍';
    if (percentage >= 40) return '⚡';
    return '💧';
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return COLOR.amber;
    if (percentage >= 80) return COLOR.aquaMint;
    if (percentage >= 60) return COLOR.skyBlue;
    if (percentage >= 40) return COLOR.white;
    return COLOR.coral;
  };

  const formatDate = (dateObj) => {
    const now = new Date();
    const diffTime = now - dateObj;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays === 0) return 'Today';
    if (diffDays <= 7) return `${diffDays} days ago`;
    
    return dateObj.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const renderHistoryItem = ({ item, index }) => (
    <Animatable.View
      animation="fadeInUp"
      duration={600}
      delay={index * 50}
      style={styles.historyItem}
    >
      <View style={styles.historyHeader}>
        <View>
          <Text style={styles.historyDate}>{formatDate(item.dateObj)}</Text>
          <Text style={styles.historyFullDate}>
            {item.dateObj.toLocaleDateString([], { 
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>
        <View style={styles.historyProgress}>
          <Text style={styles.progressEmoji}>
            {getProgressEmoji(item.percentage)}
          </Text>
          <Text style={[styles.progressPercentage, { color: getProgressColor(item.percentage) }]}>
            {item.percentage}%
          </Text>
        </View>
      </View>
      
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: `${Math.min(item.percentage, 100)}%`,
                backgroundColor: getProgressColor(item.percentage)
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {item.total}ml / {dailyGoal}ml
        </Text>
      </View>
    </Animatable.View>
  );

  const renderPeriodFilter = () => (
    <View style={styles.filterContainer}>
      {[
        { key: 'all', label: 'All Time' },
        { key: 'month', label: 'This Month' },
        { key: 'week', label: 'This Week' }
      ].map(period => (
        <TouchableOpacity
          key={period.key}
          onPress={() => setSelectedPeriod(period.key)}
          style={[
            styles.filterButton,
            selectedPeriod === period.key && styles.filterButtonActive
          ]}
        >
          <Text style={[
            styles.filterButtonText,
            selectedPeriod === period.key && styles.filterButtonTextActive
          ]}>
            {period.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStats = () => {
    const totalDays = historyData.length;
    const completedDays = historyData.filter(item => item.percentage >= 100).length;
    const avgConsumption = totalDays > 0 
      ? Math.round(historyData.reduce((sum, item) => sum + item.total, 0) / totalDays)
      : 0;
    
    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>📊 Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedDays}</Text>
            <Text style={styles.statLabel}>Goals Met</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalDays}</Text>
            <Text style={styles.statLabel}>Total Days</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{avgConsumption}ml</Text>
            <Text style={styles.statLabel}>Daily Avg</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <Animatable.View 
      animation="fadeIn"
      style={styles.emptyContainer}
    >
      <Text style={styles.emptyEmoji}>💧</Text>
      <Text style={styles.emptyTitle}>No history yet!</Text>
      <Text style={styles.emptySubtitle}>
        Start tracking your water intake to see your progress here.
      </Text>
    </Animatable.View>
  );

  const ListHeaderComponent = () => (
    <>
      <Animatable.Text 
        animation="fadeInDown"
        style={styles.title}
      >
        📜 History
      </Animatable.Text>
      
      {historyData.length > 0 && renderStats()}
      {renderPeriodFilter()}
    </>
  );

  if (loading) {
    return (
      <GradientBackground>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1, padding: 20 }}>
            <Text style={styles.title}>📜 History</Text>
            {Array.from({ length: 5 }).map((_, index) => (
              <View key={index} style={styles.skeletonItem}>
                <SkeletonLoader width="30%" height={20} style={{ marginBottom: 8 }} />
                <SkeletonLoader width="60%" height={16} style={{ marginBottom: 12 }} />
                <SkeletonLoader width="100%" height={8} />
              </View>
            ))}
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, padding: 20 }}>
          <FlatList
            data={historyData}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.date}
            ListHeaderComponent={ListHeaderComponent}
            ListEmptyComponent={renderEmptyState}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
          <WaveBottom />
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

// Styles
const styles = {
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLOR.white,
    marginBottom: 20,
  },
  statsContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLOR.aquaMint,
    marginBottom: 15,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLOR.skyBlue,
  },
  statLabel: {
    fontSize: 12,
    color: COLOR.white,
    opacity: 0.8,
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLOR.skyBlue,
  },
  filterButtonText: {
    color: COLOR.white,
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.7,
  },
  filterButtonTextActive: {
    opacity: 1,
    fontWeight: '600',
  },
  historyItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: COLOR.white,
  },
  historyFullDate: {
    fontSize: 12,
    color: COLOR.white,
    opacity: 0.7,
    marginTop: 2,
  },
  historyProgress: {
    alignItems: 'center',
  },
  progressEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: COLOR.white,
    opacity: 0.8,
    marginTop: 6,
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    marginTop: 20,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLOR.white,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLOR.white,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 20,
  },
  skeletonItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
  },
};

// PropTypes
HistoryScreen.propTypes = {
  dailyGoal: PropTypes.number.isRequired,
  theme: PropTypes.object.isRequired,
};

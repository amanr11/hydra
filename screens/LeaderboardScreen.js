import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WaveBottom from '../components/WaveBottom';
import GradientBackground from '../components/GradientBackground';
import { COLOR } from '../components/Theme';
import * as Animatable from 'react-native-animatable';
import { collection, query, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';

export default function LeaderboardScreen({ theme, userId }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      if (!isFirebaseConfigured || !db) {
        setFetchError('Leaderboard requires Firebase setup. Coming soon!');
        setIsLoading(false);
        return;
      }
      const q = query(collection(db, `artifacts/${appId}/public/data/leaderboard`));
      const querySnapshot = await getDocs(q);
      const fetchedLeaderboard = [];
      querySnapshot.forEach((doc) => {
        fetchedLeaderboard.push(doc.data());
      });

      const sortedLeaderboard = fetchedLeaderboard.sort((a, b) => b.points - a.points);
      setLeaderboard(sortedLeaderboard);
      setIsLoading(false);
    } catch (e) {
      console.error("Error fetching leaderboard: ", e);
      setFetchError('Unable to load leaderboard right now. Please try again later.');
      setIsLoading(false);
    }
  };

  const getUserRank = () => {
    const userEntry = leaderboard.find(entry => entry.userId === userId);
    if (!userEntry) return null;
    const rank = leaderboard.indexOf(userEntry) + 1;
    return rank;
  };

  const renderRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const renderEmptyState = () => {
    const title = fetchError || 'No rankings yet!';
    const subtitle = fetchError
      ? 'Global rankings will be available soon. Keep tracking your hydration!'
      : 'Be the first to appear on the leaderboard by logging your hydration daily!';

    return (
      <Animatable.View animation="fadeIn" style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🏆</Text>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySubtitle}>{subtitle}</Text>
      </Animatable.View>
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={{ flex: 1, padding: 20 }}>
          <Text style={styles.header}>🌍 Global Leaderboard</Text>
          {!fetchError && (
            <Animatable.View animation="fadeInUp" duration={800} style={styles.leaderboardCard}>
              <Text style={styles.userRankText}>Your Rank: {getUserRank() || 'N/A'}</Text>
            </Animatable.View>
          )}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLOR.aquaMint} />
            </View>
          ) : leaderboard.length === 0 ? (
            renderEmptyState()
          ) : (
            <ScrollView style={styles.listContainer}>
              {leaderboard.map((user, index) => (
                <Animatable.View
                  key={index}
                  animation="fadeInUp"
                  duration={800}
                  delay={index * 50}
                  style={[
                    styles.leaderboardItem,
                    user.userId === userId && styles.currentUserItem,
                  ]}
                >
                  <View style={styles.rankContainer}>
                    <Text style={styles.rankText}>{renderRankIcon(index + 1)}</Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                  </View>
                  <View style={styles.pointsContainer}>
                    <Text style={styles.pointsText}>{user.points} pts</Text>
                  </View>
                </Animatable.View>
              ))}
            </ScrollView>
          )}
        </View>
        <WaveBottom />
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLOR.white,
    fontFamily: 'Poppins-Bold',
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  leaderboardCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  userRankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLOR.aquaMint,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flex: 1,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  currentUserItem: {
    backgroundColor: 'rgba(58,190,255,0.2)',
    borderColor: COLOR.skyBlue,
    borderWidth: 2,
  },
  rankContainer: {
    width: 30,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLOR.white,
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLOR.white,
  },
  pointsContainer: {
    backgroundColor: 'rgba(111, 231, 221, 0.2)',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(111, 231, 221, 0.4)',
  },
  pointsText: {
    color: COLOR.aquaMint,
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLOR.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLOR.white,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 20,
  },
});

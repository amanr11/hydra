// components/XPProgress.js - Experience points and level progress component
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import PropTypes from 'prop-types';
import * as Animatable from 'react-native-animatable';
import { COLOR } from './Theme';
import XPService from '../services/XPService';

const XPProgress = ({ userXP, style, onLevelUp }) => {
  const [xpData, setXpData] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    updateXPData();
  }, [userXP]);

  const updateXPData = () => {
    const data = XPService.getXPSummary(userXP);
    setXpData(data);
  };

  const handleXPTap = () => {
    if (!xpData) return;
    
    Alert.alert(
      `${xpData.title}`,
      `Level ${xpData.level} • ${xpData.currentXP} XP\n\n` +
      (xpData.isMaxLevel 
        ? 'You\'ve reached the maximum level! 🏆' 
        : `${xpData.xpToNext} XP needed for next level\n${xpData.progress}% progress to Level ${xpData.level + 1}`),
      [{ text: 'OK' }]
    );
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  if (!xpData) {
    return null;
  }

  const progressWidth = `${xpData.progress}%`;

  return (
    <Animatable.View 
      animation="fadeInUp" 
      delay={400}
      style={[styles.container, style]}
    >
      <TouchableOpacity 
        onPress={handleXPTap}
        style={styles.header}
        accessibilityRole="button"
        accessibilityLabel={`Level ${xpData.level}, ${xpData.currentXP} experience points`}
      >
        <View style={styles.levelContainer}>
          <Text style={styles.levelText}>LV {xpData.level}</Text>
          <Text style={styles.titleText}>{xpData.title}</Text>
        </View>
        
        <View style={styles.xpContainer}>
          <Text style={styles.xpText}>{xpData.currentXP} XP</Text>
          {!xpData.isMaxLevel && (
            <Text style={styles.nextLevelText}>
              +{xpData.xpToNext} to LV {xpData.level + 1}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {!xpData.isMaxLevel && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animatable.View 
              animation="slideInLeft"
              duration={1000}
              style={[styles.progressFill, { width: progressWidth }]}
            />
          </View>
          <Text style={styles.progressText}>{xpData.progress}%</Text>
        </View>
      )}

      {xpData.isMaxLevel && (
        <View style={styles.maxLevelContainer}>
          <Text style={styles.maxLevelText}>🏆 MAX LEVEL REACHED! 🏆</Text>
          <Text style={styles.maxLevelSubtext}>You're a true Hydration Master!</Text>
        </View>
      )}

      <TouchableOpacity 
        onPress={toggleDetails}
        style={styles.detailsToggle}
      >
        <Text style={styles.detailsToggleText}>
          {showDetails ? '▼ Less Info' : '▶ More Info'}
        </Text>
      </TouchableOpacity>

      {showDetails && (
        <Animatable.View 
          animation="slideInDown"
          duration={300}
          style={styles.detailsContainer}
        >
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>🎯 Current Level</Text>
            <Text style={styles.detailValue}>Level {xpData.level}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>⭐ Total XP</Text>
            <Text style={styles.detailValue}>{xpData.currentXP} points</Text>
          </View>
          
          {!xpData.isMaxLevel && (
            <>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>🚀 Next Level</Text>
                <Text style={styles.detailValue}>Level {xpData.level + 1}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>📈 XP Needed</Text>
                <Text style={styles.detailValue}>{xpData.xpToNext} more</Text>
              </View>
            </>
          )}
          
          <View style={styles.xpGuideContainer}>
            <Text style={styles.xpGuideTitle}>💡 How to Earn XP:</Text>
            <Text style={styles.xpGuideItem}>• Complete daily goals: 50 XP</Text>
            <Text style={styles.xpGuideItem}>• Maintain streaks: up to 300 XP</Text>
            <Text style={styles.xpGuideItem}>• First drink of day: 10 XP</Text>
            <Text style={styles.xpGuideItem}>• Drink water: 5 XP per drink</Text>
            <Text style={styles.xpGuideItem}>• Use voice logging: 5 XP</Text>
          </View>
        </Animatable.View>
      )}
    </Animatable.View>
  );
};

const styles = {
  container: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    margin: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  levelContainer: {
    flex: 1,
  },
  levelText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLOR.amber,
  },
  titleText: {
    fontSize: 14,
    color: COLOR.white,
    opacity: 0.9,
    marginTop: 2,
  },
  xpContainer: {
    alignItems: 'flex-end',
  },
  xpText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLOR.aquaMint,
  },
  nextLevelText: {
    fontSize: 12,
    color: COLOR.white,
    opacity: 0.7,
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLOR.amber,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: COLOR.white,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },
  maxLevelContainer: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(247, 184, 1, 0.1)',
    borderRadius: 10,
    marginBottom: 10,
  },
  maxLevelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLOR.amber,
    textAlign: 'center',
  },
  maxLevelSubtext: {
    fontSize: 12,
    color: COLOR.white,
    opacity: 0.8,
    marginTop: 4,
    textAlign: 'center',
  },
  detailsToggle: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailsToggleText: {
    fontSize: 12,
    color: COLOR.aquaMint,
    fontWeight: '500',
  },
  detailsContainer: {
    marginTop: 10,
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: COLOR.white,
    opacity: 0.8,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLOR.white,
  },
  xpGuideContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  xpGuideTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLOR.aquaMint,
    marginBottom: 8,
  },
  xpGuideItem: {
    fontSize: 12,
    color: COLOR.white,
    opacity: 0.8,
    marginBottom: 4,
    paddingLeft: 10,
  },
};

XPProgress.propTypes = {
  userXP: PropTypes.number.isRequired,
  style: PropTypes.object,
  onLevelUp: PropTypes.func,
};

export default XPProgress;
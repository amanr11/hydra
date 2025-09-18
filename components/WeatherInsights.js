// components/WeatherInsights.js - Weather-based hydration advice component
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import * as Animatable from 'react-native-animatable';
import { COLOR } from './Theme';
import WeatherService from '../services/WeatherService';
import { LoadingDots } from './LoadingIndicator';

const WeatherInsights = ({ userProfile, theme, style }) => {
  const [weather, setWeather] = useState(null);
  const [hydrationAdvice, setHydrationAdvice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get location permission and current weather
      const locationPermission = await WeatherService.getLocationPermission();
      
      let weatherData;
      if (locationPermission.granted) {
        weatherData = await WeatherService.getCurrentWeather(
          locationPermission.coords.latitude,
          locationPermission.coords.longitude
        );
      } else {
        // Fallback to mock weather data
        weatherData = WeatherService.getMockWeather();
      }
      
      const advice = WeatherService.getHydrationAdvice(weatherData, userProfile);
      
      setWeather(weatherData);
      setHydrationAdvice(advice);
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError('Unable to fetch weather data');
      
      // Fallback to mock data
      const mockWeather = WeatherService.getMockWeather();
      const mockAdvice = WeatherService.getHydrationAdvice(mockWeather, userProfile);
      setWeather(mockWeather);
      setHydrationAdvice(mockAdvice);
    } finally {
      setLoading(false);
    }
  };

  const refreshWeather = () => {
    fetchWeatherData();
  };

  if (loading && !weather) {
    return (
      <Animatable.View 
        animation="fadeIn"
        style={[styles.container, style]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>🌤️ Weather Insights</Text>
          <LoadingDots size={6} color={COLOR.aquaMint} />
        </View>
        <Text style={styles.loadingText}>Getting weather data...</Text>
      </Animatable.View>
    );
  }

  if (error && !weather) {
    return (
      <Animatable.View 
        animation="fadeIn"
        style={[styles.container, styles.errorContainer, style]}
      >
        <Text style={styles.title}>🌤️ Weather Insights</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={refreshWeather} style={styles.retryButton}>
          <Text style={styles.retryText}>🔄 Retry</Text>
        </TouchableOpacity>
      </Animatable.View>
    );
  }

  const weatherEmoji = WeatherService.getWeatherEmoji(weather?.condition);

  return (
    <Animatable.View 
      animation="fadeInUp" 
      delay={600}
      style={[styles.container, style]}
    >
      <TouchableOpacity 
        onPress={() => setExpanded(!expanded)}
        style={styles.header}
        accessibilityRole="button"
        accessibilityLabel="Tap to expand weather insights"
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>{weatherEmoji} Weather Insights</Text>
          {loading && <LoadingDots size={4} color={COLOR.aquaMint} count={3} />}
          {!loading && (
            <TouchableOpacity onPress={refreshWeather} style={styles.refreshButton}>
              <Text style={styles.refreshText}>🔄</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {weather && (
        <View style={styles.weatherSummary}>
          <Text style={styles.weatherText}>
            {weather.temperature}°C • {weather.condition} • {weather.location}
          </Text>
        </View>
      )}

      {expanded && hydrationAdvice && (
        <Animatable.View 
          animation="slideInDown"
          duration={300}
          style={styles.expandedContent}
        >
          <View style={styles.adviceContainer}>
            <Text style={styles.adviceText}>{hydrationAdvice.advice}</Text>
          </View>

          {hydrationAdvice.adjustmentFactor > 0 && (
            <View style={styles.recommendationContainer}>
              <Text style={styles.recommendationTitle}>📊 Recommended Today</Text>
              <Text style={styles.recommendationText}>
                {hydrationAdvice.recommendedIntake}ml 
                <Text style={styles.adjustmentText}>
                  {' '}(+{hydrationAdvice.adjustmentFactor}% due to weather)
                </Text>
              </Text>
            </View>
          )}

          <View style={styles.weatherDetails}>
            <View style={styles.weatherItem}>
              <Text style={styles.weatherLabel}>🌡️ Temperature</Text>
              <Text style={styles.weatherValue}>{weather.temperature}°C</Text>
            </View>
            <View style={styles.weatherItem}>
              <Text style={styles.weatherLabel}>💧 Humidity</Text>
              <Text style={styles.weatherValue}>{weather.humidity}%</Text>
            </View>
            <View style={styles.weatherItem}>
              <Text style={styles.weatherLabel}>🌤️ Condition</Text>
              <Text style={styles.weatherValue}>{weather.condition}</Text>
            </View>
          </View>

          <TouchableOpacity 
            onPress={refreshWeather} 
            style={styles.updateButton}
            disabled={loading}
          >
            <Text style={styles.updateButtonText}>
              {loading ? 'Updating...' : '🔄 Update Weather'}
            </Text>
          </TouchableOpacity>
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  errorContainer: {
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLOR.aquaMint,
    marginRight: 10,
  },
  expandIcon: {
    fontSize: 14,
    color: COLOR.white,
    opacity: 0.7,
  },
  refreshButton: {
    marginLeft: 10,
    padding: 5,
  },
  refreshText: {
    fontSize: 16,
  },
  weatherSummary: {
    paddingHorizontal: 15,
    paddingBottom: expanded ? 10 : 15,
  },
  weatherText: {
    fontSize: 14,
    color: COLOR.white,
    opacity: 0.8,
  },
  expandedContent: {
    padding: 15,
    paddingTop: 0,
  },
  adviceContainer: {
    backgroundColor: 'rgba(111, 231, 221, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: COLOR.aquaMint,
  },
  adviceText: {
    fontSize: 15,
    color: COLOR.white,
    lineHeight: 22,
  },
  recommendationContainer: {
    backgroundColor: 'rgba(247, 184, 1, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: COLOR.amber,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLOR.amber,
    marginBottom: 5,
  },
  recommendationText: {
    fontSize: 16,
    color: COLOR.white,
    fontWeight: '600',
  },
  adjustmentText: {
    fontSize: 12,
    opacity: 0.8,
    fontWeight: 'normal',
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  weatherItem: {
    alignItems: 'center',
  },
  weatherLabel: {
    fontSize: 12,
    color: COLOR.white,
    opacity: 0.8,
    marginBottom: 4,
  },
  weatherValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLOR.white,
  },
  updateButton: {
    backgroundColor: COLOR.skyBlue,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  updateButtonText: {
    color: COLOR.white,
    fontWeight: '600',
    fontSize: 14,
  },
  loadingText: {
    fontSize: 14,
    color: COLOR.white,
    opacity: 0.8,
    textAlign: 'center',
    padding: 15,
  },
  errorText: {
    fontSize: 14,
    color: COLOR.coral,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: COLOR.coral,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  retryText: {
    color: COLOR.white,
    fontWeight: '600',
  },
};

WeatherInsights.propTypes = {
  userProfile: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  style: PropTypes.object,
};

export default WeatherInsights;
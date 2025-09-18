// services/WeatherService.js - Weather API integration for hydration advice
class WeatherService {
  static async getCurrentWeather(latitude, longitude) {
    try {
      // Replace with your OpenWeather API key
      const API_KEY = 'YOUR_OPENWEATHER_API_KEY';
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        return {
          temperature: Math.round(data.main.temp),
          humidity: data.main.humidity,
          condition: data.weather[0].main.toLowerCase(),
          description: data.weather[0].description,
          feelsLike: Math.round(data.main.feels_like),
          location: data.name
        };
      } else {
        throw new Error('Weather data not available');
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      return this.getMockWeather();
    }
  }

  static getMockWeather() {
    // Fallback mock weather data for development/demo
    const conditions = ['sunny', 'cloudy', 'rainy', 'hot', 'cold'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    
    return {
      temperature: Math.floor(Math.random() * 30) + 10, // 10-40°C
      humidity: Math.floor(Math.random() * 40) + 30, // 30-70%
      condition: randomCondition,
      description: `${randomCondition} weather`,
      feelsLike: Math.floor(Math.random() * 30) + 10,
      location: 'Your Location'
    };
  }

  static getHydrationAdvice(weather, userProfile) {
    const { temperature, humidity, condition } = weather;
    const { weight, activityLevel } = userProfile;
    
    let baseRecommendation = weight * 35; // 35ml per kg
    let advice = '';
    let multiplier = 1;

    // Temperature-based adjustments
    if (temperature > 30) {
      multiplier += 0.3;
      advice = '🌡️ It\'s quite hot today! Increase your water intake to stay cool and hydrated.';
    } else if (temperature > 25) {
      multiplier += 0.2;
      advice = '☀️ Warm weather today. Make sure to drink extra water, especially if you\'re active.';
    } else if (temperature < 10) {
      multiplier += 0.1;
      advice = '❄️ Cold weather can be dehydrating too. Don\'t forget to stay hydrated!';
    } else {
      advice = '🌤️ Perfect weather for staying hydrated! Stick to your regular water intake.';
    }

    // Humidity adjustments
    if (humidity > 70) {
      multiplier += 0.15;
      advice += ' The high humidity makes you sweat more, so drink extra water.';
    } else if (humidity < 30) {
      multiplier += 0.1;
      advice += ' Low humidity can increase water loss through breathing.';
    }

    // Weather condition adjustments
    switch (condition) {
      case 'rain':
        advice = '🌧️ Rainy day! Perfect time to stay cozy and keep up with your hydration goals.';
        break;
      case 'sunny':
      case 'clear':
        multiplier += 0.1;
        advice = '☀️ Sunny and bright! Extra hydration will help you feel energized.';
        break;
      case 'snow':
        advice = '❄️ Snowy weather can be dehydrating. Warm drinks count towards hydration too!';
        break;
    }

    // Activity level adjustments
    const activityMultipliers = { low: 1, moderate: 1.2, high: 1.4 };
    multiplier *= activityMultipliers[activityLevel] || 1.2;

    const recommendedIntake = Math.round(baseRecommendation * multiplier);

    return {
      recommendedIntake,
      advice,
      weatherSummary: `${temperature}°C, ${humidity}% humidity, ${condition}`,
      adjustmentFactor: Math.round((multiplier - 1) * 100)
    };
  }

  static getHourlyHydrationTips(weather) {
    const { temperature, condition, humidity } = weather;
    const tips = [];

    if (temperature > 25) {
      tips.push('💧 Drink water before you feel thirsty in hot weather');
      tips.push('🧊 Consider adding ice to your water for extra cooling');
    }

    if (humidity > 60) {
      tips.push('💦 High humidity increases sweat loss - stay ahead of dehydration');
    }

    if (condition === 'sunny') {
      tips.push('☀️ UV exposure increases fluid needs - drink up!');
    }

    if (condition === 'rain') {
      tips.push('🌧️ Rainy day is perfect for herbal teas and warm hydrating drinks');
    }

    if (tips.length === 0) {
      tips.push('💙 Perfect weather for consistent hydration!');
    }

    return tips;
  }

  static async getLocationPermission() {
    try {
      // This would use expo-location in a real implementation
      // For now, return mock coordinates
      return {
        granted: true,
        coords: {
          latitude: 37.7749, // San Francisco
          longitude: -122.4194
        }
      };
    } catch (error) {
      console.error('Error getting location permission:', error);
      return { granted: false };
    }
  }

  static getWeatherEmoji(condition) {
    const emojiMap = {
      'clear': '☀️',
      'sunny': '☀️',
      'clouds': '☁️',
      'cloudy': '☁️',
      'rain': '🌧️',
      'drizzle': '🌦️',
      'thunderstorm': '⛈️',
      'snow': '❄️',
      'mist': '🌫️',
      'fog': '🌫️',
      'haze': '🌫️'
    };
    
    return emojiMap[condition] || '🌤️';
  }
}

export default WeatherService;
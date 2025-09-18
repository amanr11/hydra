import { Alert } from 'react-native';

export const getTodayKey = () => {
  return new Date().toISOString().slice(0, 10);
};

export const calculateSmartGoal = (userProfile) => {
  const { weight, activityLevel, wakeTime, sleepTime } = userProfile;
  let baseGoal = weight * 35; // 35ml per kg

  // Adjust for activity level
  const activityMultipliers = { low: 1, moderate: 1.2, high: 1.4 };
  baseGoal *= activityMultipliers[activityLevel] || 1.2;

  // Adjust for awake time
  const wakeHour = parseInt(wakeTime.split(':')[0], 10);
  const sleepHour = parseInt(sleepTime.split(':')[0], 10);
  const awakeHours = (sleepHour > wakeHour) ? (sleepHour - wakeHour) : (24 - wakeHour + sleepHour);
  baseGoal *= (awakeHours / 16); // Average awake hours is 16

  return Math.round(baseGoal);
};

export const getSmartTip = async (userProfile) => {
  try {
    const systemPrompt = "You are a friendly and knowledgeable AI assistant for a hydration tracking app. Provide a single, concise, and engaging hydration tip, tailored to the user's profile. Use emojis where appropriate. Start the tip with a relevant emoji. Do not use quotes, just the tip itself. The tip should be one to two sentences max.";
    const userQuery = `Generate a hydration tip for a user with the following profile:
    - Name: ${userProfile.name}
    - Weight: ${userProfile.weight} kg
    - Activity Level: ${userProfile.activityLevel}`;

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
    };

    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    const candidate = result.candidates?.[0];

    if (candidate && candidate.content?.parts?.[0]?.text) {
      return candidate.content.parts[0].text;
    } else {
      console.log('Failed to fetch tip:', result);
      return "💡 Drink water throughout the day, not just when you're thirsty!";
    }
  } catch (error) {
    console.error('Error fetching AI tip:', error);
    return "💡 Keep a reusable water bottle handy to stay hydrated all day!";
  }
};

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
  const FALLBACK_TIPS = [
    "💡 Drink water throughout the day, not just when you're thirsty!",
    "💧 Start your morning with a glass of water to kickstart your metabolism.",
    "🌿 Eating water-rich foods like cucumbers and watermelon counts toward your hydration!",
    "🏃 Increase your water intake on days you exercise — aim for an extra 500ml.",
    "🌡️ Hot weather increases your hydration needs. Add an extra glass on warm days.",
    "☕ Caffeinated drinks have a mild diuretic effect — balance them with extra water.",
    "🌙 Drink a glass of water before bed to replenish overnight water loss.",
    "🥤 Carrying a reusable water bottle makes it much easier to stay hydrated.",
  ];

  try {
    // Set your Gemini API key here to enable AI-generated tips.
    // Get a key at: https://aistudio.google.com/app/apikey
    // IMPORTANT: Do not commit a real API key to version control.
    // Consider storing it in app.config.js extra fields or a .env file (gitignored).
    const apiKey = "";
    if (!apiKey) {
      // No API key configured — return a randomized fallback tip
      return FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
    }

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
      return FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
    }
  } catch (error) {
    console.error('Error fetching AI tip:', error);
    return FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
  }
};

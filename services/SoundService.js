import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import StorageService from './StorageService';

const SOUND_FILES = {
  drink: require('../assets/sounds/drink.wav'),
  levelup: require('../assets/sounds/levelup.wav'),
};

class SoundService {
  static _sounds = {};

  static async init() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      // Pre-load all sounds immediately
      for (const [key, file] of Object.entries(SOUND_FILES)) {
        const { sound } = await Audio.Sound.createAsync(file);
        this._sounds[key] = sound;
      }
    } catch (e) {
      console.log('Sound load error', e);
    }
  }

  static async play(type) {
    try {
      const settings = await StorageService.getSettings();
      if (!settings?.soundEnabled) return;
      
      const sound = this._sounds[type];
      if (sound) {
        await sound.replayAsync(); // Replay is faster than playAsync for lag reduction
      }
    } catch (e) {}
  }

  static async haptic(style = 'light') {
    const settings = await StorageService.getSettings();
    if (!settings?.hapticsEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export default SoundService;

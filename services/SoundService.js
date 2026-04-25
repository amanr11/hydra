// services/SoundService.js - Sound effects and haptic feedback
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import StorageService from './StorageService';

const SOUND_FILES = {
  drink: require('../assets/sounds/drink.wav'),
  halfway: require('../assets/sounds/halfway.wav'),
  complete: require('../assets/sounds/complete.wav'),
  levelup: require('../assets/sounds/levelup.wav'),
};

class SoundService {
  static _sounds = {};
  static _initialized = false;

  static async init() {
    if (SoundService._initialized) return;
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
      });
      await SoundService._loadAll();
      SoundService._initialized = true;
    } catch (e) {
      console.warn('SoundService: init failed', e);
    }
  }

  static async _loadAll() {
    for (const [key, file] of Object.entries(SOUND_FILES)) {
      try {
        const { sound } = await Audio.Sound.createAsync(file, { shouldPlay: false });
        SoundService._sounds[key] = sound;
      } catch (e) {
        console.warn(`SoundService: failed to load ${key}`, e);
      }
    }
  }

  static async play(type) {
    try {
      const settings = await StorageService.getSettings();
      if (!settings?.soundEnabled) return;

      const sound = SoundService._sounds[type];
      if (!sound) return;

      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch (e) {
      console.warn(`SoundService: failed to play ${type}`, e);
    }
  }

  static async haptic(style = 'light') {
    try {
      const settings = await StorageService.getSettings();
      if (!settings?.hapticsEnabled) return;

      switch (style) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      console.warn('SoundService: haptic failed', e);
    }
  }

  static async unload() {
    for (const sound of Object.values(SoundService._sounds)) {
      try {
        await sound.unloadAsync();
      } catch (e) {
        // ignore
      }
    }
    SoundService._sounds = {};
    SoundService._initialized = false;
  }
}

export default SoundService;

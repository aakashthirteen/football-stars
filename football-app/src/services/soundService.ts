import { Audio } from 'expo-av';

class SoundService {
  private static instance: SoundService;
  private whistleSound: Audio.Sound | null = null;

  private constructor() {}

  public static getInstance(): SoundService {
    if (!SoundService.instance) {
      SoundService.instance = new SoundService();
    }
    return SoundService.instance;
  }

  public async initializeSounds() {
    try {
      // Enable audio playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      console.log('🎵 Sound service initialized (whistles will use vibration patterns)');
      // For now, we'll use vibration patterns instead of actual audio
      // This ensures the feature works immediately without external dependencies
    } catch (error) {
      console.error('❌ Failed to initialize audio:', error);
    }
  }

  public async playWhistle(): Promise<void> {
    try {
      console.log('🎵 Playing referee whistle (vibration)');
      // Use vibration pattern that mimics a whistle
      const { Vibration } = require('react-native');
      Vibration.vibrate([0, 200, 100, 200]); // Short-short pattern
    } catch (error) {
      console.error('❌ Failed to play whistle:', error);
    }
  }

  public async playGoalWhistle(): Promise<void> {
    try {
      console.log('🎵 Playing goal celebration whistles (vibration)');
      // Three short vibration bursts for goal celebration
      const { Vibration } = require('react-native');
      Vibration.vibrate([0, 150, 100, 150, 100, 150]); // Three quick bursts
    } catch (error) {
      console.error('❌ Failed to play goal whistle:', error);
    }
  }

  public async playHalftimeWhistle(): Promise<void> {
    try {
      console.log('🎵 Playing halftime whistle (vibration)');
      // Single long vibration for halftime
      const { Vibration } = require('react-native');
      Vibration.vibrate([0, 500]); // One long burst
    } catch (error) {
      console.error('❌ Failed to play halftime whistle:', error);
    }
  }

  public async playMatchStartWhistle(): Promise<void> {
    try {
      console.log('🎵 Playing match start whistle (vibration)');
      // Single sharp vibration for match start
      const { Vibration } = require('react-native');
      Vibration.vibrate([0, 300]); // One sharp burst
    } catch (error) {
      console.error('❌ Failed to play match start whistle:', error);
    }
  }

  public async playSecondHalfWhistle(): Promise<void> {
    try {
      console.log('🎵 Playing second half start whistle (vibration)');
      // Single vibration for second half start
      const { Vibration } = require('react-native');
      Vibration.vibrate([0, 300]); // One sharp burst
    } catch (error) {
      console.error('❌ Failed to play second half whistle:', error);
    }
  }

  public async playFullTimeWhistle(): Promise<void> {
    try {
      console.log('🎵 Playing full-time whistle sequence (vibration)');
      // Three long vibrations for full-time
      const { Vibration } = require('react-native');
      Vibration.vibrate([0, 400, 200, 400, 200, 400]); // Three long bursts
    } catch (error) {
      console.error('❌ Failed to play full-time whistle:', error);
    }
  }

  public async unloadSounds(): Promise<void> {
    try {
      console.log('🎵 Sound service cleaned up');
      // Nothing to unload for vibration-based implementation
    } catch (error) {
      console.error('❌ Failed to unload sounds:', error);
    }
  }
}

export const soundService = SoundService.getInstance();
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

      // Load whistle sound - using a public URL for now since we don't have the actual file
      // In production, you would bundle the sound file in assets/sounds/
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://www.soundjay.com/misc/sounds/whistle-blow-1.mp3' },
        { shouldPlay: false }
      );
      
      this.whistleSound = sound;
      console.log('🎵 Whistle sound loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load whistle sound:', error);
      // Create a backup beep sound if whistle fails to load
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('expo-av/build/default-sounds/beep.mp3'),
          { shouldPlay: false }
        );
        this.whistleSound = sound;
        console.log('🎵 Backup beep sound loaded');
      } catch (backupError) {
        console.error('❌ Failed to load backup sound:', backupError);
      }
    }
  }

  public async playWhistle(): Promise<void> {
    try {
      if (!this.whistleSound) {
        await this.initializeSounds();
      }

      if (this.whistleSound) {
        // Reset position to beginning
        await this.whistleSound.setPositionAsync(0);
        await this.whistleSound.playAsync();
        console.log('🎵 Playing referee whistle sound');
      } else {
        console.warn('⚠️ Whistle sound not available, using vibration instead');
        // Fallback to vibration pattern that mimics a whistle
        const { Vibration } = require('react-native');
        Vibration.vibrate([0, 200, 100, 200, 100, 400]); // Quick-quick-long pattern
      }
    } catch (error) {
      console.error('❌ Failed to play whistle sound:', error);
      // Fallback to vibration
      const { Vibration } = require('react-native');
      Vibration.vibrate([0, 200, 100, 200, 100, 400]);
    }
  }

  public async playGoalWhistle(): Promise<void> {
    try {
      // Three short whistle blows for goal celebration
      if (this.whistleSound) {
        for (let i = 0; i < 3; i++) {
          await this.whistleSound.setPositionAsync(0);
          await this.whistleSound.playAsync();
          await new Promise(resolve => setTimeout(resolve, 300)); // Short pause between whistles
        }
        console.log('🎵 Playing goal celebration whistles');
      }
    } catch (error) {
      console.error('❌ Failed to play goal whistle:', error);
    }
  }

  public async playHalftimeWhistle(): Promise<void> {
    try {
      // Single long whistle blow for halftime
      if (this.whistleSound) {
        await this.whistleSound.setPositionAsync(0);
        await this.whistleSound.playAsync();
        console.log('🎵 Playing halftime whistle');
      }
    } catch (error) {
      console.error('❌ Failed to play halftime whistle:', error);
    }
  }

  public async playMatchStartWhistle(): Promise<void> {
    try {
      // Single sharp whistle blow for match start
      if (this.whistleSound) {
        await this.whistleSound.setPositionAsync(0);
        await this.whistleSound.playAsync();
        console.log('🎵 Playing match start whistle');
      }
    } catch (error) {
      console.error('❌ Failed to play match start whistle:', error);
    }
  }

  public async playSecondHalfWhistle(): Promise<void> {
    try {
      // Single whistle blow for second half start
      if (this.whistleSound) {
        await this.whistleSound.setPositionAsync(0);
        await this.whistleSound.playAsync();
        console.log('🎵 Playing second half start whistle');
      }
    } catch (error) {
      console.error('❌ Failed to play second half whistle:', error);
    }
  }

  public async playFullTimeWhistle(): Promise<void> {
    try {
      // Three long whistle blows for full-time
      if (this.whistleSound) {
        for (let i = 0; i < 3; i++) {
          await this.whistleSound.setPositionAsync(0);
          await this.whistleSound.playAsync();
          await new Promise(resolve => setTimeout(resolve, 500)); // Longer pause between whistles
        }
        console.log('🎵 Playing full-time whistle sequence');
      }
    } catch (error) {
      console.error('❌ Failed to play full-time whistle:', error);
    }
  }

  public async unloadSounds(): Promise<void> {
    try {
      if (this.whistleSound) {
        await this.whistleSound.unloadAsync();
        this.whistleSound = null;
        console.log('🎵 Sounds unloaded');
      }
    } catch (error) {
      console.error('❌ Failed to unload sounds:', error);
    }
  }
}

export const soundService = SoundService.getInstance();
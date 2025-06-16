// Offline Service for Football Stars App
// Handles offline functionality, data synchronization, and local storage

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Match, MatchEvent, Player, Team } from '../types';

export interface OfflineMatchData {
  id: string;
  matchData: Match;
  events: MatchEvent[];
  formations: {
    homeTeam?: any;
    awayTeam?: any;
  };
  metadata: {
    createdAt: number;
    lastModified: number;
    syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
    eventCount: number;
    duration: number;
  };
}

export interface OfflineEventQueue {
  id: string;
  matchId: string;
  eventData: any;
  eventType: 'goal' | 'card' | 'substitution' | 'formation_change' | 'match_start' | 'match_end';
  timestamp: number;
  syncAttempts: number;
  priority: 'high' | 'normal' | 'low';
}

export interface OfflineSettings {
  autoSync: boolean;
  syncOnWifiOnly: boolean;
  maxOfflineMatches: number;
  syncRetryAttempts: number;
  syncRetryDelay: number; // milliseconds
  compressionEnabled: boolean;
}

class OfflineService {
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private eventQueue: OfflineEventQueue[] = [];
  private offlineMatches: Map<string, OfflineMatchData> = new Map();
  private settings: OfflineSettings;
  private syncTimer: NodeJS.Timeout | null = null;

  // Storage keys
  private readonly OFFLINE_MATCHES_KEY = 'offline_matches';
  private readonly EVENT_QUEUE_KEY = 'event_queue';
  private readonly OFFLINE_SETTINGS_KEY = 'offline_settings';
  private readonly LAST_SYNC_KEY = 'last_sync_timestamp';

  constructor() {
    this.settings = {
      autoSync: true,
      syncOnWifiOnly: false,
      maxOfflineMatches: 10,
      syncRetryAttempts: 3,
      syncRetryDelay: 5000,
      compressionEnabled: true,
    };

    this.initialize();
  }

  /**
   * Initialize offline service
   */
  async initialize(): Promise<void> {
    try {
      console.log('📱 Initializing offline service...');
      
      // Load saved data
      await this.loadOfflineMatches();
      await this.loadEventQueue();
      await this.loadSettings();
      
      // Set up network monitoring
      this.setupNetworkMonitoring();
      
      // Start periodic sync if auto-sync is enabled
      if (this.settings.autoSync) {
        this.startPeriodicSync();
      }
      
      console.log('✅ Offline service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize offline service:', error);
    }
  }

  /**
   * Monitor network connectivity
   */
  private setupNetworkMonitoring(): void {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected || false;
      
      console.log(`📶 Network status changed: ${wasOnline ? 'online' : 'offline'} -> ${this.isOnline ? 'online' : 'offline'}`);
      
      // If we just came online, trigger sync
      if (!wasOnline && this.isOnline && this.settings.autoSync) {
        this.triggerSync();
      }
    });
  }

  /**
   * Check if device is online
   */
  isDeviceOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Start a new offline match
   */
  async startOfflineMatch(matchData: Match): Promise<string> {
    try {
      const offlineMatch: OfflineMatchData = {
        id: matchData.id,
        matchData,
        events: [],
        formations: {},
        metadata: {
          createdAt: Date.now(),
          lastModified: Date.now(),
          syncStatus: 'pending',
          eventCount: 0,
          duration: 0,
        },
      };

      this.offlineMatches.set(matchData.id, offlineMatch);
      await this.saveOfflineMatches();
      
      console.log('🏈 Started offline match:', matchData.id);
      return matchData.id;
      
    } catch (error) {
      console.error('❌ Failed to start offline match:', error);
      throw error;
    }
  }

  /**
   * Add event to offline match
   */
  async addOfflineEvent(matchId: string, eventData: any, eventType: OfflineEventQueue['eventType']): Promise<void> {
    try {
      // Add to offline match if exists
      const offlineMatch = this.offlineMatches.get(matchId);
      if (offlineMatch) {
        const event: MatchEvent = {
          id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          matchId,
          playerId: eventData.playerId || '',
          player: eventData.player || {} as Player,
          teamId: eventData.teamId || '',
          eventType: eventData.eventType || eventType.toUpperCase(),
          minute: eventData.minute || 0,
          description: eventData.description,
        };

        offlineMatch.events.push(event);
        offlineMatch.metadata.lastModified = Date.now();
        offlineMatch.metadata.eventCount = offlineMatch.events.length;
        
        await this.saveOfflineMatches();
      }

      // Add to sync queue
      const queueItem: OfflineEventQueue = {
        id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        matchId,
        eventData,
        eventType,
        timestamp: Date.now(),
        syncAttempts: 0,
        priority: eventType === 'goal' ? 'high' : eventType === 'match_end' ? 'high' : 'normal',
      };

      this.eventQueue.push(queueItem);
      await this.saveEventQueue();
      
      console.log('📝 Added offline event:', eventType, 'for match:', matchId);
      
      // Try immediate sync if online
      if (this.isOnline && this.settings.autoSync) {
        this.triggerSync();
      }
      
    } catch (error) {
      console.error('❌ Failed to add offline event:', error);
      throw error;
    }
  }

  /**
   * Get offline match data
   */
  getOfflineMatch(matchId: string): OfflineMatchData | null {
    return this.offlineMatches.get(matchId) || null;
  }

  /**
   * Get all offline matches
   */
  getAllOfflineMatches(): OfflineMatchData[] {
    return Array.from(this.offlineMatches.values());
  }

  /**
   * Get pending sync queue
   */
  getPendingSyncItems(): OfflineEventQueue[] {
    return this.eventQueue.filter(item => item.syncAttempts < this.settings.syncRetryAttempts);
  }

  /**
   * Trigger manual sync
   */
  async triggerSync(): Promise<{ success: boolean; syncedItems: number; errors: number }> {
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress');
      return { success: false, syncedItems: 0, errors: 0 };
    }

    if (!this.isOnline) {
      console.log('📱 Device offline, sync cancelled');
      return { success: false, syncedItems: 0, errors: 0 };
    }

    this.syncInProgress = true;
    let syncedItems = 0;
    let errors = 0;

    try {
      console.log('🔄 Starting sync process...');
      
      // Sync pending events
      const pendingItems = this.getPendingSyncItems();
      console.log(`📋 ${pendingItems.length} items in sync queue`);
      
      for (const item of pendingItems) {
        try {
          await this.syncSingleEvent(item);
          syncedItems++;
          
          // Remove from queue after successful sync
          this.eventQueue = this.eventQueue.filter(queueItem => queueItem.id !== item.id);
          
        } catch (error) {
          console.error(`❌ Failed to sync event ${item.id}:`, error);
          errors++;
          
          // Increment sync attempts
          item.syncAttempts++;
          item.timestamp = Date.now(); // Update for retry delay
        }
      }
      
      // Update match sync status
      await this.updateMatchSyncStatus();
      
      // Save updated queue
      await this.saveEventQueue();
      
      // Update last sync timestamp
      await AsyncStorage.setItem(this.LAST_SYNC_KEY, Date.now().toString());
      
      console.log(`✅ Sync completed: ${syncedItems} synced, ${errors} errors`);
      
      return { success: errors === 0, syncedItems, errors };
      
    } catch (error) {
      console.error('❌ Sync process failed:', error);
      return { success: false, syncedItems, errors: errors + 1 };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync a single event to the backend
   */
  private async syncSingleEvent(item: OfflineEventQueue): Promise<void> {
    // TODO: Replace with actual API call
    console.log(`🔄 Syncing event: ${item.eventType} for match ${item.matchId}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    // Simulate occasional failures for testing
    if (Math.random() < 0.1) {
      throw new Error('Simulated sync failure');
    }
    
    // In real implementation:
    // const response = await apiService.addMatchEvent(item.matchId, item.eventData);
    // if (!response.success) throw new Error(response.error);
  }

  /**
   * Update match sync status after successful syncs
   */
  private async updateMatchSyncStatus(): Promise<void> {
    this.offlineMatches.forEach(match => {
      const pendingEventsForMatch = this.eventQueue.filter(
        item => item.matchId === match.id && item.syncAttempts < this.settings.syncRetryAttempts
      );
      
      if (pendingEventsForMatch.length === 0) {
        match.metadata.syncStatus = 'synced';
      } else {
        match.metadata.syncStatus = 'pending';
      }
    });
    
    await this.saveOfflineMatches();
  }

  /**
   * Start periodic sync timer
   */
  private startPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    // Sync every 30 seconds when auto-sync is enabled
    this.syncTimer = setInterval(() => {
      if (this.isOnline && this.eventQueue.length > 0) {
        this.triggerSync();
      }
    }, 30000);
  }

  /**
   * Clear old offline matches to free storage
   */
  async clearOldMatches(): Promise<number> {
    const matches = Array.from(this.offlineMatches.values());
    
    if (matches.length <= this.settings.maxOfflineMatches) {
      return 0;
    }
    
    // Sort by creation date, keep newest
    matches.sort((a, b) => b.metadata.createdAt - a.metadata.createdAt);
    const matchesToRemove = matches.slice(this.settings.maxOfflineMatches);
    
    let removedCount = 0;
    for (const match of matchesToRemove) {
      // Only remove fully synced matches
      if (match.metadata.syncStatus === 'synced') {
        this.offlineMatches.delete(match.id);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      await this.saveOfflineMatches();
      console.log(`🗑️ Cleared ${removedCount} old offline matches`);
    }
    
    return removedCount;
  }

  /**
   * Get offline storage statistics
   */
  async getStorageStats(): Promise<{
    totalMatches: number;
    syncedMatches: number;
    pendingMatches: number;
    queueSize: number;
    lastSync: Date | null;
    storageSize: string;
  }> {
    const matches = Array.from(this.offlineMatches.values());
    const syncedMatches = matches.filter(m => m.metadata.syncStatus === 'synced').length;
    const pendingMatches = matches.filter(m => m.metadata.syncStatus === 'pending').length;
    
    const lastSyncStr = await AsyncStorage.getItem(this.LAST_SYNC_KEY);
    const lastSync = lastSyncStr ? new Date(parseInt(lastSyncStr)) : null;
    
    // Estimate storage size
    const matchesStr = await AsyncStorage.getItem(this.OFFLINE_MATCHES_KEY);
    const queueStr = await AsyncStorage.getItem(this.EVENT_QUEUE_KEY);
    const totalBytes = (matchesStr?.length || 0) + (queueStr?.length || 0);
    const storageSize = this.formatBytes(totalBytes);
    
    return {
      totalMatches: matches.length,
      syncedMatches,
      pendingMatches,
      queueSize: this.eventQueue.length,
      lastSync,
      storageSize,
    };
  }

  /**
   * Update offline settings
   */
  async updateSettings(newSettings: Partial<OfflineSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await AsyncStorage.setItem(this.OFFLINE_SETTINGS_KEY, JSON.stringify(this.settings));
    
    // Restart periodic sync if settings changed
    if (newSettings.autoSync !== undefined) {
      if (this.settings.autoSync) {
        this.startPeriodicSync();
      } else if (this.syncTimer) {
        clearInterval(this.syncTimer);
        this.syncTimer = null;
      }
    }
    
    console.log('⚙️ Offline settings updated:', newSettings);
  }

  /**
   * Get current offline settings
   */
  getSettings(): OfflineSettings {
    return { ...this.settings };
  }

  /**
   * Storage management methods
   */
  private async loadOfflineMatches(): Promise<void> {
    try {
      const matchesStr = await AsyncStorage.getItem(this.OFFLINE_MATCHES_KEY);
      if (matchesStr) {
        const matchesArray: OfflineMatchData[] = JSON.parse(matchesStr);
        this.offlineMatches = new Map(matchesArray.map(match => [match.id, match]));
        console.log(`📂 Loaded ${this.offlineMatches.size} offline matches`);
      }
    } catch (error) {
      console.error('❌ Failed to load offline matches:', error);
    }
  }

  private async saveOfflineMatches(): Promise<void> {
    try {
      const matchesArray = Array.from(this.offlineMatches.values());
      await AsyncStorage.setItem(this.OFFLINE_MATCHES_KEY, JSON.stringify(matchesArray));
    } catch (error) {
      console.error('❌ Failed to save offline matches:', error);
    }
  }

  private async loadEventQueue(): Promise<void> {
    try {
      const queueStr = await AsyncStorage.getItem(this.EVENT_QUEUE_KEY);
      if (queueStr) {
        this.eventQueue = JSON.parse(queueStr);
        console.log(`📋 Loaded ${this.eventQueue.length} queued events`);
      }
    } catch (error) {
      console.error('❌ Failed to load event queue:', error);
    }
  }

  private async saveEventQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.EVENT_QUEUE_KEY, JSON.stringify(this.eventQueue));
    } catch (error) {
      console.error('❌ Failed to save event queue:', error);
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const settingsStr = await AsyncStorage.getItem(this.OFFLINE_SETTINGS_KEY);
      if (settingsStr) {
        const savedSettings = JSON.parse(settingsStr);
        this.settings = { ...this.settings, ...savedSettings };
        console.log('⚙️ Loaded offline settings');
      }
    } catch (error) {
      console.error('❌ Failed to load offline settings:', error);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    console.log('🧹 Offline service cleaned up');
  }
}

// Export singleton instance
export const offlineService = new OfflineService();
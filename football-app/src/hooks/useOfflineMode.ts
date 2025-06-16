// React Hook for Offline Mode Management in Football Stars App
// Provides easy integration with offline functionality for match recording

import { useState, useEffect, useCallback } from 'react';
import { offlineService, OfflineMatchData, OfflineSettings } from '../services/offlineService';
import { Match, MatchEvent } from '../types';

export interface OfflineStatus {
  isOnline: boolean;
  syncInProgress: boolean;
  pendingEvents: number;
  lastSync: Date | null;
  storageUsed: string;
}

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  errors: number;
}

export const useOfflineMode = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [offlineMatches, setOfflineMatches] = useState<OfflineMatchData[]>([]);
  const [settings, setSettings] = useState<OfflineSettings>(offlineService.getSettings());
  const [storageStats, setStorageStats] = useState<any>(null);

  // Initialize and set up listeners
  useEffect(() => {
    const initializeOffline = async () => {
      await offlineService.initialize();
      await refreshOfflineData();
    };

    initializeOffline();

    // Set up periodic refresh of offline data
    const interval = setInterval(refreshOfflineData, 10000); // Every 10 seconds

    return () => {
      clearInterval(interval);
      offlineService.cleanup();
    };
  }, []);

  /**
   * Refresh offline data from service
   */
  const refreshOfflineData = useCallback(async () => {
    try {
      setIsOnline(offlineService.isDeviceOnline());
      setOfflineMatches(offlineService.getAllOfflineMatches());
      
      const stats = await offlineService.getStorageStats();
      setStorageStats(stats);
      
    } catch (error) {
      console.error('Failed to refresh offline data:', error);
    }
  }, []);

  /**
   * Start recording a match offline
   */
  const startOfflineMatch = useCallback(async (matchData: Match): Promise<string> => {
    try {
      const matchId = await offlineService.startOfflineMatch(matchData);
      await refreshOfflineData();
      console.log('✅ Started offline match recording:', matchId);
      return matchId;
    } catch (error) {
      console.error('❌ Failed to start offline match:', error);
      throw error;
    }
  }, [refreshOfflineData]);

  /**
   * Add event to offline match
   */
  const addOfflineEvent = useCallback(async (
    matchId: string, 
    eventData: any, 
    eventType: 'goal' | 'card' | 'substitution' | 'formation_change' | 'match_start' | 'match_end'
  ): Promise<void> => {
    try {
      await offlineService.addOfflineEvent(matchId, eventData, eventType);
      await refreshOfflineData();
      console.log('✅ Added offline event:', eventType);
    } catch (error) {
      console.error('❌ Failed to add offline event:', error);
      throw error;
    }
  }, [refreshOfflineData]);

  /**
   * Manually trigger sync
   */
  const triggerSync = useCallback(async (): Promise<SyncResult> => {
    try {
      setSyncInProgress(true);
      const result = await offlineService.triggerSync();
      await refreshOfflineData();
      console.log('✅ Manual sync completed:', result);
      return result;
    } catch (error) {
      console.error('❌ Manual sync failed:', error);
      return { success: false, syncedItems: 0, errors: 1 };
    } finally {
      setSyncInProgress(false);
    }
  }, [refreshOfflineData]);

  /**
   * Update offline settings
   */
  const updateOfflineSettings = useCallback(async (newSettings: Partial<OfflineSettings>): Promise<void> => {
    try {
      await offlineService.updateSettings(newSettings);
      setSettings(offlineService.getSettings());
      console.log('✅ Offline settings updated');
    } catch (error) {
      console.error('❌ Failed to update offline settings:', error);
      throw error;
    }
  }, []);

  /**
   * Clear old synced matches
   */
  const clearOldMatches = useCallback(async (): Promise<number> => {
    try {
      const clearedCount = await offlineService.clearOldMatches();
      await refreshOfflineData();
      console.log(`✅ Cleared ${clearedCount} old matches`);
      return clearedCount;
    } catch (error) {
      console.error('❌ Failed to clear old matches:', error);
      return 0;
    }
  }, [refreshOfflineData]);

  /**
   * Get specific offline match
   */
  const getOfflineMatch = useCallback((matchId: string): OfflineMatchData | null => {
    return offlineService.getOfflineMatch(matchId);
  }, []);

  /**
   * Get offline status summary
   */
  const getOfflineStatus = useCallback((): OfflineStatus => {
    return {
      isOnline,
      syncInProgress,
      pendingEvents: storageStats?.queueSize || 0,
      lastSync: storageStats?.lastSync || null,
      storageUsed: storageStats?.storageSize || '0 Bytes',
    };
  }, [isOnline, syncInProgress, storageStats]);

  /**
   * Check if a match is being recorded offline
   */
  const isMatchOffline = useCallback((matchId: string): boolean => {
    return offlineMatches.some(match => match.id === matchId);
  }, [offlineMatches]);

  /**
   * Get match sync status
   */
  const getMatchSyncStatus = useCallback((matchId: string): 'pending' | 'syncing' | 'synced' | 'error' | 'not_found' => {
    const match = offlineMatches.find(m => m.id === matchId);
    return match?.metadata.syncStatus || 'not_found';
  }, [offlineMatches]);

  /**
   * Helper functions for different event types
   */
  const offlineActions = {
    /**
     * Record a goal offline
     */
    recordGoal: (matchId: string, playerData: any) =>
      addOfflineEvent(matchId, { ...playerData, eventType: 'GOAL' }, 'goal'),

    /**
     * Record a card offline
     */
    recordCard: (matchId: string, playerData: any, cardType: 'YELLOW_CARD' | 'RED_CARD') =>
      addOfflineEvent(matchId, { ...playerData, eventType: cardType }, 'card'),

    /**
     * Record a substitution offline
     */
    recordSubstitution: (matchId: string, substitutionData: any) =>
      addOfflineEvent(matchId, { ...substitutionData, eventType: 'SUBSTITUTION' }, 'substitution'),

    /**
     * Record formation change offline
     */
    recordFormationChange: (matchId: string, formationData: any) =>
      addOfflineEvent(matchId, formationData, 'formation_change'),

    /**
     * Record match start offline
     */
    recordMatchStart: (matchId: string, matchData: any) =>
      addOfflineEvent(matchId, matchData, 'match_start'),

    /**
     * Record match end offline
     */
    recordMatchEnd: (matchId: string, matchData: any) =>
      addOfflineEvent(matchId, matchData, 'match_end'),
  };

  return {
    // Status
    isOnline,
    syncInProgress,
    offlineMatches,
    settings,
    storageStats,

    // Actions
    startOfflineMatch,
    addOfflineEvent,
    triggerSync,
    updateOfflineSettings,
    clearOldMatches,
    refreshOfflineData,

    // Queries
    getOfflineMatch,
    getOfflineStatus,
    isMatchOffline,
    getMatchSyncStatus,

    // Convenience methods
    offlineActions,
  };
};

/**
 * Hook specifically for live match recording with offline capabilities
 */
export const useOfflineMatchRecording = (matchId: string) => {
  const {
    isOnline,
    syncInProgress,
    getOfflineMatch,
    getMatchSyncStatus,
    offlineActions,
    triggerSync,
  } = useOfflineMode();

  const offlineMatch = getOfflineMatch(matchId);
  const syncStatus = getMatchSyncStatus(matchId);
  const isRecordingOffline = offlineMatch !== null;

  /**
   * Record match event with automatic offline handling
   */
  const recordEvent = useCallback(async (
    eventType: 'goal' | 'card' | 'substitution' | 'formation_change',
    eventData: any
  ): Promise<void> => {
    try {
      switch (eventType) {
        case 'goal':
          await offlineActions.recordGoal(matchId, eventData);
          break;
        case 'card':
          await offlineActions.recordCard(matchId, eventData, eventData.cardType);
          break;
        case 'substitution':
          await offlineActions.recordSubstitution(matchId, eventData);
          break;
        case 'formation_change':
          await offlineActions.recordFormationChange(matchId, eventData);
          break;
      }

      console.log(`✅ Recorded ${eventType} event ${isOnline ? 'online' : 'offline'}`);
    } catch (error) {
      console.error(`❌ Failed to record ${eventType} event:`, error);
      throw error;
    }
  }, [matchId, offlineActions, isOnline]);

  /**
   * Get match recording statistics
   */
  const getMatchStats = useCallback(() => {
    if (!offlineMatch) return null;

    return {
      eventCount: offlineMatch.metadata.eventCount,
      duration: offlineMatch.metadata.duration,
      syncStatus: offlineMatch.metadata.syncStatus,
      lastModified: new Date(offlineMatch.metadata.lastModified),
      createdAt: new Date(offlineMatch.metadata.createdAt),
    };
  }, [offlineMatch]);

  return {
    // Status
    isOnline,
    syncInProgress,
    isRecordingOffline,
    syncStatus,
    matchStats: getMatchStats(),

    // Actions
    recordEvent,
    triggerSync,

    // Data
    offlineMatch,
  };
};
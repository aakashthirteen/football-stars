// React Hook for Managing Notifications in Football Stars App
import { useEffect, useCallback } from 'react';
import { notificationService, NotificationTemplates, NotificationData, NotificationPreferences } from '../services/notificationService';

export interface MatchEvent {
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution';
  playerName: string;
  teamName: string;
  minute: number;
  additionalData?: {
    score?: string;
    playerIn?: string; // For substitutions
  };
}

export const useNotifications = () => {
  // Initialize notification service when hook is first used
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        await notificationService.initialize();
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initializeNotifications();

    // Cleanup on unmount
    return () => {
      notificationService.cleanup();
    };
  }, []);

  /**
   * Send notification for live match event
   */
  const sendMatchEventNotification = useCallback(async (event: MatchEvent) => {
    try {
      let notification: NotificationData;

      switch (event.type) {
        case 'goal':
          if (!event.additionalData?.score) {
            console.warn('Score missing for goal notification');
            return;
          }
          notification = NotificationTemplates.goal(
            event.playerName,
            event.teamName,
            event.minute,
            event.additionalData.score
          );
          break;

        case 'yellow_card':
          notification = NotificationTemplates.yellowCard(
            event.playerName,
            event.teamName,
            event.minute
          );
          break;

        case 'red_card':
          notification = NotificationTemplates.redCard(
            event.playerName,
            event.teamName,
            event.minute
          );
          break;

        case 'substitution':
          if (!event.additionalData?.playerIn) {
            console.warn('PlayerIn missing for substitution notification');
            return;
          }
          notification = NotificationTemplates.substitution(
            event.playerName,
            event.additionalData.playerIn,
            event.teamName,
            event.minute
          );
          break;

        default:
          console.warn('Unknown match event type:', event.type);
          return;
      }

      await notificationService.sendLiveMatchNotification(notification);
      console.log('✅ Match event notification sent:', event.type);

    } catch (error) {
      console.error('❌ Failed to send match event notification:', error);
    }
  }, []);

  /**
   * Schedule match reminder notification
   */
  const scheduleMatchReminder = useCallback(async (
    homeTeam: string,
    awayTeam: string,
    kickoffTime: Date,
    reminderMinutes: number = 15
  ): Promise<string | null> => {
    try {
      const reminderTime = new Date(kickoffTime.getTime() - (reminderMinutes * 60 * 1000));
      
      // Don't schedule if reminder time is in the past
      if (reminderTime <= new Date()) {
        console.log('⏰ Reminder time is in the past, skipping schedule');
        return null;
      }

      const notification = NotificationTemplates.matchReminder(homeTeam, awayTeam, kickoffTime);
      const notificationId = await notificationService.scheduleNotification(notification, reminderTime);
      
      console.log('⏰ Match reminder scheduled:', {
        homeTeam,
        awayTeam,
        reminderTime,
        notificationId
      });

      return notificationId;
    } catch (error) {
      console.error('❌ Failed to schedule match reminder:', error);
      return null;
    }
  }, []);

  /**
   * Cancel scheduled match reminder
   */
  const cancelMatchReminder = useCallback(async (notificationId: string) => {
    try {
      await notificationService.cancelScheduledNotification(notificationId);
      console.log('🗑️ Match reminder cancelled:', notificationId);
    } catch (error) {
      console.error('❌ Failed to cancel match reminder:', error);
    }
  }, []);

  /**
   * Update notification preferences
   */
  const updateNotificationPreferences = useCallback(async (preferences: Partial<NotificationPreferences>) => {
    try {
      await notificationService.updatePreferences(preferences);
      console.log('⚙️ Notification preferences updated');
    } catch (error) {
      console.error('❌ Failed to update notification preferences:', error);
    }
  }, []);

  /**
   * Get current notification preferences
   */
  const getNotificationPreferences = useCallback((): NotificationPreferences => {
    return notificationService.getPreferences();
  }, []);

  /**
   * Send custom notification
   */
  const sendCustomNotification = useCallback(async (notification: NotificationData) => {
    try {
      await notificationService.sendLiveMatchNotification(notification);
      console.log('✅ Custom notification sent');
    } catch (error) {
      console.error('❌ Failed to send custom notification:', error);
    }
  }, []);

  /**
   * Helper functions for quick notifications
   */
  const quickNotifications = {
    /**
     * Send goal notification with celebration
     */
    goal: (playerName: string, teamName: string, minute: number, score: string) =>
      sendMatchEventNotification({
        type: 'goal',
        playerName,
        teamName,
        minute,
        additionalData: { score }
      }),

    /**
     * Send yellow card notification
     */
    yellowCard: (playerName: string, teamName: string, minute: number) =>
      sendMatchEventNotification({
        type: 'yellow_card',
        playerName,
        teamName,
        minute
      }),

    /**
     * Send red card notification
     */
    redCard: (playerName: string, teamName: string, minute: number) =>
      sendMatchEventNotification({
        type: 'red_card',
        playerName,
        teamName,
        minute
      }),

    /**
     * Send substitution notification
     */
    substitution: (playerOut: string, playerIn: string, teamName: string, minute: number) =>
      sendMatchEventNotification({
        type: 'substitution',
        playerName: playerOut,
        teamName,
        minute,
        additionalData: { playerIn }
      }),
  };

  return {
    // Core notification functions
    sendMatchEventNotification,
    scheduleMatchReminder,
    cancelMatchReminder,
    updateNotificationPreferences,
    getNotificationPreferences,
    sendCustomNotification,
    
    // Quick access to common notifications
    quickNotifications,
  };
};

/**
 * Hook for managing match-specific notifications
 * This is optimized for live match screens
 */
export const useMatchNotifications = (matchId: string, homeTeam: string, awayTeam: string, currentMinute?: number) => {
  const { quickNotifications, scheduleMatchReminder, cancelMatchReminder } = useNotifications();

  /**
   * Get current match minute for notifications
   */
  const getCurrentMinute = useCallback((): number => {
    return currentMinute || 0; // Use actual match minute
  }, [currentMinute]);

  /**
   * Send goal notification for current match
   */
  const notifyGoal = useCallback((playerName: string, teamName: string, score: string) => {
    const minute = getCurrentMinute();
    quickNotifications.goal(playerName, teamName, minute, score);
  }, [quickNotifications, getCurrentMinute]);

  /**
   * Send card notification for current match
   */
  const notifyCard = useCallback((playerName: string, teamName: string, cardType: 'yellow' | 'red') => {
    const minute = getCurrentMinute();
    if (cardType === 'yellow') {
      quickNotifications.yellowCard(playerName, teamName, minute);
    } else {
      quickNotifications.redCard(playerName, teamName, minute);
    }
  }, [quickNotifications, getCurrentMinute]);

  /**
   * Send substitution notification for current match
   */
  const notifySubstitution = useCallback((playerOut: string, playerIn: string, teamName: string) => {
    const minute = getCurrentMinute();
    quickNotifications.substitution(playerOut, playerIn, teamName, minute);
  }, [quickNotifications, getCurrentMinute]);

  return {
    notifyGoal,
    notifyCard,
    notifySubstitution,
    scheduleMatchReminder: (kickoffTime: Date, reminderMinutes?: number) =>
      scheduleMatchReminder(homeTeam, awayTeam, kickoffTime, reminderMinutes),
    cancelMatchReminder,
  };
};
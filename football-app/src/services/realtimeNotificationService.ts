import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from './api';
import { notificationService } from './notificationService';

interface BackendNotification {
  id: string;
  player_id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

class RealtimeNotificationService {
  private pollInterval: NodeJS.Timeout | null = null;
  private lastCheckTime: Date = new Date();
  private notificationCallback: ((notification: BackendNotification) => void) | null = null;
  private unreadCount: number = 0;
  private isInitialized: boolean = false;

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Initialize expo notifications
      await notificationService.initialize();
      
      // Start polling for new notifications
      this.startPolling();
      
      this.isInitialized = true;
      console.log('✅ Realtime notification service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize realtime notifications:', error);
    }
  }

  // Set callback for when new notifications arrive
  onNewNotification(callback: (notification: BackendNotification) => void) {
    this.notificationCallback = callback;
  }

  // Get current unread count
  getUnreadCount(): number {
    return this.unreadCount;
  }

  // Start polling for new notifications from backend
  private startPolling() {
    // Initial check
    this.checkForNewNotifications();
    
    // Check every 10 seconds for new notifications
    this.pollInterval = setInterval(() => {
      this.checkForNewNotifications();
    }, 10000); // Poll every 10 seconds
  }

  private async checkForNewNotifications() {
    try {
      const response = await api.get('/players/notifications');
      const notifications = response.data.notifications || [];
      this.unreadCount = response.data.unreadCount || 0;
      
      // Filter for new notifications since last check
      const newNotifications = notifications.filter((n: BackendNotification) => {
        const notificationTime = new Date(n.created_at);
        return notificationTime > this.lastCheckTime && !n.read;
      });

      // Process new notifications
      for (const notification of newNotifications) {
        await this.processNotification(notification);
      }

      if (newNotifications.length > 0) {
        this.lastCheckTime = new Date();
      }
    } catch (error) {
      // Silently fail - don't spam the console
      // Users might not be logged in yet
    }
  }

  // Process a new notification
  private async processNotification(notification: BackendNotification) {
    // Determine notification style based on type
    const { emoji, sound, priority } = this.getNotificationStyle(notification.type);
    
    // Show local notification with appropriate styling
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${emoji} ${notification.title}`,
        body: notification.message,
        data: notification.data,
        sound: sound ? 'default' : undefined,
        badge: this.unreadCount,
      },
      trigger: null,
    });

    // Call callback if set (for UI updates)
    if (this.notificationCallback) {
      this.notificationCallback(notification);
    }

    // Special handling for specific notification types
    await this.handleSpecialNotifications(notification);
  }

  private getNotificationStyle(type: string): { emoji: string; sound: boolean; priority: string } {
    switch (type) {
      case 'connection_request':
        return { emoji: '👥', sound: true, priority: 'high' };
      case 'connection_accepted':
        return { emoji: '✅', sound: true, priority: 'high' };
      case 'match_goal':
        return { emoji: '⚽', sound: true, priority: 'high' };
      case 'match_halftime':
        return { emoji: '⏱️', sound: false, priority: 'normal' };
      case 'match_fulltime':
        return { emoji: '🏁', sound: true, priority: 'high' };
      case 'match_yellow_card':
        return { emoji: '🟨', sound: false, priority: 'normal' };
      case 'match_red_card':
        return { emoji: '🟥', sound: true, priority: 'high' };
      case 'match_substitution':
        return { emoji: '🔄', sound: false, priority: 'low' };
      case 'match_assist':
        return { emoji: '🎯', sound: false, priority: 'normal' };
      case 'team_invite':
        return { emoji: '⚽', sound: true, priority: 'high' };
      case 'match_reminder':
        return { emoji: '⏰', sound: true, priority: 'high' };
      default:
        return { emoji: '📢', sound: false, priority: 'normal' };
    }
  }

  private async handleSpecialNotifications(notification: BackendNotification) {
    switch (notification.type) {
      case 'connection_request':
        // Vibrate to get attention for new friend requests
        if (Platform.OS !== 'web') {
          // Vibration.vibrate();
        }
        break;
      
      case 'match_goal':
        // Play celebration sound if available
        console.log('⚽ GOAL SCORED! Celebration time!');
        break;
      
      case 'match_fulltime':
        // Show match summary if available
        if (notification.data?.matchId) {
          console.log('🏁 Match ended! Show summary for match:', notification.data.matchId);
        }
        break;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string) {
    try {
      await api.post(`/players/notifications/${notificationId}/read`);
      this.unreadCount = Math.max(0, this.unreadCount - 1);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      await api.post('/players/notifications/read-all');
      this.unreadCount = 0;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Manually refresh notifications
  async refresh() {
    await this.checkForNewNotifications();
  }

  // Schedule a match reminder notification
  async scheduleMatchReminder(matchId: string, matchTime: Date, homeTeam: string, awayTeam: string) {
    const reminderTime = new Date(matchTime.getTime() - 15 * 60 * 1000); // 15 minutes before
    
    if (reminderTime > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Match Starting Soon!',
          body: `${homeTeam} vs ${awayTeam} kicks off in 15 minutes`,
          data: { matchId, type: 'match_reminder' },
          sound: 'default',
        },
        trigger: { date: reminderTime },
      });
      
      console.log(`⏰ Scheduled reminder for ${homeTeam} vs ${awayTeam}`);
    }
  }

  // Stop polling (when user logs out or app goes to background)
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  // Resume polling (when app comes to foreground)
  resumePolling() {
    if (!this.pollInterval && this.isInitialized) {
      this.startPolling();
    }
  }

  // Cleanup
  cleanup() {
    this.stopPolling();
    this.isInitialized = false;
    this.unreadCount = 0;
    this.lastCheckTime = new Date();
  }
}

// Export singleton instance
export const realtimeNotifications = new RealtimeNotificationService();

// Helper function to format notification time
export function formatNotificationTime(createdAt: string): string {
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
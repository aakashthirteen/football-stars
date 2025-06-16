// Push Notification Service for Real-time Match Updates
// This service handles all notification functionality for the Football Stars app

export interface NotificationData {
  id: string;
  type: 'goal' | 'card' | 'substitution' | 'match_start' | 'match_end' | 'team_invite' | 'match_reminder';
  title: string;
  body: string;
  data?: {
    matchId?: string;
    teamId?: string;
    playerId?: string;
    playerName?: string;
    minute?: number;
    score?: string;
  };
  priority: 'high' | 'normal' | 'low';
  sound?: string;
  channelId?: string;
}

export interface NotificationPreferences {
  matchUpdates: boolean;
  goalNotifications: boolean;
  cardNotifications: boolean;
  substitutionNotifications: boolean;
  teamInvites: boolean;
  matchReminders: boolean;
  sound: boolean;
  vibration: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string;   // HH:mm format
  };
}

class NotificationService {
  private expoPushToken: string | null = null;
  private preferences: NotificationPreferences;
  private notificationListener: any = null;
  private responseListener: any = null;

  constructor() {
    this.preferences = {
      matchUpdates: true,
      goalNotifications: true,
      cardNotifications: true,
      substitutionNotifications: true,
      teamInvites: true,
      matchReminders: true,
      sound: true,
      vibration: true,
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
      },
    };
  }

  /**
   * Initialize notification service
   * This method should be called when the app starts
   */
  async initialize(): Promise<void> {
    try {
      // Request permissions and get push token
      await this.requestPermissions();
      await this.registerForPushNotifications();
      this.setupNotificationListeners();
      
      console.log('🔔 Notification service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
    }
  }

  /**
   * Request notification permissions from the user
   */
  private async requestPermissions(): Promise<boolean> {
    // TODO: Implement with expo-notifications when installed
    // const { status: existingStatus } = await Notifications.getPermissionsAsync();
    // let finalStatus = existingStatus;
    
    // if (existingStatus !== 'granted') {
    //   const { status } = await Notifications.requestPermissionsAsync();
    //   finalStatus = status;
    // }
    
    // if (finalStatus !== 'granted') {
    //   console.warn('⚠️ Notification permissions not granted');
    //   return false;
    // }
    
    console.log('✅ Notification permissions placeholder - ready for expo-notifications');
    return true;
  }

  /**
   * Register device for push notifications and get Expo push token
   */
  private async registerForPushNotifications(): Promise<void> {
    try {
      // TODO: Implement with expo-notifications
      // const token = (await Notifications.getExpoPushTokenAsync()).data;
      // this.expoPushToken = token;
      
      this.expoPushToken = 'mock-expo-token-' + Date.now();
      console.log('📱 Expo push token obtained:', this.expoPushToken);
      
      // Send token to backend for storage
      await this.sendTokenToBackend(this.expoPushToken);
    } catch (error) {
      console.error('❌ Failed to register for push notifications:', error);
    }
  }

  /**
   * Send push token to backend for storage
   */
  private async sendTokenToBackend(token: string): Promise<void> {
    try {
      // TODO: Replace with actual API endpoint
      console.log('🚀 Sending push token to backend:', token);
      
      // const response = await fetch('https://your-backend.com/api/push-tokens', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     token,
      //     platform: Platform.OS,
      //     userId: 'current-user-id', // Get from auth service
      //   }),
      // });
      
    } catch (error) {
      console.error('❌ Failed to send token to backend:', error);
    }
  }

  /**
   * Setup notification listeners for when app is open
   */
  private setupNotificationListeners(): void {
    // TODO: Implement with expo-notifications
    // this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
    //   console.log('🔔 Notification received:', notification);
    //   this.handleInAppNotification(notification);
    // });

    // this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    //   console.log('👆 Notification tapped:', response);
    //   this.handleNotificationTap(response);
    // });
    
    console.log('👂 Notification listeners setup (placeholder)');
  }

  /**
   * Handle notifications when app is in foreground
   */
  private handleInAppNotification(notification: any): void {
    const { type, data } = notification.request.content.data || {};
    
    switch (type) {
      case 'goal':
        this.showInAppGoalNotification(data);
        break;
      case 'card':
        this.showInAppCardNotification(data);
        break;
      case 'substitution':
        this.showInAppSubstitutionNotification(data);
        break;
      default:
        console.log('📢 General notification received');
    }
  }

  /**
   * Handle notification tap/interaction
   */
  private handleNotificationTap(response: any): void {
    const { type, matchId, teamId } = response.notification.request.content.data || {};
    
    // TODO: Navigate to appropriate screen based on notification type
    console.log('🎯 Navigate to:', { type, matchId, teamId });
  }

  /**
   * Show in-app goal notification with celebration
   */
  private showInAppGoalNotification(data: any): void {
    console.log('⚽ GOAL! In-app celebration for:', data);
    // TODO: Show animated goal celebration overlay
  }

  /**
   * Show in-app card notification
   */
  private showInAppCardNotification(data: any): void {
    console.log('🟨🟥 CARD! In-app notification for:', data);
    // TODO: Show card notification banner
  }

  /**
   * Show in-app substitution notification
   */
  private showInAppSubstitutionNotification(data: any): void {
    console.log('🔄 SUBSTITUTION! In-app notification for:', data);
    // TODO: Show substitution notification banner
  }

  /**
   * Send immediate notification for live match events
   */
  async sendLiveMatchNotification(notification: NotificationData): Promise<void> {
    if (!this.shouldSendNotification(notification.type)) {
      console.log('🔇 Notification blocked by user preferences:', notification.type);
      return;
    }

    if (this.isQuietHours()) {
      console.log('😴 Notification blocked by quiet hours');
      return;
    }

    try {
      console.log('📤 Sending live match notification:', notification);
      
      // TODO: Send to Expo push notification service
      // await this.sendToExpoPushService(notification);
      
    } catch (error) {
      console.error('❌ Failed to send live match notification:', error);
    }
  }

  /**
   * Schedule future notification (match reminders, etc.)
   */
  async scheduleNotification(notification: NotificationData, triggerDate: Date): Promise<string> {
    try {
      console.log('⏰ Scheduling notification for:', triggerDate, notification);
      
      // TODO: Implement with expo-notifications
      // const notificationId = await Notifications.scheduleNotificationAsync({
      //   content: {
      //     title: notification.title,
      //     body: notification.body,
      //     data: notification.data,
      //   },
      //   trigger: { date: triggerDate },
      // });
      
      const notificationId = 'scheduled-' + Date.now();
      return notificationId;
      
    } catch (error) {
      console.error('❌ Failed to schedule notification:', error);
      throw error;
    }
  }

  /**
   * Cancel scheduled notification
   */
  async cancelScheduledNotification(notificationId: string): Promise<void> {
    try {
      // TODO: Implement with expo-notifications
      // await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('🗑️ Cancelled scheduled notification:', notificationId);
    } catch (error) {
      console.error('❌ Failed to cancel notification:', error);
    }
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(newPreferences: Partial<NotificationPreferences>): Promise<void> {
    this.preferences = { ...this.preferences, ...newPreferences };
    
    // TODO: Save to AsyncStorage
    console.log('⚙️ Updated notification preferences:', this.preferences);
  }

  /**
   * Get current notification preferences
   */
  getPreferences(): NotificationPreferences {
    return this.preferences;
  }

  /**
   * Check if notification should be sent based on user preferences
   */
  private shouldSendNotification(type: NotificationData['type']): boolean {
    switch (type) {
      case 'goal':
        return this.preferences.goalNotifications;
      case 'card':
        return this.preferences.cardNotifications;
      case 'substitution':
        return this.preferences.substitutionNotifications;
      case 'team_invite':
        return this.preferences.teamInvites;
      case 'match_reminder':
        return this.preferences.matchReminders;
      case 'match_start':
      case 'match_end':
        return this.preferences.matchUpdates;
      default:
        return true;
    }
  }

  /**
   * Check if current time is within quiet hours
   */
  private isQuietHours(): boolean {
    if (!this.preferences.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = this.preferences.quietHours.startTime.split(':').map(Number);
    const [endHour, endMin] = this.preferences.quietHours.endTime.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }
    
    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * Create notification templates for different match events
   */
  createGoalNotification(playerName: string, teamName: string, minute: number, score: string): NotificationData {
    return {
      id: `goal-${Date.now()}`,
      type: 'goal',
      title: `⚽ GOAL! ${teamName}`,
      body: `${playerName} scores in the ${minute}' minute! Score: ${score}`,
      data: {
        playerName,
        minute,
        score,
      },
      priority: 'high',
      sound: 'goal_celebration.wav',
      channelId: 'match_events',
    };
  }

  createCardNotification(playerName: string, teamName: string, cardType: 'yellow' | 'red', minute: number): NotificationData {
    const emoji = cardType === 'yellow' ? '🟨' : '🟥';
    const cardText = cardType === 'yellow' ? 'Yellow Card' : 'Red Card';
    
    return {
      id: `card-${Date.now()}`,
      type: 'card',
      title: `${emoji} ${cardText} - ${teamName}`,
      body: `${playerName} receives a ${cardType} card in the ${minute}' minute`,
      data: {
        playerName,
        minute,
        cardType,
      },
      priority: 'normal',
      sound: 'card_whistle.wav',
      channelId: 'match_events',
    };
  }

  createSubstitutionNotification(playerOut: string, playerIn: string, teamName: string, minute: number): NotificationData {
    return {
      id: `substitution-${Date.now()}`,
      type: 'substitution',
      title: `🔄 Substitution - ${teamName}`,
      body: `${playerOut} comes off for ${playerIn} in the ${minute}' minute`,
      data: {
        playerOut,
        playerIn,
        minute,
      },
      priority: 'normal',
      sound: 'substitution.wav',
      channelId: 'match_events',
    };
  }

  createMatchReminderNotification(homeTeam: string, awayTeam: string, kickoffTime: Date): NotificationData {
    return {
      id: `reminder-${Date.now()}`,
      type: 'match_reminder',
      title: `⚽ Match Starting Soon!`,
      body: `${homeTeam} vs ${awayTeam} kicks off in 15 minutes`,
      data: {
        homeTeam,
        awayTeam,
        kickoffTime: kickoffTime.toISOString(),
      },
      priority: 'high',
      sound: 'match_reminder.wav',
      channelId: 'match_reminders',
    };
  }

  /**
   * Cleanup notification service
   */
  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
    console.log('🧹 Notification service cleaned up');
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export notification templates for easy use
export const NotificationTemplates = {
  goal: (playerName: string, teamName: string, minute: number, score: string) =>
    notificationService.createGoalNotification(playerName, teamName, minute, score),
  
  yellowCard: (playerName: string, teamName: string, minute: number) =>
    notificationService.createCardNotification(playerName, teamName, 'yellow', minute),
  
  redCard: (playerName: string, teamName: string, minute: number) =>
    notificationService.createCardNotification(playerName, teamName, 'red', minute),
  
  substitution: (playerOut: string, playerIn: string, teamName: string, minute: number) =>
    notificationService.createSubstitutionNotification(playerOut, playerIn, teamName, minute),
  
  matchReminder: (homeTeam: string, awayTeam: string, kickoffTime: Date) =>
    notificationService.createMatchReminderNotification(homeTeam, awayTeam, kickoffTime),
};
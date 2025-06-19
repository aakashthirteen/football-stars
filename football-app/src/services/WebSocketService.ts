import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './api';

interface MatchTimerState {
  matchId: string;
  currentMinute: number;
  currentSecond: number;
  status: 'SCHEDULED' | 'LIVE' | 'HALFTIME' | 'COMPLETED';
  currentHalf: 1 | 2;
  addedTimeFirstHalf: number;
  addedTimeSecondHalf: number;
  isPaused: boolean;
  serverTime: number;
  isLive: boolean;
  isHalftime: boolean;
  automaticHalftimeTriggered: boolean;
  automaticFulltimeTriggered: boolean;
  matchDuration: number;
  halfDuration: number;
}

interface MatchTimerUpdate {
  type: 'TIMER_UPDATE' | 'STATUS_CHANGE' | 'HALF_TIME' | 'FULL_TIME' | 'MATCH_END';
  matchId: string;
  timerState: MatchTimerState;
  message?: string;
}

interface WebSocketMessage {
  type: 'MATCH_TIMER_UPDATE' | 'MATCH_EVENT' | 'MATCH_STATE' | 'PING' | 'PONG' | 'CONNECTION_ESTABLISHED';
  data?: any;
  matchId?: string;
  timerState?: MatchTimerState;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // Start with 1 second
  private subscribedMatches = new Set<string>();
  private timerUpdateCallbacks = new Map<string, (update: MatchTimerUpdate) => void>();
  private isConnecting = false;

  // Get WebSocket URL from API base URL
  private getWebSocketUrl(): string {
    // Remove /api from the end and replace http with ws
    const baseUrl = API_BASE_URL.replace(/\/api$/, '').replace(/^http/, 'ws');
    return `${baseUrl}/ws`;
  }

  async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    try {
      this.isConnecting = true;
      console.log('🔌 WebSocket: Connecting to professional timer service...');
      
      // Get auth token for WebSocket authentication (optional for testing)
      const token = await AsyncStorage.getItem('auth_token');
      const baseWsUrl = this.getWebSocketUrl();
      
      // Use token if available, otherwise connect without auth (for testing)
      const wsUrl = token ? `${baseWsUrl}?token=${encodeURIComponent(token)}` : baseWsUrl;
      console.log('🔌 WebSocket: Connecting to:', baseWsUrl, token ? '(with auth)' : '(no auth - testing mode)');
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket: Connected to professional timer service');
        console.log('🔌 WebSocket: Connection established successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        
        // Authentication handled via query parameter
        
        // Start ping-pong to keep connection alive
        this.startPingPong();
        
        // Re-subscribe to all matches
        this.resubscribeToMatches();
      };

      this.ws.onmessage = (event) => {
        try {
          console.log('📨 WebSocket: Received raw message:', event.data);
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 WebSocket: Parsed message:', message);
          this.handleMessage(message);
        } catch (error) {
          console.error('❌ WebSocket: Failed to parse message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket: Connection closed', event.code, event.reason);
        this.isConnecting = false;
        this.cleanup();
        
        // Attempt to reconnect unless it was a manual close
        if (event.code !== 1000) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket: Connection error:', error);
        this.isConnecting = false;
      };

    } catch (error) {
      console.error('❌ WebSocket: Failed to connect:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'MATCH_TIMER_UPDATE':
        this.handleTimerUpdate(message.data as MatchTimerUpdate);
        break;
      case 'MATCH_STATE':
        if (message.matchId && message.timerState) {
          // Convert MATCH_STATE to a timer update format
          const update: MatchTimerUpdate = {
            type: 'TIMER_UPDATE',
            matchId: message.matchId,
            timerState: message.timerState
          };
          this.handleTimerUpdate(update);
        }
        break;
      case 'PING':
        this.sendPong();
        break;
      case 'PONG':
        // Server responded to our ping
        break;
      case 'CONNECTION_ESTABLISHED':
        console.log('✅ WebSocket: Connection confirmed by server');
        break;
      default:
        console.log('🔌 WebSocket: Unknown message type:', message.type);
    }
  }

  private handleTimerUpdate(update: MatchTimerUpdate): void {
    console.log('⏱️ WebSocket: Received timer update:', update);
    
    // Call the registered callback for this match
    const callback = this.timerUpdateCallbacks.get(update.matchId);
    if (callback) {
      callback(update);
    }
  }

  private startPingPong(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'PING' }));
      }
    }, 30000); // Ping every 30 seconds
  }

  private sendPong(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'PONG' }));
    }
  }

  private resubscribeToMatches(): void {
    for (const matchId of this.subscribedMatches) {
      this.subscribeToMatch(matchId);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ WebSocket: Max reconnection attempts reached');
      return;
    }

    console.log(`🔄 WebSocket: Scheduling reconnect in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30 seconds
      this.connect();
    }, this.reconnectDelay);
  }

  private cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  subscribeToMatch(matchId: string, callback?: (update: MatchTimerUpdate) => void): void {
    console.log('📡 WebSocket: Subscribing to match timer:', matchId);
    console.log('📡 WebSocket: Connection status:', this.getConnectionStatus());
    
    this.subscribedMatches.add(matchId);
    
    if (callback) {
      this.timerUpdateCallbacks.set(matchId, callback);
      console.log('📡 WebSocket: Added callback for match:', matchId);
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const subscribeMessage = {
        type: 'SUBSCRIBE_MATCH',
        matchId: matchId,
      };
      console.log('📡 WebSocket: Sending subscription message:', subscribeMessage);
      this.ws.send(JSON.stringify(subscribeMessage));
      
      // Also request current match state immediately
      setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const stateRequest = {
            type: 'GET_MATCH_STATE',
            matchId: matchId,
          };
          console.log('📡 WebSocket: Requesting current match state:', stateRequest);
          this.ws.send(JSON.stringify(stateRequest));
        }
      }, 1000); // Wait 1 second after subscription
    } else {
      console.log('📡 WebSocket: Not connected, attempting to connect first...');
      // If not connected, connect first
      this.connect();
    }
  }

  unsubscribeFromMatch(matchId: string): void {
    console.log('📡 WebSocket: Unsubscribing from match timer:', matchId);
    
    this.subscribedMatches.delete(matchId);
    this.timerUpdateCallbacks.delete(matchId);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'UNSUBSCRIBE_MATCH',
        matchId: matchId,
      }));
    }
  }

  disconnect(): void {
    console.log('🔌 WebSocket: Manually disconnecting');
    
    this.cleanup();
    this.subscribedMatches.clear();
    this.timerUpdateCallbacks.clear();
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // Get current connection status
  getConnectionStatus(): string {
    if (!this.ws) return 'DISCONNECTED';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'CONNECTED';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'DISCONNECTED';
      default: return 'UNKNOWN';
    }
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export type { MatchTimerUpdate };
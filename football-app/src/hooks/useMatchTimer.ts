import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TimerState {
  currentMinute: number;
  currentSecond: number;
  displayTime: string;
  displayMinute: string;
  status: 'SCHEDULED' | 'LIVE' | 'HALFTIME' | 'COMPLETED';
  currentHalf: 1 | 2;
  isHalftime: boolean;
  isPaused: boolean;
  halftimeBreakRemaining?: number;
  addedTimeFirstHalf: number;
  addedTimeSecondHalf: number;
  serverTime: number;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

interface SSEUpdate {
  type: string;
  matchId: string;
  timestamp: number;
  state: {
    currentMinute: number;
    currentSecond: number;
    totalSeconds: number;
    status: string;
    currentHalf: number;
    isHalftime: boolean;
    isPaused: boolean;
    halftimeBreakRemaining?: number;
    addedTimeFirstHalf: number;
    addedTimeSecondHalf: number;
    serverTime: number;
  };
  message?: string;
}

/**
 * Professional match timer hook using Server-Sent Events
 * Provides real-time timer updates with client-side interpolation
 */
export function useMatchTimer(matchId: string) {
  const [timerState, setTimerState] = useState<TimerState>({
    currentMinute: 0,
    currentSecond: 0,
    displayTime: '00:00',
    displayMinute: '0\'',
    status: 'SCHEDULED',
    currentHalf: 1,
    isHalftime: false,
    isPaused: false,
    addedTimeFirstHalf: 0,
    addedTimeSecondHalf: 0,
    serverTime: Date.now(),
    connectionStatus: 'connecting'
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const interpolationRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const reconnectAttemptsRef = useRef<number>(0);

  // Format time for display
  const formatTime = useCallback((minutes: number, seconds: number): string => {
    const displayMinutes = String(Math.floor(minutes)).padStart(2, '0');
    const displaySeconds = String(Math.floor(seconds)).padStart(2, '0');
    return `${displayMinutes}:${displaySeconds}`;
  }, []);

  // Format minute display (e.g., "45+2'")
  const formatMinuteDisplay = useCallback((state: TimerState): string => {
    const { currentMinute, currentHalf, addedTimeFirstHalf, addedTimeSecondHalf } = state;
    const halfDuration = 45; // TODO: Get from match config
    
    let displayMinute = currentMinute;
    let addedTime = 0;
    
    if (currentHalf === 1 && currentMinute >= halfDuration) {
      addedTime = currentMinute - halfDuration;
      displayMinute = halfDuration;
    } else if (currentHalf === 2 && currentMinute >= 90) {
      addedTime = currentMinute - 90;
      displayMinute = 90;
    }
    
    if (addedTime > 0) {
      return `${displayMinute}+${addedTime}'`;
    }
    
    return `${displayMinute}'`;
  }, []);

  // Handle SSE updates
  const handleSSEUpdate = useCallback((data: SSEUpdate) => {
    lastUpdateRef.current = Date.now();
    reconnectAttemptsRef.current = 0; // Reset on successful update
    
    // Update state with server data
    setTimerState(prev => ({
      ...prev,
      currentMinute: data.state.currentMinute,
      currentSecond: data.state.currentSecond,
      displayTime: formatTime(data.state.currentMinute, data.state.currentSecond),
      displayMinute: formatMinuteDisplay({
        ...prev,
        currentMinute: data.state.currentMinute,
        currentHalf: data.state.currentHalf as 1 | 2,
        addedTimeFirstHalf: data.state.addedTimeFirstHalf,
        addedTimeSecondHalf: data.state.addedTimeSecondHalf
      }),
      status: data.state.status as TimerState['status'],
      currentHalf: data.state.currentHalf as 1 | 2,
      isHalftime: data.state.isHalftime,
      isPaused: data.state.isPaused,
      halftimeBreakRemaining: data.state.halftimeBreakRemaining,
      addedTimeFirstHalf: data.state.addedTimeFirstHalf,
      addedTimeSecondHalf: data.state.addedTimeSecondHalf,
      serverTime: data.state.serverTime,
      connectionStatus: 'connected'
    }));
    
    // Start interpolation for smooth display
    if (data.state.status === 'LIVE' && !data.state.isPaused && !data.state.isHalftime) {
      startInterpolation(data.state.totalSeconds);
    } else {
      stopInterpolation();
    }
  }, [formatTime, formatMinuteDisplay]);

  // Client-side interpolation for smooth timer
  const startInterpolation = useCallback((serverTotalSeconds: number) => {
    // Clear existing interpolation
    stopInterpolation();
    
    let localTotalSeconds = serverTotalSeconds;
    const startTime = Date.now();
    
    interpolationRef.current = setInterval(() => {
      // Calculate elapsed time since last server update
      const elapsed = (Date.now() - startTime) / 1000;
      const currentTotalSeconds = serverTotalSeconds + elapsed;
      
      const displayMinute = Math.floor(currentTotalSeconds / 60);
      const displaySecond = Math.floor(currentTotalSeconds % 60);
      
      setTimerState(prev => ({
        ...prev,
        displayTime: formatTime(displayMinute, displaySecond),
        displayMinute: formatMinuteDisplay({
          ...prev,
          currentMinute: displayMinute
        })
      }));
    }, 100); // Update every 100ms for smooth display
  }, [formatTime, formatMinuteDisplay]);

  const stopInterpolation = useCallback(() => {
    if (interpolationRef.current) {
      clearInterval(interpolationRef.current);
      interpolationRef.current = null;
    }
  }, []);

  // Connect to SSE
  const connectSSE = useCallback(async () => {
    try {
      // Get auth token
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('❌ SSE: No auth token available');
        setTimerState(prev => ({ ...prev, connectionStatus: 'error' }));
        return;
      }

      // EventSource in React Native may not support custom headers properly
      // Let's try both approaches: headers and query parameter
      const url = `${API_BASE_URL}/sse/${matchId}/timer-stream`;
      const urlWithToken = `${url}?token=${encodeURIComponent(token)}`;
      
      console.log(`📡 SSE: Connecting to ${url}`);
      console.log(`🔑 SSE: Using token: ${token.substring(0, 20)}...`);
      
      // Try with headers first
      const eventSource = new EventSource(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('✅ SSE: Connection established successfully');
        setTimerState(prev => ({ ...prev, connectionStatus: 'connected' }));
      };

      eventSource.onmessage = (event) => {
        console.log('📨 SSE: Received message:', event.data);
        try {
          const data = JSON.parse(event.data) as SSEUpdate;
          console.log('🔄 SSE: Parsed data:', data);
          handleSSEUpdate(data);
        } catch (error) {
          console.error('❌ SSE: Failed to parse data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ SSE: Connection error:', error);
        setTimerState(prev => ({ ...prev, connectionStatus: 'disconnected' }));
        
        // Try query parameter approach if this is the first attempt
        if (reconnectAttemptsRef.current === 0) {
          console.log('🔄 SSE: Trying query parameter authentication...');
          reconnectAttemptsRef.current++;
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            eventSource.close();
            connectSSEWithQueryToken();
          }, 1000);
          return;
        }
        
        // Exponential backoff reconnection
        const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current++;
        
        console.log(`🔄 SSE: Reconnecting in ${backoffDelay}ms (attempt ${reconnectAttemptsRef.current})`);
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          eventSource.close();
          connectSSE();
        }, backoffDelay);
      };
    } catch (error) {
      console.error('Failed to connect SSE:', error);
      setTimerState(prev => ({ ...prev, connectionStatus: 'error' }));
    }
  }, [matchId, handleSSEUpdate]);

  // Alternative connection method using query parameter for token
  const connectSSEWithQueryToken = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('❌ SSE: No auth token available for query method');
        setTimerState(prev => ({ ...prev, connectionStatus: 'error' }));
        return;
      }

      const url = `${API_BASE_URL}/sse/${matchId}/timer-stream?token=${encodeURIComponent(token)}`;
      console.log(`📡 SSE: Connecting with query token to ${API_BASE_URL}/sse/${matchId}/timer-stream`);
      
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('✅ SSE: Query token connection established successfully');
        setTimerState(prev => ({ ...prev, connectionStatus: 'connected' }));
      };

      eventSource.onmessage = (event) => {
        console.log('📨 SSE: Received message (query method):', event.data);
        try {
          const data = JSON.parse(event.data) as SSEUpdate;
          console.log('🔄 SSE: Parsed data (query method):', data);
          handleSSEUpdate(data);
        } catch (error) {
          console.error('❌ SSE: Failed to parse data (query method):', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ SSE: Query token connection error:', error);
        setTimerState(prev => ({ ...prev, connectionStatus: 'disconnected' }));
        
        // Continue with normal exponential backoff
        const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current++;
        
        console.log(`🔄 SSE: Reconnecting with query token in ${backoffDelay}ms`);
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          eventSource.close();
          connectSSEWithQueryToken();
        }, backoffDelay);
      };
    } catch (error) {
      console.error('❌ SSE: Failed to connect with query token:', error);
      setTimerState(prev => ({ ...prev, connectionStatus: 'error' }));
    }
  }, [matchId, handleSSEUpdate]);

  // Effect to manage SSE connection
  useEffect(() => {
    if (!matchId) return;

    connectSSE();

    // Cleanup
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      stopInterpolation();
    };
  }, [matchId, connectSSE, stopInterpolation]);

  // Monitor connection health
  useEffect(() => {
    const healthCheck = setInterval(() => {
      const timeSinceLastUpdate = Date.now() - lastUpdateRef.current;
      
      // If no update for 10 seconds, consider connection unhealthy
      if (timeSinceLastUpdate > 10000 && timerState.status === 'LIVE') {
        console.warn('⚠️ No timer updates for 10 seconds, connection may be unhealthy');
        setTimerState(prev => ({ ...prev, connectionStatus: 'disconnected' }));
      }
    }, 5000);

    return () => clearInterval(healthCheck);
  }, [timerState.status]);

  return {
    ...timerState,
    isConnected: timerState.connectionStatus === 'connected',
    reconnect: connectSSE
  };
}

// Helper hook for halftime break countdown display
export function useHalftimeBreakDisplay(breakRemaining?: number) {
  const formatBreakTime = useCallback((seconds?: number): string => {
    if (!seconds || seconds <= 0) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  return {
    breakTimeDisplay: formatBreakTime(breakRemaining),
    breakMinutesRemaining: breakRemaining ? Math.floor(breakRemaining / 60) : 0,
    isBreakEnding: breakRemaining ? breakRemaining <= 60 : false
  };
}

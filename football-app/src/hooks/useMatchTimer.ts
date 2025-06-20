import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL, apiService } from '../services/api';
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

      console.log(`📡 SSE: Attempting to connect to timer stream for match: ${matchId}`);
      console.log(`🔑 SSE: Token available: ${token.substring(0, 20)}...${token.substring(token.length - 5)}`);
      console.log(`🌐 SSE: API Base URL: ${API_BASE_URL}`);
      console.log(`🔍 SSE: EventSource available:`, typeof EventSource !== 'undefined');
      console.log(`🔍 SSE: EventSource constructor:`, EventSource);
      console.log(`🔍 SSE: EventSource global:`, global.EventSource);

      // React Native EventSource doesn't support custom headers properly
      // Use query parameter method for authentication
      const url = `${API_BASE_URL}/sse/${matchId}/timer-stream?token=${encodeURIComponent(token)}`;
      
      console.log(`📡 SSE: Full connection URL: ${url.replace(token, 'TOKEN_HIDDEN')}`);
      
      // Close any existing connection first
      if (eventSourceRef.current) {
        console.log('🔄 SSE: Closing existing connection');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // Set connecting status
      setTimerState(prev => ({ ...prev, connectionStatus: 'connecting' }));
      
      // Create new EventSource connection
      console.log('🚀 SSE: Creating new EventSource connection...');
      console.log('🔍 SSE: EventSource constructor available:', typeof EventSource !== 'undefined');
      
      try {
        const eventSource = new EventSource(url);
        console.log('✅ SSE: EventSource created successfully');
        console.log('🔍 SSE: Initial readyState:', eventSource.readyState);
        console.log('🔍 SSE: Event source properties:', {
          url: eventSource.url,
          readyState: eventSource.readyState,
          withCredentials: eventSource.withCredentials
        });
        eventSourceRef.current = eventSource;
      } catch (error) {
        console.error('❌ SSE: Failed to create EventSource:', error);
        setTimerState(prev => ({ ...prev, connectionStatus: 'error' }));
        return;
      }

      // Get reference to the event source
      const currentEventSource = eventSourceRef.current;
      
      // Set up connection timeout
      const connectionTimeout = setTimeout(() => {
        console.warn('⚠️ SSE: Connection timeout after 10 seconds');
        if (currentEventSource && currentEventSource.readyState !== EventSource.OPEN) {
          currentEventSource.close();
          setTimerState(prev => ({ ...prev, connectionStatus: 'error' }));
        }
      }, 10000);

      eventSource.onopen = (event) => {
        clearTimeout(connectionTimeout);
        console.log('✅ SSE: Connection established successfully!');
        console.log('🔍 SSE: Connection event:', event);
        console.log('🔍 SSE: ReadyState:', eventSource.readyState);
        setTimerState(prev => ({ ...prev, connectionStatus: 'connected' }));
        reconnectAttemptsRef.current = 0; // Reset reconnect counter on successful connection
      };

      eventSource.onmessage = (event) => {
        console.log('📨 SSE: Received message:', event.data);
        console.log('📨 SSE: Message type:', event.type);
        console.log('📨 SSE: Last event ID:', event.lastEventId);
        try {
          const data = JSON.parse(event.data) as SSEUpdate;
          console.log('🔄 SSE: Parsed data:', JSON.stringify(data, null, 2));
          handleSSEUpdate(data);
        } catch (error) {
          console.error('❌ SSE: Failed to parse data:', error);
          console.error('❌ SSE: Raw data was:', event.data);
        }
      };

      eventSource.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error('❌ SSE: Connection error occurred');
        console.error('❌ SSE: Error event:', error);
        console.error('❌ SSE: ReadyState:', eventSource.readyState);
        console.error('❌ SSE: URL was:', url.replace(token, 'TOKEN_HIDDEN'));
        
        setTimerState(prev => ({ ...prev, connectionStatus: 'disconnected' }));
        
        // Exponential backoff reconnection
        const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current++;
        
        console.log(`🔄 SSE: Scheduling reconnection in ${backoffDelay}ms (attempt ${reconnectAttemptsRef.current})`);
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 SSE: Executing reconnection attempt...');
          eventSource.close();
          connectSSE();
        }, backoffDelay);
      };

      // Log the readyState periodically for debugging
      const readyStateLogger = setInterval(() => {
        console.log(`🔍 SSE: ReadyState check - ${eventSource.readyState} (0=CONNECTING, 1=OPEN, 2=CLOSED)`);
        if (eventSource.readyState === EventSource.CLOSED) {
          clearInterval(readyStateLogger);
        }
      }, 2000);

      // Clean up readyState logger after 30 seconds
      setTimeout(() => clearInterval(readyStateLogger), 30000);

    } catch (error) {
      console.error('❌ SSE: Exception during connection setup:', error);
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

  // Fallback timer when SSE connection fails
  const startFallbackTimer = useCallback(async () => {
    try {
      console.log('🔄 Starting fallback timer for match:', matchId);
      
      // Get match data from API to calculate time from start
      const match = await apiService.getMatchById(matchId);
      if (!match || match.status !== 'LIVE') return;
      
      const matchStartTime = new Date(match.timer_started_at || match.match_date).getTime();
      const halfDuration = (match.duration || 90) / 2;
      
      const fallbackInterval = setInterval(() => {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - matchStartTime) / 1000);
        const elapsedMinutes = Math.floor(elapsedSeconds / 60);
        const currentSecond = elapsedSeconds % 60;
        
        // Determine current half and adjust time
        let currentHalf: 1 | 2 = 1;
        let displayMinute = elapsedMinutes;
        
        if (elapsedMinutes >= halfDuration) {
          currentHalf = 2;
          // For second half, continue from where first half left off
          displayMinute = elapsedMinutes;
        }
        
        setTimerState(prev => ({
          ...prev,
          currentMinute: displayMinute,
          currentSecond: currentSecond,
          displayTime: formatTime(displayMinute, currentSecond),
          displayMinute: `${displayMinute}'`,
          currentHalf,
          serverTime: now,
          connectionStatus: 'disconnected' // Show we're in fallback mode
        }));
      }, 1000);
      
      // Store interval reference for cleanup
      interpolationRef.current = fallbackInterval;
      
    } catch (error) {
      console.error('❌ Failed to start fallback timer:', error);
    }
  }, [matchId, formatTime]);

  // Monitor connection health and start fallback if needed
  useEffect(() => {
    const healthCheck = setInterval(() => {
      const timeSinceLastUpdate = Date.now() - lastUpdateRef.current;
      
      // If no update for 10 seconds, consider connection unhealthy
      if (timeSinceLastUpdate > 10000 && timerState.status === 'LIVE') {
        console.warn('⚠️ No timer updates for 10 seconds, starting fallback timer');
        setTimerState(prev => ({ ...prev, connectionStatus: 'disconnected' }));
        
        // Start fallback timer if not already running
        if (!interpolationRef.current) {
          startFallbackTimer();
        }
      }
    }, 5000);

    return () => clearInterval(healthCheck);
  }, [timerState.status, startFallbackTimer]);

  // Test SSE endpoint accessibility
  const testSSEEndpoint = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('❌ SSE Test: No token available');
        return;
      }

      console.log('🧪 SSE Test: Testing endpoint accessibility...');
      
      // Test regular HTTP request to SSE endpoint to check if it's reachable
      const testUrl = `${API_BASE_URL}/sse/${matchId}/timer-stream?token=${encodeURIComponent(token)}`;
      
      fetch(testUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      })
      .then(response => {
        console.log('🧪 SSE Test: Response status:', response.status);
        console.log('🧪 SSE Test: Response headers:', response.headers);
        console.log('🧪 SSE Test: Response ok:', response.ok);
        
        if (response.ok) {
          console.log('✅ SSE Test: Endpoint is reachable via fetch');
        } else {
          console.error('❌ SSE Test: Endpoint returned error status:', response.status);
        }
      })
      .catch(error => {
        console.error('❌ SSE Test: Fetch failed:', error);
      });

    } catch (error) {
      console.error('❌ SSE Test: Exception:', error);
    }
  }, [matchId]);

  return {
    ...timerState,
    isConnected: timerState.connectionStatus === 'connected',
    reconnect: connectSSE,
    testSSEEndpoint // Expose for debugging
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

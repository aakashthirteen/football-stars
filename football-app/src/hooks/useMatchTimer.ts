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

  // Connect to SSE (optional enhancement - polling is primary)
  const connectSSE = useCallback(async () => {
    try {
      // Check if EventSource is available
      if (typeof EventSource === 'undefined' && typeof global.EventSource === 'undefined') {
        console.warn('⚠️ SSE: EventSource not available, using polling only');
        setTimerState(prev => ({ ...prev, connectionStatus: 'disconnected' }));
        startPollingFallback();
        return;
      }

      // Get auth token
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('❌ SSE: No auth token available, falling back to polling');
        setTimerState(prev => ({ ...prev, connectionStatus: 'disconnected' }));
        startPollingFallback();
        return;
      }

      console.log(`📡 SSE: Attempting to connect to timer stream for match: ${matchId}`);

      // Use modern event-source-polyfill with header support
      const url = `${API_BASE_URL}/sse/${matchId}/timer-stream`;
      
      console.log(`📡 SSE: Full connection URL: ${url}`);
      
      // Close any existing connection first
      if (eventSourceRef.current) {
        console.log('🔄 SSE: Closing existing connection');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // Set connecting status
      setTimerState(prev => ({ ...prev, connectionStatus: 'connecting' }));
      
      // Create new EventSource connection with headers
      console.log('🚀 SSE: Creating new EventSource connection with headers...');
      console.log('🔍 SSE: EventSource constructor available:', typeof EventSource !== 'undefined');
      
      try {
        // Try with headers first (modern polyfill)
        const eventSource = new EventSource(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache'
          }
        });
        console.log('✅ SSE: EventSource created successfully with headers');
        eventSourceRef.current = eventSource;
      } catch (error) {
        console.warn('⚠️ SSE: Headers not supported, trying query parameter method');
        try {
          // Fallback to query parameter method
          const fallbackUrl = `${url}?token=${encodeURIComponent(token)}`;
          const eventSource = new EventSource(fallbackUrl);
          console.log('✅ SSE: EventSource created with query parameter auth');
          eventSourceRef.current = eventSource;
        } catch (fallbackError) {
          console.warn('⚠️ SSE: EventSource creation failed, using polling only:', fallbackError);
          setTimerState(prev => ({ ...prev, connectionStatus: 'disconnected' }));
          startPollingFallback();
          return;
        }
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
      }, 1000);

      // Clean up readyState logger after 30 seconds
      setTimeout(() => clearInterval(readyStateLogger), 30000);

    } catch (error) {
      console.warn('⚠️ SSE: Exception during connection setup, falling back to polling:', error);
      setTimerState(prev => ({ ...prev, connectionStatus: 'disconnected' }));
      startPollingFallback();
    }
  }, [matchId, handleSSEUpdate, startPollingFallback]);


  // Effect to manage timer connection - try SSE first, fallback to polling quickly
  useEffect(() => {
    if (!matchId) return;

    console.log('🚀 Timer Hook: Starting connection for match:', matchId);
    
    // For now, use polling-only mode to ensure reliability
    console.log('⚡ Using polling-only mode for maximum reliability');
    startPollingFallback();
    
    // Optionally try SSE as enhancement (commented out for stability)
    // connectSSE();
    
    // Also start polling fallback immediately as backup (will be replaced if SSE works)
    const backupPollingTimeout = setTimeout(() => {
      if (timerState.connectionStatus === 'connecting' || timerState.status === undefined) {
        console.log('⚡ Starting backup polling since SSE taking too long or timer not initialized');
        startPollingFallback();
      }
    }, 1000); // Start polling backup after 1 second
    
    // Even more aggressive - start polling immediately if timer status is undefined
    const immediatePollingCheck = setTimeout(() => {
      if (timerState.status === undefined || timerState.status === 'SCHEDULED') {
        console.log('🚨 IMMEDIATE: Timer status undefined/SCHEDULED - forcing polling start');
        startPollingFallback();
      }
    }, 500); // Check after 500ms

    // Cleanup
    return () => {
      clearTimeout(backupPollingTimeout);
      clearTimeout(immediatePollingCheck);
      
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
  }, [matchId, connectSSE, stopInterpolation, startPollingFallback]);

  // Enhanced polling fallback system
  const startPollingFallback = useCallback(async () => {
    try {
      console.log('🔄 Starting polling fallback for match:', matchId);
      setTimerState(prev => ({ ...prev, connectionStatus: 'disconnected' }));
      
      // Clear any existing intervals
      if (interpolationRef.current) {
        clearInterval(interpolationRef.current);
        interpolationRef.current = null;
      }
      
      // Poll server every 2 seconds for timer state
      const pollingInterval = setInterval(async () => {
        try {
          // Get match data from API
          const response = await apiService.getMatchById(matchId);
          const match = response?.match;
          if (!match) {
            console.warn('⚠️ Polling: Match not found, stopping polling');
            clearInterval(pollingInterval);
            return;
          }
          
          // console.log('📊 Polling: Timer data fetched:', {
          //   status: match.status,
          //   timerStartedAt: match.timer_started_at,
          //   matchDate: match.match_date
          // });
          
          // Only stop polling for completed matches, keep polling for SCHEDULED and HALFTIME
          if (match.status === 'COMPLETED') {
            console.log('📊 Polling: Match completed, stopping polling');
            clearInterval(pollingInterval);
            setTimerState(prev => ({ 
              ...prev, 
              status: 'COMPLETED',
              connectionStatus: 'disconnected' 
            }));
            return;
          }
          
          // Update timer state with current match status (SCHEDULED, LIVE, HALFTIME)
          if (match.status !== timerState.status) {
            console.log(`📊 Polling: Match status changed from ${timerState.status} to ${match.status}`);
          }
          
          // For SCHEDULED matches, just update status without timer calculation
          if (match.status === 'SCHEDULED') {
            setTimerState(prev => ({
              ...prev,
              status: 'SCHEDULED',
              currentMinute: 0,
              currentSecond: 0,
              displayTime: '00:00',
              displayMinute: '0\'',
              connectionStatus: 'disconnected'
            }));
            return;
          }
          
          // Calculate timer from match start time for LIVE/HALFTIME matches
          const startTime = new Date(match.timer_started_at || match.match_date).getTime();
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - startTime) / 1000);
          const elapsedMinutes = Math.floor(elapsedSeconds / 60);
          const currentSecond = elapsedSeconds % 60;
          const halfDuration = (match.duration || 90) / 2;
          
          // Determine current half
          let currentHalf: 1 | 2 = 1;
          let adjustedMinute = elapsedMinutes;
          
          // Handle second half timing
          if (match.second_half_started_at) {
            const secondHalfStart = new Date(match.second_half_started_at).getTime();
            const secondHalfElapsed = Math.floor((now - secondHalfStart) / 1000);
            currentHalf = 2;
            adjustedMinute = Math.floor(halfDuration) + Math.floor(secondHalfElapsed / 60);
          } else if (elapsedMinutes >= halfDuration) {
            // Should be halftime, but check server state
            if (match.status === 'HALFTIME') {
              setTimerState(prev => ({ 
                ...prev, 
                status: 'HALFTIME',
                isHalftime: true,
                currentMinute: Math.floor(halfDuration),
                currentSecond: 0,
                displayTime: formatTime(Math.floor(halfDuration), 0),
                displayMinute: `HT`,
                connectionStatus: 'disconnected'
              }));
              return;
            }
          }
          
          // Update timer state with polling data
          setTimerState(prev => ({
            ...prev,
            currentMinute: adjustedMinute,
            currentSecond: currentSecond,
            displayTime: formatTime(adjustedMinute, currentSecond),
            displayMinute: formatMinuteDisplay({
              ...prev,
              currentMinute: adjustedMinute,
              currentHalf: currentHalf,
              addedTimeFirstHalf: match.added_time_first_half || 0,
              addedTimeSecondHalf: match.added_time_second_half || 0
            }),
            status: match.status as TimerState['status'],
            currentHalf: currentHalf,
            isHalftime: match.status === 'HALFTIME',
            isPaused: match.status === 'HALFTIME',
            addedTimeFirstHalf: match.added_time_first_half || 0,
            addedTimeSecondHalf: match.added_time_second_half || 0,
            serverTime: now,
            connectionStatus: 'disconnected' // Indicates we're using polling
          }));
          
          // console.log(`📊 Polling: Timer updated - ${adjustedMinute}:${currentSecond.toString().padStart(2, '0')}`);
          
        } catch (pollingError) {
          console.error('❌ Polling error:', pollingError);
          // Don't stop polling on single error, just log it
        }
      }, 1000); // Poll every 1 second
      
      // Store interval reference for cleanup
      interpolationRef.current = pollingInterval;
      
    } catch (error) {
      console.error('❌ Failed to start polling fallback:', error);
    }
  }, [matchId, formatTime, formatMinuteDisplay]);

  // Enhanced connection health monitoring with faster polling fallback
  useEffect(() => {
    const healthCheck = setInterval(() => {
      const timeSinceLastUpdate = Date.now() - lastUpdateRef.current;
      
      // Much more aggressive fallback - if SSE hasn't connected after 3 seconds, switch to polling
      const isConnectionStalled = timeSinceLastUpdate > 3000 && timerState.connectionStatus === 'connecting';
      const isUpdateStalled = timeSinceLastUpdate > 5000 && timerState.status === 'LIVE' && timerState.connectionStatus === 'connected';
      const isTimerNotStarted = timerState.status === undefined && timerState.connectionStatus === 'disconnected';
      
      if (isConnectionStalled || isUpdateStalled || isTimerNotStarted) {
        console.warn('⚠️ SSE connection failed or timer not started, switching to polling fallback');
        
        // Close any existing SSE connection
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        
        // Start polling fallback immediately
        if (!interpolationRef.current || timerState.connectionStatus !== 'disconnected') {
          console.log('🔄 Starting enhanced polling fallback for reliable timer updates');
          startPollingFallback();
        }
      }
    }, 1000); // Check every 1 second for faster response

    return () => clearInterval(healthCheck);
  }, [timerState.status, timerState.connectionStatus, startPollingFallback]);

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
    isPolling: timerState.connectionStatus === 'disconnected',
    reconnect: connectSSE,
    startPolling: startPollingFallback,
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

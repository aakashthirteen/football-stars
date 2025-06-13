import NetInfo from '@react-native-community/netinfo';
import { useState, useEffect } from 'react';
import { APP_CONFIG } from '../config/constants';

// Network state hook
export const useNetworkState = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable);
      setConnectionType(state.type);
    });

    // Get initial state
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable);
      setConnectionType(state.type);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isConnected,
    isInternetReachable,
    connectionType,
    isOffline: !isConnected || !isInternetReachable,
  };
};

// Retry logic with exponential backoff
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    shouldRetry?: (error: any) => boolean;
    onRetry?: (attempt: number, error: any) => void;
  } = {}
): Promise<T> => {
  const {
    maxAttempts = APP_CONFIG.RETRY.MAX_ATTEMPTS,
    initialDelay = APP_CONFIG.RETRY.INITIAL_DELAY,
    maxDelay = APP_CONFIG.RETRY.MAX_DELAY,
    backoffFactor = APP_CONFIG.RETRY.BACKOFF_FACTOR,
    shouldRetry = () => true,
    onRetry,
  } = options;

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }

      if (onRetry) {
        onRetry(attempt, error);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  throw lastError;
};

// Network-aware API wrapper
export const networkAwareRequest = async <T>(
  request: () => Promise<T>,
  options: {
    requireInternet?: boolean;
    showOfflineError?: boolean;
    offlineErrorMessage?: string;
    enableRetry?: boolean;
    retryOptions?: Parameters<typeof retryWithBackoff>[1];
  } = {}
): Promise<T> => {
  const {
    requireInternet = true,
    showOfflineError = true,
    offlineErrorMessage = 'No internet connection. Please check your network.',
    enableRetry = true,
    retryOptions = {},
  } = options;

  // Check network state
  const networkState = await NetInfo.fetch();
  
  if (requireInternet && (!networkState.isConnected || !networkState.isInternetReachable)) {
    if (showOfflineError) {
      throw new Error(offlineErrorMessage);
    }
    throw new Error('OFFLINE');
  }

  // Execute request with retry if enabled
  if (enableRetry) {
    return retryWithBackoff(request, {
      ...retryOptions,
      shouldRetry: (error) => {
        // Don't retry on client errors (4xx)
        if (error.status && error.status >= 400 && error.status < 500) {
          return false;
        }
        // Retry on network errors
        if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
          return true;
        }
        // Use custom retry logic if provided
        return retryOptions.shouldRetry ? retryOptions.shouldRetry(error) : true;
      },
    });
  }

  return request();
};

// Offline queue for storing actions to be synced later
interface QueuedAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
}

class OfflineQueue {
  private queue: QueuedAction[] = [];
  private processing = false;
  private listeners: ((queue: QueuedAction[]) => void)[] = [];

  async add(type: string, payload: any): Promise<void> {
    const action: QueuedAction = {
      id: `${Date.now()}_${Math.random()}`,
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(action);
    this.notifyListeners();
    
    // Try to process immediately if online
    const networkState = await NetInfo.fetch();
    if (networkState.isConnected) {
      this.process();
    }
  }

  async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
        break;
      }

      const action = this.queue[0];
      
      try {
        // Process action based on type
        await this.processAction(action);
        
        // Remove from queue on success
        this.queue.shift();
        this.notifyListeners();
      } catch (error) {
        action.retryCount++;
        
        if (action.retryCount >= APP_CONFIG.RETRY.MAX_ATTEMPTS) {
          // Remove from queue if max retries exceeded
          this.queue.shift();
          console.error('Failed to process offline action after max retries:', action);
        } else {
          // Move to end of queue
          this.queue.push(this.queue.shift()!);
        }
        
        this.notifyListeners();
        break; // Stop processing on error
      }
    }

    this.processing = false;
  }

  private async processAction(action: QueuedAction): Promise<void> {
    // This should be implemented based on your app's specific actions
    // For example:
    switch (action.type) {
      case 'CREATE_TEAM':
        // await apiService.createTeam(action.payload);
        break;
      case 'UPDATE_PROFILE':
        // await apiService.updateProfile(action.payload);
        break;
      // Add more action types as needed
    }
  }

  subscribe(listener: (queue: QueuedAction[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.queue]));
  }

  getQueue(): QueuedAction[] {
    return [...this.queue];
  }

  clear(): void {
    this.queue = [];
    this.notifyListeners();
  }
}

export const offlineQueue = new OfflineQueue();

// Hook for offline queue
export const useOfflineQueue = () => {
  const [queue, setQueue] = useState<QueuedAction[]>([]);

  useEffect(() => {
    const unsubscribe = offlineQueue.subscribe(setQueue);
    setQueue(offlineQueue.getQueue());
    return unsubscribe;
  }, []);

  return {
    queue,
    addToQueue: (type: string, payload: any) => offlineQueue.add(type, payload),
    processQueue: () => offlineQueue.process(),
    clearQueue: () => offlineQueue.clear(),
  };
};

// Network status component
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export const NetworkStatusBar: React.FC = () => {
  const { isOffline } = useNetworkState();
  const [visible, setVisible] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    if (isOffline) {
      setVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }
  }, [isOffline]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.text}>No Internet Connection</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#dc3545',
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 20,
    zIndex: 1000,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});

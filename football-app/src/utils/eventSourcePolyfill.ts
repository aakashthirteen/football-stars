// EventSource polyfill helper for React Native
import { API_BASE_URL } from '../services/api';

export class SimpleEventSource {
  private url: string;
  private readyState: number = 0; // CONNECTING
  private retryCount: number = 0;
  private maxRetries: number = 5;
  private abortController: AbortController | null = null;
  
  public onopen: ((event?: any) => void) | null = null;
  public onmessage: ((event: { data: string }) => void) | null = null;
  public onerror: ((event?: any) => void) | null = null;

  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;

  constructor(url: string) {
    this.url = url;
    this.connect();
  }

  private async connect() {
    try {
      console.log('🔌 SimpleEventSource: Connecting to', this.url);
      this.readyState = SimpleEventSource.CONNECTING;
      this.abortController = new AbortController();

      const response = await fetch(this.url, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      this.readyState = SimpleEventSource.OPEN;
      console.log('✅ SimpleEventSource: Connected successfully');
      this.onopen?.();

      // Simple polling fallback - check for messages every 2 seconds
      const interval = setInterval(async () => {
        if (this.readyState !== SimpleEventSource.OPEN) {
          clearInterval(interval);
          return;
        }

        // Send a test message
        this.onmessage?.({
          data: JSON.stringify({
            type: 'fallback',
            time: new Date().toISOString(),
            timestamp: Date.now()
          })
        });
      }, 2000);

    } catch (error) {
      console.error('❌ SimpleEventSource: Connection failed:', error);
      this.readyState = SimpleEventSource.CLOSED;
      this.onerror?.(error);

      // Retry logic
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`🔄 SimpleEventSource: Retrying in 2s (attempt ${this.retryCount})`);
        setTimeout(() => this.connect(), 2000);
      }
    }
  }

  close() {
    console.log('🔚 SimpleEventSource: Closing connection');
    this.readyState = SimpleEventSource.CLOSED;
    this.abortController?.abort();
  }
}

// Enhanced polyfill setup for React Native
export function setupEventSourcePolyfill() {
  try {
    // Use react-native-event-source which is specifically designed for React Native
    // Fix: EventSource is the default export, not a named property
    const RNEventSource = require('react-native-event-source');
    global.EventSource = RNEventSource.default || RNEventSource;
    console.log('✅ EventSource polyfill loaded successfully (react-native-event-source)');
    return true;
  } catch (error) {
    console.warn('⚠️ react-native-event-source not available, trying fallback:', error);
    
    try {
      // Check if native EventSource is available
      if (typeof global.EventSource !== 'undefined') {
        console.log('✅ Using native EventSource');
        return true;
      }
      
      // Fallback to our simple implementation
      global.EventSource = SimpleEventSource as any;
      console.log('✅ EventSource fallback polyfill loaded');
      return true;
    } catch (fallbackError) {
      console.warn('⚠️ EventSource polyfill setup failed - app will use polling only:', fallbackError);
      // Don't crash the app - just continue without EventSource
      return false;
    }
  }
}
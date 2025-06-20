import React, { useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { API_BASE_URL } from '../services/api';

export const SSETestButton: React.FC = () => {
  const [status, setStatus] = useState<string>('Not connected');
  const [lastMessage, setLastMessage] = useState<string>('');
  
  const testHealthEndpoint = async () => {
    try {
      console.log('🏥 Testing SSE health endpoint...');
      const url = `${API_BASE_URL}/sse/health`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('🏥 Health response:', data);
      
      if (response.ok) {
        setStatus('Health OK - routes working');
        console.log('✅ SSE routes are accessible');
      } else {
        setStatus(`Health failed: ${response.status}`);
        console.error('❌ SSE health check failed:', response.status);
      }
    } catch (error) {
      console.error('❌ Health test failed:', error);
      setStatus('Health failed - ' + (error as Error).message);
    }
  };

  const testFetchConnection = async () => {
    try {
      console.log('🧪 Testing fetch connection to SSE endpoint...');
      const url = `${API_BASE_URL}/sse/test`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        }
      });
      
      console.log('📡 Fetch response status:', response.status);
      console.log('📡 Fetch response headers:', response.headers);
      
      if (response.ok) {
        setStatus('Fetch OK - endpoint reachable');
        console.log('✅ SSE endpoint is reachable via fetch');
      } else {
        setStatus(`Fetch failed: ${response.status}`);
        console.error('❌ SSE endpoint returned error:', response.status);
      }
    } catch (error) {
      console.error('❌ Fetch test failed:', error);
      setStatus('Fetch failed - ' + (error as Error).message);
    }
  };
  
  const testSSEConnection = () => {
    try {
      console.log('🧪 Testing SSE connection...');
      const url = `${API_BASE_URL}/sse/test`;
      console.log('🧪 SSE Test URL:', url);
      
      // Debug polyfill status
      console.log('🔍 EventSource type:', typeof EventSource);
      console.log('🔍 EventSource constructor:', EventSource);
      console.log('🔍 Global EventSource:', global.EventSource);
      
      // Check if EventSource is available
      if (typeof EventSource === 'undefined') {
        console.error('❌ EventSource not available');
        setStatus('EventSource not available');
        return;
      }
      
      console.log('✅ EventSource constructor available:', typeof EventSource);
      
      const eventSource = new EventSource(url);
      let timeoutRef: NodeJS.Timeout;
      
      console.log('🔍 EventSource created, readyState:', eventSource.readyState);
      setStatus('Connecting...');
      
      eventSource.onopen = () => {
        console.log('✅ SSE Test: Connection opened');
        setStatus('Connected');
        clearTimeout(timeoutRef);
      };
      
      eventSource.onmessage = (event) => {
        console.log('📨 SSE Test: Message received:', event.data);
        setLastMessage(event.data);
        try {
          const data = JSON.parse(event.data);
          setStatus(`Connected - ${data.type || 'message'}`);
        } catch (e) {
          console.error('Failed to parse SSE data:', e);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('❌ SSE Test: Error occurred:', error);
        console.error('❌ SSE Test: ReadyState:', eventSource.readyState);
        setStatus('Error - check console');
        clearTimeout(timeoutRef);
        if (eventSource) {
          eventSource.close();
        }
      };
      
      // Connection timeout
      timeoutRef = setTimeout(() => {
        console.log('⏰ SSE Test: Connection timeout');
        setStatus('Connection timeout');
        if (eventSource) {
          eventSource.close();
        }
      }, 8000);
      
      // Close after 15 seconds
      setTimeout(() => {
        console.log('🔚 SSE Test: Auto-closing connection');
        clearTimeout(timeoutRef);
        if (eventSource) {
          eventSource.close();
        }
        setStatus('Test completed');
      }, 15000);
      
    } catch (error) {
      console.error('❌ SSE Test: Exception:', error);
      setStatus('Failed - ' + (error as Error).message);
    }
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={testHealthEndpoint}>
        <Text style={styles.buttonText}>Test Health</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, {marginTop: 5}]} onPress={testFetchConnection}>
        <Text style={styles.buttonText}>Test Fetch</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, {marginTop: 5}]} onPress={testSSEConnection}>
        <Text style={styles.buttonText}>Test SSE Connection</Text>
      </TouchableOpacity>
      <Text style={styles.status}>Status: {status}</Text>
      {lastMessage ? <Text style={styles.message}>Last: {lastMessage.substring(0, 50)}...</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    margin: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  status: {
    marginTop: 10,
    fontSize: 12,
  },
  message: {
    marginTop: 5,
    fontSize: 10,
    color: '#666',
  },
});
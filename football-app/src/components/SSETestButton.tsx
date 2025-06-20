import React, { useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { API_BASE_URL } from '../services/api';

export const SSETestButton: React.FC = () => {
  const [status, setStatus] = useState<string>('Not connected');
  const [lastMessage, setLastMessage] = useState<string>('');
  
  const testSSEConnection = () => {
    try {
      console.log('🧪 Testing SSE connection...');
      const url = `${API_BASE_URL}/sse/test`;
      console.log('🧪 SSE Test URL:', url);
      
      const eventSource = new EventSource(url);
      
      eventSource.onopen = () => {
        console.log('✅ SSE Test: Connection opened');
        setStatus('Connected');
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
        setStatus('Error - check console');
        eventSource.close();
      };
      
      // Close after 10 seconds
      setTimeout(() => {
        console.log('🔚 SSE Test: Closing connection');
        eventSource.close();
        setStatus('Test completed');
      }, 10000);
      
    } catch (error) {
      console.error('❌ SSE Test: Exception:', error);
      setStatus('Failed - ' + error.message);
    }
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={testSSEConnection}>
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
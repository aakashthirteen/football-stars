import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DebugScreen() {
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (test: string, success: boolean, details: string) => {
    setResults(prev => [...prev, { test, success, details, timestamp: new Date().toISOString() }]);
  };

  const testRailwayHealth = async () => {
    addResult('Railway Health Check', false, 'Testing...');
    try {
      const response = await fetch('https://football-stars-production.up.railway.app/health');
      const data = await response.json();
      addResult('Railway Health Check', true, `Status: ${response.status}, Data: ${JSON.stringify(data)}`);
    } catch (error: any) {
      addResult('Railway Health Check', false, `Error: ${error.message}`);
    }
  };

  const testRailwayAPI = async () => {
    addResult('Railway API Test', false, 'Testing...');
    try {
      const response = await fetch('https://football-stars-production.up.railway.app/api/health');
      const data = await response.text();
      addResult('Railway API Test', response.ok, `Status: ${response.status}, Response: ${data}`);
    } catch (error: any) {
      addResult('Railway API Test', false, `Error: ${error.message}`);
    }
  };

  const testLocalBackend = async () => {
    const ips = ['192.168.0.108', '192.168.1.108', 'localhost', '10.0.2.2'];
    
    for (const ip of ips) {
      try {
        const url = `http://${ip}:3001/health`;
        addResult(`Local Backend (${ip})`, false, 'Testing...');
        const response = await fetch(url, { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        addResult(`Local Backend (${ip})`, true, `Connected! Status: ${data.status}`);
        return;
      } catch (error: any) {
        addResult(`Local Backend (${ip})`, false, `Failed: ${error.message}`);
      }
    }
  };

  const testAsyncStorage = async () => {
    try {
      await AsyncStorage.setItem('test', 'value');
      const value = await AsyncStorage.getItem('test');
      await AsyncStorage.removeItem('test');
      addResult('AsyncStorage', true, `Working! Test value: ${value}`);
    } catch (error: any) {
      addResult('AsyncStorage', false, `Error: ${error.message}`);
    }
  };

  const clearAuthData = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      addResult('Clear Auth Data', true, 'Auth data cleared successfully');
      Alert.alert('Success', 'Auth data cleared. Please restart the app.');
    } catch (error: any) {
      addResult('Clear Auth Data', false, `Error: ${error.message}`);
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setResults([]);
    
    await testAsyncStorage();
    await testRailwayHealth();
    await testRailwayAPI();
    await testLocalBackend();
    
    setIsLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Connection Debugger</Text>
        <Text style={styles.subtitle}>Test your backend connections</Text>
      </View>

      <View style={styles.info}>
        <Ionicons name="information-circle" size={20} color="#2196F3" />
        <Text style={styles.infoText}>
          Currently using: <Text style={styles.bold}>MOCK DATA</Text>
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={runAllTests}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="play-circle" size={20} color="#fff" />
              <Text style={styles.buttonText}>Run All Tests</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={clearAuthData}
        >
          <Ionicons name="trash" size={20} color="#dc3545" />
          <Text style={[styles.buttonText, { color: '#dc3545' }]}>Clear Auth Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.results}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {results.map((result, index) => (
          <View key={index} style={styles.resultItem}>
            <View style={styles.resultHeader}>
              <Ionicons 
                name={result.success ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color={result.success ? "#4CAF50" : "#f44336"} 
              />
              <Text style={styles.resultTest}>{result.test}</Text>
            </View>
            <Text style={styles.resultDetails}>{result.details}</Text>
          </View>
        ))}
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>🔧 Troubleshooting Steps:</Text>
        <Text style={styles.instruction}>1. Make sure Railway backend is deployed and running</Text>
        <Text style={styles.instruction}>2. Check Railway logs for any errors</Text>
        <Text style={styles.instruction}>3. Verify DATABASE_URL is set in Railway</Text>
        <Text style={styles.instruction}>4. For local testing, ensure backend is running on same network</Text>
        <Text style={styles.instruction}>5. Try clearing auth data if login issues persist</Text>
      </View>

      <View style={styles.mockInfo}>
        <Text style={styles.mockTitle}>📱 Using Mock Data</Text>
        <Text style={styles.mockText}>
          The app is currently using mock data, so you can test all features without a backend connection.
        </Text>
        <Text style={styles.mockCredentials}>
          Login: test@test.com / password123
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#2E7D32',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
  },
  bold: {
    fontWeight: 'bold',
  },
  actions: {
    paddingHorizontal: 16,
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#2E7D32',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  results: {
    padding: 16,
    marginTop: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  resultItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  resultTest: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  resultDetails: {
    fontSize: 12,
    color: '#666',
    marginLeft: 28,
  },
  instructions: {
    padding: 16,
    marginTop: 16,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    paddingLeft: 16,
  },
  mockInfo: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    marginBottom: 32,
  },
  mockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 8,
  },
  mockText: {
    fontSize: 14,
    color: '#BF360C',
    marginBottom: 8,
  },
  mockCredentials: {
    fontSize: 14,
    fontWeight: '600',
    color: '#BF360C',
  },
});
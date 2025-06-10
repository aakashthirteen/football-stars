import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('test@test.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Login failed');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      // Try multiple URLs to debug the connection
      const urls = [
        'http://192.168.0.102:3001/health',
        'http://localhost:3001/health'
      ];
      
      let lastError = '';
      for (const url of urls) {
        try {
          console.log('Trying URL:', url);
          const response = await fetch(url, { 
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          const data = await response.json();
          Alert.alert('Connection Test', `✅ Backend reachable at ${url}!\nStatus: ${data.status}`);
          return;
        } catch (error: any) {
          lastError = error.message;
          console.log('Failed URL:', url, error.message);
        }
      }
      
      Alert.alert('Connection Test', `❌ All URLs failed.\nLast error: ${lastError}\n\nTip: Make sure you're on the same WiFi network as your Mac.`);
    } catch (error: any) {
      Alert.alert('Connection Test', `❌ Network error: ${error.message}`);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>MyFootball</Text>
        <Text style={styles.subtitle}>Track your game, level up your play</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.linkText}>
              Don't have an account? Sign up
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#666', marginTop: 20 }]}
            onPress={testConnection}
          >
            <Text style={styles.buttonText}>Test Backend Connection</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 48,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#a5a5a5',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    color: '#2E7D32',
    fontSize: 14,
  },
});
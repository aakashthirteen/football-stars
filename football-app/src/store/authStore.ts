import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { apiService } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phoneNumber: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthState: () => Promise<void>;
  clearAuth: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);
      
      // Handle both old and new token formats for backward compatibility
      const accessToken = response.accessToken || response.token;
      const refreshToken = response.refreshToken || null;
      
      if (!accessToken) {
        throw new Error('No access token received from server');
      }
      
      await AsyncStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        await AsyncStorage.setItem('refreshToken', refreshToken);
      }
      await AsyncStorage.setItem('user', JSON.stringify(response.user));

      set({
        user: response.user,
        token: accessToken,
        refreshToken: refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  register: async (name: string, email: string, password: string, phoneNumber: string) => {
    try {
      const response = await apiService.register(name, email, password, phoneNumber);
      
      // Handle both old and new token formats for backward compatibility
      const accessToken = response.accessToken || response.token;
      const refreshToken = response.refreshToken || null;
      
      if (!accessToken) {
        throw new Error('No access token received from server');
      }
      
      await AsyncStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        await AsyncStorage.setItem('refreshToken', refreshToken);
      }
      await AsyncStorage.setItem('user', JSON.stringify(response.user));

      set({
        user: response.user,
        token: accessToken,
        refreshToken: refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      const { refreshToken } = get();
      
      // Call logout API to revoke refresh token
      if (refreshToken) {
        try {
          await apiService.logout(refreshToken);
        } catch (error) {
          console.warn('Logout API call failed:', error);
        }
      }

      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');

      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  checkAuthState: async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const userData = await AsyncStorage.getItem('user');

      if (accessToken && refreshToken && userData) {
        const user = JSON.parse(userData);
        set({
          user,
          token: accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearAuth: async () => {
    try {
      console.log('Manually clearing all auth data');
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Clear auth error:', error);
    }
  },

  refreshAccessToken: async () => {
    try {
      const { refreshToken } = get();
      if (!refreshToken) {
        return false;
      }

      const response = await apiService.refreshToken(refreshToken);
      
      await AsyncStorage.setItem('accessToken', response.accessToken);
      await AsyncStorage.setItem('refreshToken', response.refreshToken);

      set({
        token: response.accessToken,
        refreshToken: response.refreshToken,
        user: response.user,
      });

      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, clear auth state
      get().clearAuth();
      return false;
    }
  },

  setTokens: async (accessToken: string, refreshToken: string) => {
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    
    set({
      token: accessToken,
      refreshToken,
    });
  },
}));
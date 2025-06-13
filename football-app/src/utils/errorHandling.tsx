import { Alert } from 'react-native';

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  details?: any;
}

export const parseApiError = (error: any): ApiError => {
  // If error is already formatted
  if (error.message) {
    return {
      message: error.message,
      code: error.code,
      field: error.field,
      details: error.details
    };
  }
  
  // Network errors
  if (error.name === 'NetworkError' || !navigator.onLine) {
    return {
      message: 'No internet connection. Please check your network.',
      code: 'NETWORK_ERROR'
    };
  }
  
  // Timeout errors
  if (error.name === 'TimeoutError') {
    return {
      message: 'Request timed out. Please try again.',
      code: 'TIMEOUT'
    };
  }
  
  // Default error
  return {
    message: 'Something went wrong. Please try again.',
    code: 'UNKNOWN_ERROR',
    details: error
  };
};

export const showErrorAlert = (error: any, title: string = 'Error') => {
  const parsedError = parseApiError(error);
  Alert.alert(title, parsedError.message);
};

export const showSuccessAlert = (message: string, title: string = 'Success', onOk?: () => void) => {
  Alert.alert(title, message, [
    { text: 'OK', onPress: onOk }
  ]);
};

export const showConfirmAlert = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
  confirmText: string = 'Confirm',
  cancelText: string = 'Cancel',
  destructive: boolean = false
) => {
  Alert.alert(title, message, [
    {
      text: cancelText,
      style: 'cancel',
      onPress: onCancel
    },
    {
      text: confirmText,
      style: destructive ? 'destructive' : 'default',
      onPress: onConfirm
    }
  ]);
};

// Common error messages
export const errorMessages = {
  network: 'No internet connection. Please check your network.',
  timeout: 'Request timed out. Please try again.',
  serverError: 'Server error. Please try again later.',
  unauthorized: 'Session expired. Please login again.',
  notFound: 'The requested resource was not found.',
  validation: 'Please check your input and try again.',
  generic: 'Something went wrong. Please try again.'
};

// Field-specific error messages
export const fieldErrors = {
  email: {
    required: 'Email is required',
    invalid: 'Please enter a valid email address',
    exists: 'This email is already registered'
  },
  password: {
    required: 'Password is required',
    minLength: 'Password must be at least 6 characters',
    weak: 'Password is too weak',
    mismatch: 'Passwords do not match'
  },
  name: {
    required: 'Name is required',
    minLength: 'Name must be at least 2 characters',
    maxLength: 'Name is too long'
  },
  team: {
    nameRequired: 'Team name is required',
    nameExists: 'A team with this name already exists',
    maxPlayers: 'Team has reached maximum players',
    notFound: 'Team not found'
  },
  match: {
    invalidTeams: 'Please select different teams',
    dateRequired: 'Match date is required',
    pastDate: 'Match date cannot be in the past',
    venueRequired: 'Venue is required'
  },
  tournament: {
    nameRequired: 'Tournament name is required',
    minTeams: 'Tournament requires at least 2 teams',
    maxTeams: 'Tournament is full',
    alreadyRegistered: 'Team is already registered'
  }
};

// Error boundary component
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oops! Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

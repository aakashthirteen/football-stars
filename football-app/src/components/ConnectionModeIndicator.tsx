import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface ConnectionModeIndicatorProps {
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  isPolling?: boolean;
  onTogglePolling?: () => void;
}

export function ConnectionModeIndicator({ 
  connectionStatus, 
  isPolling, 
  onTogglePolling 
}: ConnectionModeIndicatorProps) {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#00D757'; // Green
      case 'connecting': return '#FFA500'; // Orange
      case 'disconnected': return '#FF6B6B'; // Red
      case 'error': return '#FF0000'; // Dark Red
      default: return '#666666'; // Gray
    }
  };

  const getStatusText = () => {
    if (isPolling) return 'POLLING MODE';
    
    switch (connectionStatus) {
      case 'connected': return 'SSE CONNECTED';
      case 'connecting': return 'SSE CONNECTING...';
      case 'disconnected': return 'SSE DISCONNECTED';
      case 'error': return 'SSE ERROR';
      default: return 'UNKNOWN';
    }
  };

  const getDescription = () => {
    if (isPolling) {
      return 'Using 2-second polling for real-time updates';
    }
    
    switch (connectionStatus) {
      case 'connected': return 'Real-time SSE stream active';
      case 'connecting': return 'Establishing SSE connection...';
      case 'disconnected': return 'SSE stream unavailable';
      case 'error': return 'SSE connection failed';
      default: return '';
    }
  };

  return (
    <View style={{
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      borderRadius: 8,
      padding: 12,
      marginVertical: 8,
      borderLeftWidth: 4,
      borderLeftColor: getStatusColor()
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={{
            color: getStatusColor(),
            fontWeight: 'bold',
            fontSize: 12,
            marginBottom: 2
          }}>
            {getStatusText()}
          </Text>
          <Text style={{
            color: '#666',
            fontSize: 11
          }}>
            {getDescription()}
          </Text>
        </View>
        
        {onTogglePolling && (
          <TouchableOpacity
            onPress={onTogglePolling}
            style={{
              backgroundColor: isPolling ? '#00D757' : '#666',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 4
            }}
          >
            <Text style={{
              color: 'white',
              fontSize: 10,
              fontWeight: 'bold'
            }}>
              {isPolling ? 'POLLING' : 'FORCE POLL'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Development Mode Warning */}
      {connectionStatus === 'connecting' && !isPolling && (
        <View style={{
          marginTop: 8,
          padding: 8,
          backgroundColor: 'rgba(255, 165, 0, 0.1)',
          borderRadius: 4
        }}>
          <Text style={{
            color: '#FFA500',
            fontSize: 10,
            fontStyle: 'italic'
          }}>
            💡 If SSE fails in Expo debug mode, try production mode or use polling fallback
          </Text>
        </View>
      )}
    </View>
  );
}
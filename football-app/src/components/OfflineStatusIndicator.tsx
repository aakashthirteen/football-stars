// Offline Status Indicator Component for Football Stars App
// Shows current offline/online status and sync progress

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOfflineMode } from '../hooks/useOfflineMode';

interface OfflineStatusIndicatorProps {
  showDetailedStatus?: boolean;
  position?: 'top' | 'bottom';
  compact?: boolean;
}

export default function OfflineStatusIndicator({
  showDetailedStatus = false,
  position = 'top',
  compact = false,
}: OfflineStatusIndicatorProps) {
  const {
    isOnline,
    syncInProgress,
    offlineMatches,
    storageStats,
    triggerSync,
    clearOldMatches,
    settings,
  } = useOfflineMode();

  const [showModal, setShowModal] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Animate sync indicator
  React.useEffect(() => {
    if (syncInProgress) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [syncInProgress, pulseAnim]);

  const handleManualSync = async () => {
    try {
      const result = await triggerSync();
      
      if (result.success) {
        Alert.alert(
          'Sync Complete',
          `Successfully synced ${result.syncedItems} items.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Sync Issues',
          `Synced ${result.syncedItems} items with ${result.errors} errors. Will retry automatically.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Sync Failed', 'Unable to sync at this time. Please try again later.');
    }
  };

  const handleClearOldMatches = async () => {
    Alert.alert(
      'Clear Old Matches',
      'This will remove old synced matches to free up storage. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const cleared = await clearOldMatches();
            Alert.alert('Success', `Cleared ${cleared} old matches.`);
          },
        },
      ]
    );
  };

  const getStatusColor = (): string => {
    if (syncInProgress) return '#FFC107'; // Yellow for syncing
    if (!isOnline) return '#FF5722'; // Red for offline
    if (storageStats?.queueSize > 0) return '#FF9800'; // Orange for pending
    return '#4CAF50'; // Green for all good
  };

  const getStatusIcon = (): string => {
    if (syncInProgress) return 'sync';
    if (!isOnline) return 'cloud-offline';
    if (storageStats?.queueSize > 0) return 'cloud-upload';
    return 'cloud-done';
  };

  const getStatusText = (): string => {
    if (syncInProgress) return 'Syncing...';
    if (!isOnline) return 'Offline';
    if (storageStats?.queueSize > 0) return `${storageStats.queueSize} pending`;
    return 'Online';
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactIndicator, { backgroundColor: getStatusColor() }]}
        onPress={() => setShowModal(true)}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Ionicons name={getStatusIcon() as any} size={16} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>
    );
  }

  const StatusBar = () => (
    <TouchableOpacity
      style={[
        styles.statusBar,
        position === 'bottom' && styles.statusBarBottom,
        { backgroundColor: getStatusColor() }
      ]}
      onPress={() => setShowModal(true)}
    >
      <Animated.View style={[styles.statusContent, { transform: [{ scale: pulseAnim }] }]}>
        <Ionicons name={getStatusIcon() as any} size={18} color="#FFFFFF" />
        <Text style={styles.statusText}>{getStatusText()}</Text>
        {storageStats && (
          <Text style={styles.statusSubtext}>
            {storageStats.totalMatches} matches • {storageStats.storageUsed}
          </Text>
        )}
      </Animated.View>
      <Ionicons name="chevron-up" size={16} color="#FFFFFF" />
    </TouchableOpacity>
  );

  const DetailedModal = () => (
    <Modal
      visible={showModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowModal(false)}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Offline Status</Text>
          <TouchableOpacity onPress={() => setShowModal(false)}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Current Status */}
          <View style={styles.statusSection}>
            <Text style={styles.sectionTitle}>Current Status</Text>
            <View style={[styles.statusCard, { borderLeftColor: getStatusColor() }]}>
              <View style={styles.statusRow}>
                <Ionicons name={getStatusIcon() as any} size={24} color={getStatusColor()} />
                <View style={styles.statusInfo}>
                  <Text style={styles.statusMainText}>{getStatusText()}</Text>
                  <Text style={styles.statusSubText}>
                    {isOnline ? 'Connected to internet' : 'No internet connection'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Storage Stats */}
          {storageStats && (
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Storage Statistics</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{storageStats.totalMatches}</Text>
                  <Text style={styles.statLabel}>Total Matches</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{storageStats.queueSize}</Text>
                  <Text style={styles.statLabel}>Pending Events</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{storageStats.syncedMatches}</Text>
                  <Text style={styles.statLabel}>Synced</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{storageStats.storageUsed}</Text>
                  <Text style={styles.statLabel}>Storage Used</Text>
                </View>
              </View>
            </View>
          )}

          {/* Last Sync */}
          {storageStats?.lastSync && (
            <View style={styles.syncSection}>
              <Text style={styles.sectionTitle}>Last Sync</Text>
              <Text style={styles.syncTime}>
                {storageStats.lastSync.toLocaleString()}
              </Text>
            </View>
          )}

          {/* Offline Matches */}
          {offlineMatches.length > 0 && (
            <View style={styles.matchesSection}>
              <Text style={styles.sectionTitle}>Offline Matches</Text>
              {offlineMatches.map((match, index) => (
                <View key={match.id} style={styles.matchCard}>
                  <View style={styles.matchHeader}>
                    <Text style={styles.matchTitle}>
                      {match.matchData.homeTeam.name} vs {match.matchData.awayTeam.name}
                    </Text>
                    <View style={[
                      styles.syncStatusBadge,
                      { backgroundColor: getSyncStatusColor(match.metadata.syncStatus) }
                    ]}>
                      <Text style={styles.syncStatusText}>
                        {match.metadata.syncStatus.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.matchDetails}>
                    {match.metadata.eventCount} events • {new Date(match.metadata.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Actions</Text>
            
            <TouchableOpacity
              style={[styles.actionButton, !isOnline && styles.actionButtonDisabled]}
              onPress={handleManualSync}
              disabled={!isOnline || syncInProgress}
            >
              <Ionicons name="sync" size={20} color={!isOnline ? "#666" : "#FFFFFF"} />
              <Text style={[styles.actionButtonText, !isOnline && styles.actionButtonTextDisabled]}>
                {syncInProgress ? 'Syncing...' : 'Manual Sync'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleClearOldMatches}
            >
              <Ionicons name="trash" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Clear Old Matches</Text>
            </TouchableOpacity>
          </View>

          {/* Settings Info */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Auto Sync</Text>
              <Text style={styles.settingValue}>
                {settings.autoSync ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>WiFi Only</Text>
              <Text style={styles.settingValue}>
                {settings.syncOnWifiOnly ? 'Yes' : 'No'}
              </Text>
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Max Offline Matches</Text>
              <Text style={styles.settingValue}>{settings.maxOfflineMatches}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const getSyncStatusColor = (status: string): string => {
    switch (status) {
      case 'synced': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'syncing': return '#2196F3';
      case 'error': return '#FF5722';
      default: return '#9E9E9E';
    }
  };

  return (
    <>
      <StatusBar />
      <DetailedModal />
    </>
  );
}

const styles = StyleSheet.create({
  compactIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  statusBarBottom: {
    marginBottom: 8,
    marginTop: 0,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  statusSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusInfo: {
    marginLeft: 12,
  },
  statusMainText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusSubText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00E676',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  syncSection: {
    marginBottom: 24,
  },
  syncTime: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  matchesSection: {
    marginBottom: 24,
  },
  matchCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  matchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  syncStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  syncStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  matchDetails: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  actionsSection: {
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00E676',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  actionButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionButtonTextDisabled: {
    color: '#666',
  },
  settingsSection: {},
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingLabel: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  settingValue: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
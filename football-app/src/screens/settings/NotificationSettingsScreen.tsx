// Notification Settings Screen for Football Stars App
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationPreferences } from '../../services/notificationService';

interface NotificationSettingsScreenProps {
  navigation: any;
  route: any;
}

export default function NotificationSettingsScreen({ navigation }: NotificationSettingsScreenProps) {
  const { updateNotificationPreferences, getNotificationPreferences } = useNotifications();
  const [preferences, setPreferences] = useState<NotificationPreferences>(getNotificationPreferences());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load current preferences when screen mounts
    setPreferences(getNotificationPreferences());
  }, []);

  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: any) => {
    try {
      const updatedPreferences = { ...preferences, [key]: value };
      setPreferences(updatedPreferences);
      
      setIsSaving(true);
      await updateNotificationPreferences({ [key]: value });
      
      console.log('✅ Notification preference updated:', key, value);
    } catch (error) {
      console.error('❌ Failed to update notification preference:', error);
      Alert.alert('Error', 'Failed to update notification settings. Please try again.');
      
      // Revert the change
      setPreferences(prev => ({ ...prev, [key]: preferences[key] }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuietHoursChange = async (field: 'enabled' | 'startTime' | 'endTime', value: any) => {
    try {
      const updatedQuietHours = { ...preferences.quietHours, [field]: value };
      const updatedPreferences = { ...preferences, quietHours: updatedQuietHours };
      
      setPreferences(updatedPreferences);
      
      setIsSaving(true);
      await updateNotificationPreferences({ quietHours: updatedQuietHours });
      
      console.log('✅ Quiet hours updated:', field, value);
    } catch (error) {
      console.error('❌ Failed to update quiet hours:', error);
      Alert.alert('Error', 'Failed to update quiet hours settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'Are you sure you want to reset all notification settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              const defaultPreferences: NotificationPreferences = {
                matchUpdates: true,
                goalNotifications: true,
                cardNotifications: true,
                substitutionNotifications: true,
                teamInvites: true,
                matchReminders: true,
                sound: true,
                vibration: true,
                quietHours: {
                  enabled: false,
                  startTime: '22:00',
                  endTime: '08:00',
                },
              };
              
              setPreferences(defaultPreferences);
              await updateNotificationPreferences(defaultPreferences);
              
              Alert.alert('Success', 'Notification settings have been reset to defaults.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset notification settings.');
            }
          },
        },
      ]
    );
  };

  const SettingItem = ({ 
    title, 
    description, 
    value, 
    onValueChange, 
    type = 'switch',
    icon 
  }: {
    title: string;
    description?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    type?: 'switch';
    icon?: string;
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        {icon && (
          <Ionicons 
            name={icon as any} 
            size={24} 
            color="#00E676" 
            style={styles.settingIcon} 
          />
        )}
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {description && (
            <Text style={styles.settingDescription}>{description}</Text>
          )}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#767577', true: '#00E676' }}
        thumbColor={value ? '#FFFFFF' : '#f4f3f4'}
        disabled={isSaving}
      />
    </View>
  );

  const SectionHeader = ({ title, icon }: { title: string; icon: string }) => (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon as any} size={20} color="#00E676" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#00E676" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={resetToDefaults}
        >
          <Ionicons name="refresh" size={24} color="#FF5722" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Live Match Events */}
        <SectionHeader title="Live Match Events" icon="football" />
        
        <SettingItem
          title="Match Updates"
          description="Get notified when matches start and end"
          value={preferences.matchUpdates}
          onValueChange={(value) => handlePreferenceChange('matchUpdates', value)}
          icon="play-circle"
        />
        
        <SettingItem
          title="Goal Notifications"
          description="Celebrate every goal with instant alerts"
          value={preferences.goalNotifications}
          onValueChange={(value) => handlePreferenceChange('goalNotifications', value)}
          icon="trophy"
        />
        
        <SettingItem
          title="Card Notifications"
          description="Yellow and red card alerts"
          value={preferences.cardNotifications}
          onValueChange={(value) => handlePreferenceChange('cardNotifications', value)}
          icon="warning"
        />
        
        <SettingItem
          title="Substitution Alerts"
          description="Know when players are substituted"
          value={preferences.substitutionNotifications}
          onValueChange={(value) => handlePreferenceChange('substitutionNotifications', value)}
          icon="swap-horizontal"
        />

        {/* Team & Social */}
        <SectionHeader title="Team & Social" icon="people" />
        
        <SettingItem
          title="Team Invites"
          description="Get notified when you're invited to teams"
          value={preferences.teamInvites}
          onValueChange={(value) => handlePreferenceChange('teamInvites', value)}
          icon="person-add"
        />
        
        <SettingItem
          title="Match Reminders"
          description="15-minute reminders before kickoff"
          value={preferences.matchReminders}
          onValueChange={(value) => handlePreferenceChange('matchReminders', value)}
          icon="alarm"
        />

        {/* Notification Style */}
        <SectionHeader title="Notification Style" icon="settings" />
        
        <SettingItem
          title="Sound"
          description="Play sounds for notifications"
          value={preferences.sound}
          onValueChange={(value) => handlePreferenceChange('sound', value)}
          icon="volume-high"
        />
        
        <SettingItem
          title="Vibration"
          description="Vibrate device for notifications"
          value={preferences.vibration}
          onValueChange={(value) => handlePreferenceChange('vibration', value)}
          icon="phone-portrait"
        />

        {/* Quiet Hours */}
        <SectionHeader title="Quiet Hours" icon="moon" />
        
        <SettingItem
          title="Enable Quiet Hours"
          description="Pause notifications during specified hours"
          value={preferences.quietHours.enabled}
          onValueChange={(value) => handleQuietHoursChange('enabled', value)}
          icon="time"
        />

        {preferences.quietHours.enabled && (
          <View style={styles.quietHoursDetails}>
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Start Time:</Text>
              <TouchableOpacity style={styles.timeButton}>
                <Text style={styles.timeText}>{preferences.quietHours.startTime}</Text>
                <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.7)" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>End Time:</Text>
              <TouchableOpacity style={styles.timeButton}>
                <Text style={styles.timeText}>{preferences.quietHours.endTime}</Text>
                <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.7)" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle" size={20} color="#00E676" />
          <Text style={styles.infoText}>
            Notifications will be sent in real-time during live matches to keep you updated on all the action. 
            You can customize which events you want to be notified about.
          </Text>
        </View>

        {/* Status Indicator */}
        {isSaving && (
          <View style={styles.savingIndicator}>
            <Text style={styles.savingText}>💾 Saving preferences...</Text>
          </View>
        )}
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  resetButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
  quietHoursDetails: {
    marginLeft: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#00E676',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  timeText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: 6,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 30,
    padding: 16,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginLeft: 10,
    flex: 1,
  },
  savingIndicator: {
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    borderRadius: 8,
    alignItems: 'center',
  },
  savingText: {
    fontSize: 14,
    color: '#FFC107',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});
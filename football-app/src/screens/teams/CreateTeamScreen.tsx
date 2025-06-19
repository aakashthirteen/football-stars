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
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { apiService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { ImagePickerComponent } from '../../components';

interface CreateTeamScreenProps {
  navigation: any;
}

export default function CreateTeamScreen({ navigation }: CreateTeamScreenProps) {
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [teamBadge, setTeamBadge] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleBadgeSelected = (imageUri: string) => {
    setTeamBadge(imageUri);
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      Alert.alert('Error', 'Team name is required');
      return;
    }

    setIsLoading(true);
    try {
      let logoUrl: string | undefined;

      // Upload team badge if selected
      if (teamBadge) {
        try {
          console.log('📤 Uploading team badge first...');
          // Create team first to get the ID
          const response = await apiService.createTeam(teamName.trim(), description.trim());
          const teamId = response.team?.id;
          
          if (teamId) {
            // Upload badge with team ID
            const uploadResult = await apiService.uploadTeamBadge(teamBadge, teamId);
            logoUrl = uploadResult.imageUrl;
            
            // Update team with logo URL
            await apiService.updateTeam(teamId, { logoUrl });
            console.log('✅ Team badge uploaded and linked successfully');
          }
          
          Alert.alert(
            '🎉 Team Created!', 
            `Your team "${teamName}" has been created successfully with badge. What would you like to do next?`,
            [
              {
                text: 'Add Players',
                onPress: () => {
                  if (teamId) {
                    navigation.replace('TeamDetails', { teamId });
                  } else {
                    navigation.goBack();
                  }
                },
              },
              {
                text: 'Back to Teams',
                onPress: () => navigation.goBack(),
                style: 'cancel',
              },
            ]
          );
        } catch (uploadError: any) {
          console.error('❌ Badge upload failed:', uploadError);
          Alert.alert(
            'Team Created',
            `Team created successfully but badge upload failed: ${uploadError.message}`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      } else {
        // Create team without badge
        const response = await apiService.createTeam(teamName.trim(), description.trim());
        
        Alert.alert(
          '🎉 Team Created!', 
          `Your team "${teamName}" has been created successfully. What would you like to do next?`,
          [
            {
              text: 'Add Players',
              onPress: () => {
                if (response.team && response.team.id) {
                  navigation.replace('TeamDetails', { teamId: response.team.id });
                } else {
                  navigation.goBack();
                }
              },
            },
            {
              text: 'Back to Teams',
              onPress: () => navigation.goBack(),
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create team');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Create New Team</Text>
            <Text style={styles.subtitle}>Build your dream squad</Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Team Name *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g., Thunderbolts FC"
                placeholderTextColor="#999"
                value={teamName}
                onChangeText={setTeamName}
                autoCapitalize="words"
                maxLength={50}
                editable={!isLoading}
              />
              {teamName.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={() => setTeamName('')}
                  disabled={isLoading}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.charCount}>{teamName.length}/50</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us about your team's vision, goals, or playing style..."
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={200}
              editable={!isLoading}
            />
            <Text style={styles.charCount}>{description.length}/200</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Team Badge (Optional)</Text>
            <View style={styles.badgePickerContainer}>
              <ImagePickerComponent
                onImageSelected={handleBadgeSelected}
                currentImage={teamBadge}
                placeholder="Add Badge"
                size="medium"
                type="badge"
                style={styles.teamBadgePicker}
              />
              <View style={styles.badgeInfo}>
                <Text style={styles.badgeInfoTitle}>Add your team logo</Text>
                <Text style={styles.badgeInfoText}>Upload a square image that represents your team</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>🎯 What you can do with your team:</Text>
            <View style={styles.infoItem}>
              <Ionicons name="football" size={20} color="#2E7D32" />
              <Text style={styles.infoText}>Organize matches and tournaments</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="stats-chart" size={20} color="#2E7D32" />
              <Text style={styles.infoText}>Track team and player statistics</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="people" size={20} color="#2E7D32" />
              <Text style={styles.infoText}>Add up to 25 players to your squad</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="trophy" size={20} color="#2E7D32" />
              <Text style={styles.infoText}>Compete in local tournaments</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.createButton, isLoading && styles.buttonDisabled]}
            onPress={handleCreateTeam}
            disabled={isLoading || !teamName.trim()}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="add-circle" size={24} color="#fff" />
                <Text style={styles.createButtonText}>Create Team</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#2E7D32',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    position: 'absolute',
    left: 24,
    top: 60,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 40,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 4,
  },
  form: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    height: 120,
    paddingTop: 14,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: '#e8f5e8',
    padding: 20,
    borderRadius: 16,
    marginTop: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#2E7D32',
    marginLeft: 12,
    flex: 1,
  },
  createButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#a5a5a5',
    opacity: 0.7,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  badgePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  teamBadgePicker: {
    marginRight: 16,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  badgeInfoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
});
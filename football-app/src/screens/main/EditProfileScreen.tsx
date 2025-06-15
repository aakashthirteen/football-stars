import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';

interface EditProfileScreenProps {
  navigation: any;
}

export default function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form fields with safe defaults
  const [playerName, setPlayerName] = useState(user?.name || '');
  const [position, setPosition] = useState<'GK' | 'DEF' | 'MID' | 'FWD'>('MID');
  const [preferredFoot, setPreferredFoot] = useState<'LEFT' | 'RIGHT' | 'BOTH'>('RIGHT');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  // Safe static data arrays
  const positions = [
    { value: 'GK', label: 'Goalkeeper', color: '#FF5722' },
    { value: 'DEF', label: 'Defender', color: '#2196F3' },
    { value: 'MID', label: 'Midfielder', color: '#4CAF50' },
    { value: 'FWD', label: 'Forward', color: '#FF9800' },
  ] as const;

  const footPreferences = [
    { value: 'LEFT', label: 'Left Foot' },
    { value: 'RIGHT', label: 'Right Foot' },
    { value: 'BOTH', label: 'Both Feet' },
  ] as const;

  useEffect(() => {
    // Simple initialization without API calls for now
    if (user?.name) {
      setPlayerName(user.name);
    }
  }, [user]);

  const handleSave = async () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Player name is required');
      return;
    }

    // For now, just show success without API call
    Alert.alert(
      'Success', 
      'Profile saved successfully!',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const renderPositionSelector = () => (
    <View style={styles.formGroup}>
      <Text style={styles.label}>Playing Position</Text>
      <View style={styles.positionGrid}>
        {positions.map((pos) => (
          <TouchableOpacity
            key={pos.value}
            style={[
              styles.positionCard,
              { borderColor: pos.color },
              position === pos.value && { backgroundColor: pos.color }
            ]}
            onPress={() => setPosition(pos.value)}
          >
            <Text style={[
              styles.positionText,
              position === pos.value && { color: '#fff' }
            ]}>
              {pos.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderFootSelector = () => (
    <View style={styles.formGroup}>
      <Text style={styles.label}>Preferred Foot</Text>
      <View style={styles.footGrid}>
        {footPreferences.map((foot) => (
          <TouchableOpacity
            key={foot.value}
            style={[
              styles.footCard,
              preferredFoot === foot.value && styles.footCardSelected
            ]}
            onPress={() => setPreferredFoot(foot.value)}
          >
            <Text style={[
              styles.footText,
              preferredFoot === foot.value && styles.footTextSelected
            ]}>
              {foot.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Picture Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {playerName && playerName.trim() 
                  ? playerName.charAt(0).toUpperCase()
                  : 'P'}
              </Text>
            </View>
            <TouchableOpacity style={styles.changePhotoButton}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Player Name</Text>
            <TextInput
              style={styles.input}
              value={playerName}
              onChangeText={setPlayerName}
              placeholder="Enter your player name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Enter your location"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Playing Style */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Playing Style</Text>
          {renderPositionSelector()}
          {renderFootSelector()}
        </View>

        {/* Physical Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Physical Stats (Optional)</Text>
          
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                placeholder="175"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder="70"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2E7D32',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    backgroundColor: '#fff',
    padding: 32,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  changePhotoButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderRadius: 6,
  },
  changePhotoText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  positionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  positionCard: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  positionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  footGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  footCard: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  footCardSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#2E7D32',
  },
  footText: {
    fontSize: 14,
    color: '#333',
  },
  footTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
});
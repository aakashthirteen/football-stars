import React, { useState } from 'react';
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';

interface CreateTournamentScreenProps {
  navigation: any;
}

export default function CreateTournamentScreen({ navigation }: CreateTournamentScreenProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tournamentType, setTournamentType] = useState<'LEAGUE' | 'KNOCKOUT' | 'GROUP_STAGE'>('LEAGUE');
  const [maxTeams, setMaxTeams] = useState('8');
  const [entryFee, setEntryFee] = useState('');
  const [prizePool, setPrizePool] = useState('');
  
  // Date fields
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 days from now
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Tournament name is required');
      return;
    }

    if (parseInt(maxTeams) < 2) {
      Alert.alert('Error', 'Tournament must have at least 2 teams');
      return;
    }

    if (endDate <= startDate) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    try {
      setLoading(true);
      
      const tournamentData = {
        name: name.trim(),
        description: description.trim(),
        tournamentType,
        maxTeams: parseInt(maxTeams),
        entryFee: entryFee ? parseFloat(entryFee) : undefined,
        prizePool: prizePool ? parseFloat(prizePool) : undefined,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      await apiService.createTournament(tournamentData);
      
      Alert.alert(
        'Success', 
        'Tournament created successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  const tournamentTypes = [
    { 
      value: 'LEAGUE', 
      label: 'League', 
      description: 'Round-robin format where every team plays every other team',
      icon: '🏆'
    },
    { 
      value: 'KNOCKOUT', 
      label: 'Knockout', 
      description: 'Single elimination tournament bracket',
      icon: '⚔️'
    },
    { 
      value: 'GROUP_STAGE', 
      label: 'Groups + Knockout', 
      description: 'Group stage followed by knockout rounds',
      icon: '🏟️'
    },
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderTypeSelector = () => (
    <View style={styles.formGroup}>
      <Text style={styles.label}>Tournament Type</Text>
      <View style={styles.typeGrid}>
        {tournamentTypes.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.typeCard,
              tournamentType === type.value && styles.typeCardSelected
            ]}
            onPress={() => setTournamentType(type.value as any)}
          >
            <Text style={styles.typeIcon}>{type.icon}</Text>
            <Text style={[
              styles.typeLabel,
              tournamentType === type.value && styles.typeLabelSelected
            ]}>
              {type.label}
            </Text>
            <Text style={[
              styles.typeDescription,
              tournamentType === type.value && styles.typeDescriptionSelected
            ]}>
              {type.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Tournament</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Tournament Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter tournament name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your tournament..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Tournament Format */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tournament Format</Text>
          {renderTypeSelector()}
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Maximum Teams</Text>
            <TextInput
              style={styles.input}
              value={maxTeams}
              onChangeText={setMaxTeams}
              placeholder="8"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Start Date</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={styles.dateText}>{formatDate(startDate)}</Text>
              <Text style={styles.dateIcon}>📅</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>End Date</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text style={styles.dateText}>{formatDate(endDate)}</Text>
              <Text style={styles.dateIcon}>📅</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Prize Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prize Details (Optional)</Text>
          
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Entry Fee (₹)</Text>
              <TextInput
                style={styles.input}
                value={entryFee}
                onChangeText={setEntryFee}
                placeholder="0"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Prize Pool (₹)</Text>
              <TextInput
                style={styles.input}
                value={prizePool}
                onChangeText={setPrizePool}
                placeholder="0"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Tournament Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewIcon}>
                {tournamentTypes.find(t => t.value === tournamentType)?.icon}
              </Text>
              <View style={styles.previewInfo}>
                <Text style={styles.previewName}>
                  {name || 'Tournament Name'}
                </Text>
                <Text style={styles.previewType}>
                  {tournamentTypes.find(t => t.value === tournamentType)?.label}
                </Text>
              </View>
            </View>
            
            <View style={styles.previewDetails}>
              <Text style={styles.previewDetail}>
                📅 {formatDate(startDate)} - {formatDate(endDate)}
              </Text>
              <Text style={styles.previewDetail}>
                👥 Max {maxTeams} teams
              </Text>
              {prizePool && (
                <Text style={styles.previewDetail}>
                  💰 ₹{parseFloat(prizePool).toLocaleString()} prize pool
                </Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) {
              setEndDate(selectedDate);
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  createButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
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
  typeGrid: {
    gap: 12,
  },
  typeCard: {
    padding: 16,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  typeCardSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#f8fff8',
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  typeLabelSelected: {
    color: '#2E7D32',
  },
  typeDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  typeDescriptionSelected: {
    color: '#2E7D32',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  dateIcon: {
    fontSize: 16,
  },
  previewCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  previewType: {
    fontSize: 14,
    color: '#666',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  previewDetails: {
    gap: 6,
  },
  previewDetail: {
    fontSize: 14,
    color: '#666',
  },
});
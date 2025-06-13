import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiService } from '../../services/api';

interface CreateMatchScreenProps {
  navigation: any;
}

interface Team {
  id: string;
  name: string;
  players: any[];
}

export default function CreateMatchScreen({ navigation }: CreateMatchScreenProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const [venue, setVenue] = useState('');
  const [matchDate, setMatchDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [duration, setDuration] = useState('90');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      console.log('🏟️ Loading teams for match creation...');
      const response = await apiService.getTeams();
      console.log('📊 Teams response:', response);
      const teamsArray = response.teams || [];
      console.log(`✅ Found ${teamsArray.length} teams available for matches`);
      setTeams(teamsArray);
    } catch (error) {
      console.error('❌ Error loading teams:', error);
      Alert.alert('Error', 'Failed to load teams');
    }
  };

  const handleCreateMatch = async () => {
    if (!homeTeam || !awayTeam) {
      Alert.alert('Error', 'Please select both home and away teams');
      return;
    }

    if (homeTeam.id === awayTeam.id) {
      Alert.alert('Error', 'Home and away teams must be different');
      return;
    }

    setIsLoading(true);
    try {
      const matchData = {
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        venue: venue.trim(),
        matchDate: matchDate.toISOString(),
        duration: parseInt(duration) || 90,
      };

      console.log('🏗️ Creating match with data:', matchData);
      const response = await apiService.createMatch(matchData);
      console.log('✅ Match created successfully:', response);
      
      if (!response || !response.match || !response.match.id) {
        throw new Error('Invalid response from server - no match ID received');
      }
      
      Alert.alert('Success', 'Match created successfully!', [
        {
          text: 'View Match',
          onPress: () => {
            navigation.replace('MatchScoring', { 
              matchId: response.match.id,
              isNewMatch: true 
            });
          },
        },
        {
          text: 'Back to Matches',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('❌ Error creating match:', error);
      Alert.alert(
        'Error', 
        error.message || 'Failed to create match. Please try again.',
        [
          { text: 'Retry', onPress: () => handleCreateMatch() },
          { text: 'Cancel' }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderTeamSelector = (
    title: string,
    selectedTeam: Team | null,
    onSelect: (team: Team) => void,
    excludeTeam?: Team
  ) => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorTitle}>{title}</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.teamSelector}
      >
        {teams
          .filter(team => excludeTeam ? team.id !== excludeTeam.id : true)
          .map((team) => (
            <TouchableOpacity
              key={team.id}
              style={[
                styles.teamOption,
                selectedTeam?.id === team.id && styles.selectedTeam,
              ]}
              onPress={() => onSelect(team)}
            >
              <Text style={[
                styles.teamOptionText,
                selectedTeam?.id === team.id && styles.selectedTeamText,
              ]}>
                {team.name}
              </Text>
              <Text style={[
                styles.playersCount,
                selectedTeam?.id === team.id && styles.selectedPlayersCount,
              ]}>
                {team.players.length} players
              </Text>
            </TouchableOpacity>
          ))}
      </ScrollView>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create New Match</Text>
      </View>

      <View style={styles.form}>
        {/* Team Selection */}
        {renderTeamSelector('Home Team', homeTeam, setHomeTeam)}
        
        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>VS</Text>
        </View>
        
        {renderTeamSelector('Away Team', awayTeam, setAwayTeam, homeTeam)}

        {/* Match Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Match Details</Text>
          
          <Text style={styles.label}>Venue (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Central Park, Home Ground"
            value={venue}
            onChangeText={setVenue}
            maxLength={100}
          />

          <Text style={styles.label}>Match Date & Time</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              📅 {matchDate.toLocaleDateString()} at {matchDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={matchDate}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setMatchDate(selectedDate);
                }
              }}
            />
          )}

          <Text style={styles.label}>Duration (minutes)</Text>
          <TextInput
            style={styles.input}
            placeholder="90"
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
            maxLength={3}
          />
        </View>

        {/* Match Preview */}
        {homeTeam && awayTeam && (
          <View style={styles.preview}>
            <Text style={styles.previewTitle}>Match Preview</Text>
            <View style={styles.previewMatch}>
              <View style={styles.previewTeam}>
                <Text style={styles.previewTeamName}>{homeTeam.name}</Text>
                <Text style={styles.previewTeamRole}>Home</Text>
              </View>
              <Text style={styles.previewVs}>vs</Text>
              <View style={styles.previewTeam}>
                <Text style={styles.previewTeamName}>{awayTeam.name}</Text>
                <Text style={styles.previewTeamRole}>Away</Text>
              </View>
            </View>
            {venue && (
              <Text style={styles.previewVenue}>📍 {venue}</Text>
            )}
            <Text style={styles.previewDate}>
              🕐 {matchDate.toLocaleDateString()} at {matchDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.buttonDisabled]}
          onPress={handleCreateMatch}
          disabled={isLoading || !homeTeam || !awayTeam}
        >
          <Text style={styles.createButtonText}>
            {isLoading ? 'Creating Match...' : '⚽ Create Match'}
          </Text>
        </TouchableOpacity>
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
    backgroundColor: '#2E7D32',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  form: {
    padding: 24,
  },
  selectorContainer: {
    marginBottom: 24,
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  teamSelector: {
    flexDirection: 'row',
  },
  teamOption: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 140,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  selectedTeam: {
    borderColor: '#2E7D32',
    backgroundColor: '#e8f5e8',
  },
  teamOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectedTeamText: {
    color: '#2E7D32',
  },
  playersCount: {
    fontSize: 14,
    color: '#666',
  },
  selectedPlayersCount: {
    color: '#2E7D32',
  },
  vsContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  vsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
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
  dateButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  preview: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 16,
    textAlign: 'center',
  },
  previewMatch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewTeam: {
    flex: 1,
    alignItems: 'center',
  },
  previewTeamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  previewTeamRole: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
  },
  previewVs: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginHorizontal: 16,
  },
  previewVenue: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  previewDate: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  createButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonDisabled: {
    backgroundColor: '#a5a5a5',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});